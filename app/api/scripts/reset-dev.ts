import { SQL } from "bun";
import { migrate } from "./migrate";

const schema = process.argv.find(v => v.startsWith("--schema="))?.slice(9);
if (Bun.env.NODE_ENV !== "development" || Bun.env.PMO_ALLOW_RESET !== "pmo_cusn" || schema !== "pmo_cusn") {
  throw new Error("Reset exige NODE_ENV=development, PMO_ALLOW_RESET=pmo_cusn y --schema=pmo_cusn.");
}
const url = Bun.env.MIGRATOR_DATABASE_URL;
if (!url) throw new Error("Falta MIGRATOR_DATABASE_URL.");
const target = new URL(url);
if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || decodeURIComponent(target.pathname.slice(1)) !== Bun.env.PMO_DEV_DATABASE) {
  throw new Error("Reset limitado a loopback y al nombre exacto PMO_DEV_DATABASE.");
}
const sql = new SQL({ url, max: 1 });
try {
  await sql.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(81420261102)`;
    const [identity]=await tx<{name:string}>`SELECT current_database() AS name`;
    if(identity?.name!==Bun.env.PMO_DEV_DATABASE)throw new Error("La BD efectiva difiere de PMO_DEV_DATABASE.");
    // Recorrer dependencias transitivas: vistas, FKs, tipos y funciones externas
    // también bloquearían un CASCADE más allá de los objetos de la aplicación.
    const external = await tx`WITH RECURSIVE affected(classid,objid,objsubid) AS (
      SELECT 'pg_namespace'::regclass::oid,oid,0 FROM pg_namespace WHERE nspname='pmo_cusn'
      UNION SELECT d.classid,d.objid,d.objsubid FROM pg_depend d JOIN affected a
        ON d.refclassid=a.classid AND d.refobjid=a.objid AND (a.objsubid=0 OR d.refobjsubid=a.objsubid)
    ) SELECT o.type,o.schema,o.identity FROM affected a
      CROSS JOIN LATERAL pg_identify_object(a.classid,a.objid,a.objsubid) o
      WHERE o.schema IS NOT NULL AND o.schema NOT IN ('pmo_cusn','pg_toast')`;
    if (external.length) throw new Error("Dependencias no soportadas; reset bloqueado.");
    const fks = await tx`SELECT 1 FROM pg_constraint c
      JOIN pg_class s ON s.oid=c.conrelid JOIN pg_namespace sn ON sn.oid=s.relnamespace
      JOIN pg_class t ON t.oid=c.confrelid JOIN pg_namespace tn ON tn.oid=t.relnamespace
      WHERE tn.nspname='pmo_cusn' AND sn.nspname <> 'pmo_cusn'`;
    const views = await tx`SELECT 1 FROM pg_depend d JOIN pg_class c ON d.refclassid='pg_class'::regclass AND d.refobjid=c.oid
      JOIN pg_namespace n ON c.relnamespace=n.oid
      JOIN pg_rewrite r ON d.classid='pg_rewrite'::regclass AND r.oid=d.objid
      JOIN pg_class v ON v.oid=r.ev_class JOIN pg_namespace vn ON vn.oid=v.relnamespace
      WHERE n.nspname='pmo_cusn' AND vn.nspname <> 'pmo_cusn'`;
    if (fks.length || views.length) throw new Error("Dependencias externas; reset bloqueado.");
    await tx`DROP SCHEMA IF EXISTS pmo_cusn CASCADE`;
    await tx`DELETE FROM pmo_cusn_meta.migracion`;
    await tx`DROP TABLE IF EXISTS pmo_cusn_meta.importacion`;
  });
  await migrate(sql);
} finally { await sql.close(); }
