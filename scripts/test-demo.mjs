import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

// Run the actual pure TypeScript selectors/record boundary with an isolated storage.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stored = new Map();
let unavailable = false;
const context = createContext({ localStorage: { getItem: key => stored.get(key) ?? null, setItem: (key, value) => { if (unavailable) throw new Error("quota"); stored.set(key, value); } } });
const cache = new Map();
async function load(path) {
  if (!extname(path)) path = existsSync(`${path}.ts`) ? `${path}.ts` : resolve(path, "index.ts");
  if (cache.has(path)) return cache.get(path);
  const source = readFileSync(path, "utf8");
  const module = path.endsWith(".json")
    ? new SyntheticModule(["default"], function () { this.setExport("default", JSON.parse(source)); }, { context, identifier: path })
    : new SourceTextModule(stripTypeScriptTypes(source), { context, identifier: path });
  cache.set(path, module);
  await module.link((specifier, parent) => load(resolve(dirname(parent.identifier), specifier)));
  return module;
}
async function use(path) { const module = await load(resolve(root, path)); if (module.status !== "evaluated") await module.evaluate(); return module.namespace; }
const data = await use("src/demo/data/index.ts"), records = await use("src/demo/records.ts"), finance = await use("src/demo/finance.ts");
const cases = [];
function check(name, run) { run(); cases.push(name); }
const legacy = { id: "PRJ-ANTERIOR", name: "Proyecto previo", clientId: data.clients[0].id, managerId: data.projects[0].managerId, country: data.projects[0].country, lob: "LOB histórica", status: "Requiere P1P2", description: "", startDate: "", plannedEndDate: "" };
const created = { ...legacy, id: "PRJ-NUEVO", lob: data.catalogs.lobs[0].label, lobId: data.catalogs.lobs[0].id, serviceId: data.catalogs.services[0].id, squadId: data.catalogs.squads[0].id, techLeadId: data.catalogs.squads[0].techLeadId };
const risk = { title: "Riesgo local", description: "Causa ficticia", type: "Amenaza", ownerId: data.projects[0].managerId, scopeType: "Proyecto", projectId: created.id, scopes: ["Plazo"], probability: 4, impact: 3, strategy: "Mitigar", responsePlan: "", trigger: "", contingency: "", contingencyPrepared: false, nextReviewAt: "", categoryId: data.catalogs.riskCategories[0].id };
check("Lectura v1 conserva LOB libre y migra al guardar sin perder registros", () => {
  const { categoryId: _categoryId, ...oldRisk } = risk;
  stored.set(records.localRecordsKey, JSON.stringify({ version: 1, projects: [legacy], risks: [{ id: "RSK-998", reviewId: "RRV-998", eventId: "EVT-998", draft: { ...oldRisk, projectId: legacy.id } }] }));
  const loaded = records.loadRecords(); assert.equal(loaded.issue, ""); assert.equal(loaded.records.projects[0].lob, legacy.lob);
  assert.equal(records.projectError(created, [...data.projects, ...loaded.records.projects]), "");
  loaded.records.projects.push(created);
  loaded.records.risks.push({ id: "RSK-999", reviewId: "RRV-999", eventId: "EVT-999", draft: risk });
  assert.equal(records.saveRecords(loaded.records), "");
  assert.equal(JSON.parse(stored.get(records.localRecordsKey)).version, 2);
  const restored = records.loadRecords(); assert.equal(restored.issue, ""); assert.equal(restored.records.projects.length, 2); assert.equal(restored.records.risks.length, 2); assert.equal(restored.records.risks[0].draft.categoryId, undefined); assert.equal(restored.records.risks[1].draft.categoryId, risk.categoryId);
});
check("Proyectos nuevos: duplicados, servicio ajeno y métricas ausentes", () => {
  assert.match(records.projectError({ ...created, id: data.projects[0].id }, data.projects), /existe/);
  assert.match(records.projectError({ ...created, serviceId: data.catalogs.services.find(row => row.lobId !== created.lobId).id }, []), /servicio/);
  assert.equal(records.localProject(created).budgetAmount, null); assert.equal(data.getProjectMetrics(created.id).spi, null);
});
check("Riesgos nuevos: relaciones, categoría, escala entera y tipo/estrategia", () => {
  assert.equal(records.riskError(risk, [created]), "");
  assert.match(records.riskError({ ...risk, probability: 2.5 }, [created]), /enteros/);
  assert.match(records.riskError({ ...risk, impact: 6 }, [created]), /enteros/);
  assert.match(records.riskError({ ...risk, projectId: "HUERFANO" }, [created]), /proyecto/);
  assert.match(records.riskError({ ...risk, categoryId: "INVALIDA" }, [created]), /categoría/);
  assert.match(records.riskError({ ...risk, type: "Oportunidad" }, [created]), /compatibles/);
  assert.equal(records.riskError({ ...risk, scopeType: "Transversal", projectId: null }, []), "");
});
check("Persistencia fallida no sustituye el registro anterior; lectura corrupta no borra", () => {
  const previous = stored.get(records.localRecordsKey); unavailable = true;
  assert.match(records.saveRecords({ projects: [], risks: [] }), /No se pudo guardar/); assert.equal(stored.get(records.localRecordsKey), previous); unavailable = false;
  stored.set(records.localRecordsKey, '{"version":999}'); assert.match(records.loadRecords().issue, /validar/); assert.equal(stored.get(records.localRecordsKey), '{"version":999}');
});
check("Finanzas: monedas aisladas, suma de fuentes = tabla = meses; delta comparable", () => {
  const ids = data.projects.map(row => row.id), sum = values => values.some(value => value !== null) ? values.reduce((a, b) => a + (b ?? 0), 0) : null;
  for (const currency of new Set(data.billingMilestones.map(row => row.currency))) {
    const model = finance.financeModel(ids, currency), source = data.billingMilestones.filter(row => row.currency === currency);
    for (const [key, field] of [["showPricing", "showPricingAmount"], ["planned", "plannedAmount"], ["actual", "actualAmount"]]) {
      assert.equal(model[key], sum(source.map(row => row[field]))); assert.equal(model[key], sum(model.rows.map(row => row[key]))); assert.equal(model[key], sum(model.months.map(row => row[key])));
    }
    assert.equal(model.difference, sum(model.rows.map(row => row.actual !== null && row.planned !== null ? row.actual - row.planned : null)));
    for (const month of model.months) { const filtered = finance.financeModel(ids, currency, month.period); assert.equal(filtered.actual, month.actual); }
  }
});
check("Finanzas: cero explícito, ausencia, real no proyectado y compras separadas", () => {
  const zero = data.billingMilestones.find(row => row.actualAmount === 0), missing = data.billingMilestones.find(row => row.actualAmount === null);
  assert.equal(finance.financeModel([zero.projectId], zero.currency, zero.actualDate.slice(0, 7)).actual, 0);
  assert.equal(finance.financeModel([missing.projectId], missing.currency, missing.plannedDate.slice(0, 7)).actual, null);
  assert.equal(finance.financeModel([created.id], "PEN").showPricing, null);
  assert.equal(finance.sumKnown([null, null]), null); assert.equal(finance.sumKnown([null, 0]), 0);
  const model = finance.financeModel(data.projects.map(row => row.id), "PEN");
  assert.equal(model.costs.actual, data.purchases.filter(row => row.currency === "PEN").reduce((sum, row) => sum + (row.actualAmount ?? 0), 0));
});
console.log(`Pruebas de demo: ${cases.length}/${cases.length} correctas.\n${cases.map(name => `- ${name}`).join("\n")}`);
