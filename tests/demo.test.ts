import { beforeEach, expect, test, vi } from "vitest";
import * as data from "../src/demo/data";
import * as records from "../src/demo/records";
import * as finance from "../src/demo/finance";
import type { ProjectDraft, ManualRiskDraft } from "../src/demo/records";

const stored = new Map<string, string>();
let unavailable = false;
beforeEach(() => {
  stored.clear(); unavailable = false;
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => { if (unavailable) throw new Error("quota"); stored.set(key, value); },
  });
});
const legacy: ProjectDraft = { id: "PRJ-ANTERIOR", name: "Proyecto previo", clientId: data.clients[0]!.id, managerId: data.projects[0]!.managerId, country: data.projects[0]!.country, lob: "LOB histórica", status: "Requiere P1P2", description: "", startDate: "", plannedEndDate: "" };
const created: ProjectDraft = { ...legacy, id: "PRJ-NUEVO", lob: data.catalogs.lobs[0]!.label, lobId: data.catalogs.lobs[0]!.id, serviceId: data.catalogs.services[0]!.id, squadId: data.catalogs.squads[0]!.id, techLeadId: data.catalogs.squads[0]!.techLeadId };
const risk: ManualRiskDraft = { title: "Riesgo local", description: "Causa ficticia", type: "Amenaza", ownerId: data.projects[0]!.managerId, scopeType: "Proyecto", projectId: created.id, scopes: ["Plazo"], probability: 4, impact: 3, strategy: "Mitigar", responsePlan: "", trigger: "", contingency: "", contingencyPrepared: false, nextReviewAt: "", categoryId: data.catalogs.riskCategories[0]!.id };

test("Lectura v1 conserva LOB libre y migra al guardar sin perder registros", () => {
  const { categoryId: _categoryId, ...oldRisk } = risk;
  stored.set(records.localRecordsKey, JSON.stringify({ version: 1, projects: [legacy], risks: [{ id: "RSK-998", reviewId: "RRV-998", eventId: "EVT-998", draft: { ...oldRisk, projectId: legacy.id } }] }));
  const loaded = records.loadRecords(); expect(loaded.issue).toBe(""); expect(loaded.records.projects[0]!.lob).toBe(legacy.lob);
  expect(records.projectError(created, [...data.projects, ...loaded.records.projects])).toBe("");
  loaded.records.projects.push(created);
  loaded.records.risks.push({ id: "RSK-999", reviewId: "RRV-999", eventId: "EVT-999", draft: risk });
  expect(records.saveRecords(loaded.records)).toBe("");
  expect(JSON.parse(stored.get(records.localRecordsKey)!).version).toBe(2);
  const restored = records.loadRecords(); expect(restored.issue).toBe(""); expect(restored.records.projects).toHaveLength(2); expect(restored.records.risks).toHaveLength(2);
  expect(restored.records.risks[0]!.draft.categoryId).toBeUndefined(); expect(restored.records.risks[1]!.draft.categoryId).toBe(risk.categoryId);
});
test("Proyectos nuevos: duplicados, servicio ajeno y métricas ausentes", () => {
  expect(records.projectError({ ...created, id: data.projects[0]!.id }, data.projects)).toMatch(/existe/);
  expect(records.projectError({ ...created, serviceId: data.catalogs.services.find(row => row.lobId !== created.lobId)!.id }, [])).toMatch(/servicio/);
  expect(records.localProject(created).budgetAmount).toBeNull(); expect(data.getProjectMetrics(created.id).spi).toBeNull();
});
test("Riesgos nuevos: relaciones, categoría, escala entera y tipo/estrategia", () => {
  expect(records.riskError(risk, [created])).toBe("");
  expect(records.riskError({ ...risk, probability: 2.5 }, [created])).toMatch(/enteros/);
  expect(records.riskError({ ...risk, impact: 6 }, [created])).toMatch(/enteros/);
  expect(records.riskError({ ...risk, projectId: "HUERFANO" }, [created])).toMatch(/proyecto/);
  expect(records.riskError({ ...risk, categoryId: "INVALIDA" }, [created])).toMatch(/categoría/);
  expect(records.riskError({ ...risk, type: "Oportunidad" }, [created])).toMatch(/compatibles/);
  expect(records.riskError({ ...risk, scopeType: "Transversal", projectId: null }, [])).toBe("");
});
test("Persistencia fallida no sustituye el registro anterior; lectura corrupta no borra", () => {
  stored.set(records.localRecordsKey, "previous"); unavailable = true;
  expect(records.saveRecords({ projects: [], risks: [] })).toMatch(/No se pudo guardar/); expect(stored.get(records.localRecordsKey)).toBe("previous"); unavailable = false;
  stored.set(records.localRecordsKey, '{"version":999}'); expect(records.loadRecords().issue).toMatch(/validar/); expect(stored.get(records.localRecordsKey)).toBe('{"version":999}');
});
test("Finanzas: monedas aisladas, suma de fuentes = tabla = meses; delta comparable", () => {
  const ids = data.projects.map(row => row.id);
  const sum = (values: (number | null)[]) => values.some(value => value !== null) ? values.reduce<number>((a, b) => a + (b ?? 0), 0) : null;
  for (const currency of new Set(data.billingMilestones.map(row => row.currency))) {
    const model = finance.financeModel(ids, currency), source = data.billingMilestones.filter(row => row.currency === currency);
    for (const [key, field] of [["showPricing", "showPricingAmount"], ["planned", "plannedAmount"], ["actual", "actualAmount"]] as const) {
      expect(model[key]).toBe(sum(source.map(row => row[field]))); expect(model[key]).toBe(sum(model.rows.map(row => row[key]))); expect(model[key]).toBe(sum(model.months.map(row => row[key])));
    }
    expect(model.difference).toBe(sum(model.rows.map(row => row.actual !== null && row.planned !== null ? row.actual - row.planned : null)));
    for (const month of model.months) expect(finance.financeModel(ids, currency, month.period).actual).toBe(month.actual);
  }
});
test("Finanzas: cero explícito, ausencia, real no proyectado y compras separadas", () => {
  const zero = data.billingMilestones.find(row => row.actualAmount === 0)!, missing = data.billingMilestones.find(row => row.actualAmount === null)!;
  expect(finance.financeModel([zero.projectId], zero.currency, zero.actualDate!.slice(0, 7)).actual).toBe(0);
  expect(finance.financeModel([missing.projectId], missing.currency, missing.plannedDate!.slice(0, 7)).actual).toBeNull();
  expect(finance.financeModel([created.id], "PEN").showPricing).toBeNull();
  expect(finance.sumKnown([null, null])).toBeNull(); expect(finance.sumKnown([null, 0])).toBe(0);
  expect(finance.financeModel(data.projects.map(row => row.id), "PEN").costs.actual).toBe(data.purchases.filter(row => row.currency === "PEN").reduce((sum, row) => sum + (row.actualAmount ?? 0), 0));
});
test("Lecturas inválidas conservan el original y validaciones cubren los límites", () => {
  expect(records.loadRecords().issue).toBe("");
  for (const value of ["{", "null", '{"version":2,"projects":{},"risks":[]}']) {
    stored.set(records.localRecordsKey, value); expect(records.loadRecords().issue).not.toBe(""); expect(stored.get(records.localRecordsKey)).toBe(value);
  }
  for (const patch of [{ id: "" }, { name: "" }, { clientId: "bad" }, { managerId: "bad" }, { country: "bad" }, { lobId: "bad" }, { squadId: "bad" }, { techLeadId: "bad" }, { complexity: "bad" }, { startDate: "bad" }, { plannedEndDate: "bad" }, { p1p2ReceivedAt: "bad" }]) {
    expect(records.projectError({ ...created, ...patch }, [])).not.toBe("");
  }
  for (const patch of [{ title: "" }, { description: "" }, { ownerId: "bad" }, { type: "bad" }, { scopeType: "bad" }, { scopes: [] }, { scopes: ["bad"] }, { probability: 0 }, { impact: NaN }, { strategy: "bad" }, { nextReviewAt: "bad" }]) {
    expect(records.riskError({ ...risk, ...patch } as ManualRiskDraft, [created])).not.toBe("");
  }
});
