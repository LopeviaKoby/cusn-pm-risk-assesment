import { SQL } from "bun";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

type ManifestTable = { tabla: string; archivo: string; filas: number; columnas: number };
type Manifest = { carga_ordenada: string[]; tablas: ManifestTable[] };

const sampleDir = process.argv[2] ?? Bun.env.PMO_SAMPLE_DIR;
if (!sampleDir) {
  console.error("Indica la carpeta pmo_seed_20pct o define PMO_SAMPLE_DIR.");
  process.exit(1);
}
const root = resolve(sampleDir);
const manifest = JSON.parse(readFileSync(join(root, "manifiesto.json"), "utf8")) as Manifest;
const url = Bun.env.MIGRATOR_DATABASE_URL;
if (!url) {
  console.error("Falta MIGRATOR_DATABASE_URL.");
  process.exit(1);
}

const quote = (name: string) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error(`Identificador no válido: ${name}`);
  return `"${name}"`;
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(rows => rows.length > 1 || (rows.length === 1 && rows[0] !== ""));
}

const sql = new SQL({ url, max: 2, connectionTimeout: 15 });
const tableByName = new Map(manifest.tablas.map(table => [table.tabla, table]));
let totalRows = 0;

try {
  const available = await sql<{ table_name: string }>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'pmo' AND table_type = 'BASE TABLE'
  `;
  const allowedTables = new Set(available.map(row => row.table_name));
  for (const table of manifest.carga_ordenada) {
    if (!allowedTables.has(table)) throw new Error(`La tabla ${table} no existe en el esquema pmo.`);
  }

  await sql.begin(async tx => {
    await tx.unsafe(`TRUNCATE ${manifest.carga_ordenada.map(table => `pmo.${quote(table)}`).join(", ")} RESTART IDENTITY CASCADE`);

    for (const table of manifest.carga_ordenada) {
      const entry = tableByName.get(table);
      if (!entry) throw new Error(`Falta la entrada de manifiesto para ${table}.`);
      const rows = parseCsv(readFileSync(join(root, entry.archivo), "utf8"));
      const header = rows.shift()?.map(value => value.trim());
      if (!header) throw new Error(`CSV vacío: ${entry.archivo}`);
      const columns = await tx<{ column_name: string }>`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'pmo' AND table_name = ${table}
      `;
      const allowedColumns = new Set(columns.map(row => row.column_name));
      for (const column of header) {
        if (!allowedColumns.has(column)) throw new Error(`Columna ${column} no existe en pmo.${table}.`);
      }
      if (rows.length !== entry.filas) {
        throw new Error(`${entry.archivo}: ${rows.length} filas, manifiesto ${entry.filas}.`);
      }
      const hasId = header.includes("id");
      const prefix = `INSERT INTO pmo.${quote(table)} (${header.map(quote).join(", ")})${hasId ? " OVERRIDING SYSTEM VALUE" : ""} VALUES `;

      for (let index = 0; index < rows.length; index += 100) {
        const batch = rows.slice(index, index + 100);
        const parameters: unknown[] = [];
        const values = batch.map(row => {
          if (row.length !== header.length) throw new Error(`${entry.archivo}: fila con ${row.length} columnas; se esperaban ${header.length}.`);
          return `(${row.map(value => {
            parameters.push(value === "" ? null : value);
            return `$${parameters.length}`;
          }).join(", ")})`;
        }).join(", ");
        await tx.unsafe(prefix + values, parameters);
        totalRows += batch.length;
      }

      if (hasId) {
        const sequences = await tx<{ sequence: string | null }>`SELECT pg_get_serial_sequence(${`pmo.${table}`}, 'id') AS sequence`;
        const sequence = sequences[0]?.sequence;
        if (sequence) {
          await tx.unsafe(
            `SELECT setval($1, GREATEST((SELECT COALESCE(MAX(id), 1) FROM pmo.${quote(table)}), 1), true)`,
            [sequence],
          );
        }
      }
      console.log(`+ ${table}: ${rows.length} filas`);
    }
  });

  console.log("\nVerificación de conteos:");
  for (const table of manifest.carga_ordenada) {
    const result = await sql.unsafe<{ count: string }[]>(`SELECT count(*)::text AS count FROM pmo.${quote(table)}`);
    const count = Number(result[0]?.count ?? 0);
    const expected = tableByName.get(table)?.filas ?? 0;
    console.log(`${count === expected ? "PASS" : "FAIL"} ${table}: ${count}/${expected}`);
    if (count !== expected) process.exitCode = 1;
  }
  console.log(`\nImportación completa: ${totalRows} filas.`);
} catch (error) {
  console.error(`Importación fallida: ${error instanceof Error ? error.message : "error desconocido"}`);
  process.exitCode = 1;
} finally {
  await sql.close({ timeout: 5 });
}
