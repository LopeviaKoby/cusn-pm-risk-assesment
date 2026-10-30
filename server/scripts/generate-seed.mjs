import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = path => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const write = (path, content) => writeFileSync(resolve(root, path), content, "utf8");
const q = value => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
};
const qJson = value => `${q(JSON.stringify(value))}::jsonb`;
const timestamp = value => value ? `${value.length === 10 ? `${value}T12:00:00Z` : value}` : null;
const date = value => value || null;

const projects = read("src/demo/data/core/projects.json");
const clients = read("src/demo/data/core/clients.json");
const users = read("src/demo/data/core/users.json");
const catalogs = read("src/demo/data/core/catalogs.json");
const statuses = read("src/demo/data/core/project-status.json");
const progress = read("src/demo/data/core/project-progress-history.json");
const milestones = read("src/demo/data/core/milestones.json");
const risks = read("src/demo/data/risks/risks.json");
const billing = read("src/demo/data/operations/billing-milestones.json");
const purchases = read("src/demo/data/operations/purchases.json");
const planChanges = read("src/demo/data/operations/plan-change-requests.json");
const changeControls = read("src/demo/data/operations/change-controls.json");
const timeEntries = read("src/demo/data/operations/time-entries.json");
const commitments = read("src/demo/data/operations/commitments.json");
const lessons = read("src/demo/data/supporting/lessons-learned.json");
const documents = read("src/demo/data/supporting/project-documents.json");
const config = read("src/demo/data/demo-config.json");

const userById = new Map(users.map(user => [user.id, user]));
const clientById = new Map(clients.map(client => [client.id, client]));
const projectById = new Map(projects.map(project => [project.id, project]));
const projectNumber = new Map(projects.map((project, index) => [project.id, index + 1]));
const userName = id => userById.get(id)?.name ?? null;
const projectId = fixtureId => projectNumber.get(fixtureId) ?? "NULL";
const nextMilestone = project => milestones
  .filter(item => item.projectId === project.id && item.status !== "Completado" && item.status !== "Cancelado")
  .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0];

const catalogLines = [];
let order = 1;
for (const item of catalogs.lobs) catalogLines.push(`(${q("LOB")}, ${q(item.label)}, ${q(item.id)}, ${order++}, true)`);
for (const item of catalogs.services) catalogLines.push(`(${q("SERVICIO")}, ${q(item.label)}, ${q(`${item.id}|${item.lobId}`)}, ${order++}, true)`);
for (const item of catalogs.squads) catalogLines.push(`(${q("SQUAD")}, ${q(item.label)}, ${q(`${item.id}|${item.techLeadId}`)}, ${order++}, true)`);
for (const item of catalogs.riskCategories) catalogLines.push(`(${q("CATEGORIA_RIESGO")}, ${q(item.label)}, ${q(item.id)}, ${order++}, true)`);
for (const item of catalogs.complexities) catalogLines.push(`(${q("COMPLEJIDAD")}, ${q(item)}, NULL, ${order++}, true)`);
for (const user of users) {
  catalogLines.push(`(${q("USUARIO")}, ${q(user.name)}, ${q([user.id, user.initials, user.role, user.specialty, String(user.active)].join("|"))}, ${order++}, true)`);
}
const countries = [...new Map(projects.map(project => [project.country, project.countryCode])).entries()];
for (const [name, code] of countries) catalogLines.push(`(${q("PAIS")}, ${q(name)}, ${q(code)}, ${order++}, true)`);

const catalogSql = `-- Semilla de catálogos del laboratorio. No contiene datos corporativos.
SET search_path TO pmo, public;

INSERT INTO unidad_monetaria (codigo, clase) VALUES
  ('USD','MONEDA'), ('PEN','MONEDA'), ('CLP','MONEDA'),
  ('COP','MONEDA'), ('ARS','MONEDA'), ('BRL','MONEDA'),
  ('PAB','MONEDA'), ('MXN','MONEDA'), ('UF','UNIDAD_INDEXADA')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO catalogo_valor (tipo, valor, padre_valor, orden, activo) VALUES
${catalogLines.map(line => `  ${line}`).join(",\n")}
ON CONFLICT (tipo, valor) DO NOTHING;
`;

const stateNames = [...new Set([...statuses.map(item => item.status), "Requiere P1P2", "Cancelado", "Terminado"])];
const stateSql = stateNames.map(name => {
  const isClose = name === "Terminado" || name === "Cancelado";
  const needsDoc = name === "Terminado";
  return `  (${q(name)}, ${isClose}, ${needsDoc})`;
}).join(",\n");

const clientSql = clients.map((client, index) => `  (${index + 1}, ${q(client.name)}, ${q(client.segment)}, ${q(client.relationship)})`).join(",\n");

const projectSql = projects.map((project, index) => {
  const client = clientById.get(project.clientId);
  return `  (${index + 1}, ${q(project.id)}, ${q(project.code)}, ${q(project.name)}, ${index + 1}, ${q(client?.relationship ?? null)}, ${q(project.country)}, ${q(project.lobId)}, ${q(project.serviceId)}, ${q(project.squadId)}, ${q(userName(project.managerId))}, ${q(userName(project.preSalesId))}, ${q(userName(project.tamId))}, ${q(userName(project.sdmId))}, ${q(userName(project.accountManagerId))}, ${q(project.references?.sap ?? null)}, ${q(project.references?.ceco ?? null)}, ${q(project.references?.pep ?? null)}, ${project.tcv?.amount ?? "NULL"}, ${q(project.tcv?.currency ?? null)}, ${q(date(project.p1p2ReceivedAt))}, ${q(date(project.plannedEndDate))}, ${q(project.description)}, ${q(userName(project.techLeadId))}, true, ${q(timestamp(project.startDate))}, ${q(timestamp(statuses.find(item => item.projectId === project.id)?.updatedAt ?? project.startDate))}, 'seed-lab', 'seed-lab')`;
}).join(",\n");

const currentSql = projects.map(project => {
  const status = statuses.find(item => item.projectId === project.id);
  const last = progress.filter(item => item.projectId === project.id).sort((left, right) => left.snapshotDate.localeCompare(right.snapshotDate)).at(-1);
  const next = nextMilestone(project);
  const planned = Math.round((last?.plannedProgress ?? 0) * 10000) / 100;
  const actual = Math.round((last?.actualProgress ?? 0) * 10000) / 100;
  return `  (${q(project.id)}, ${q(status?.status ?? "Requiere P1P2")}, ${q(date(last?.snapshotDate))}, ${planned}, ${actual}, ${q(date(project.startDate))}, ${q(date(project.plannedEndDate))}, ${q(project.tcv?.currency ?? null)}, ${q(status?.situationNote ?? null)}, ${q(next ? `${next.title} · ${next.dueDate}` : "Sin próximos hitos registrados.")}, ${q(timestamp(status?.updatedAt ?? project.startDate))})`;
}).join(",\n");

const eventSql = progress.map(item => {
  const project = projectById.get(item.projectId);
  const status = statuses.find(entry => entry.projectId === item.projectId);
  const managerId = project?.managerId ?? null;
  const content = {
    avancePlanificadoPct: Math.round(item.plannedProgress * 10000) / 100,
    avanceRealPct: Math.round(item.actualProgress * 10000) / 100,
    nota: item.note,
    reportadoPor: managerId,
  };
  return `  (${projectId(item.projectId)}, ${q(project?.code ?? null)}, ${q(item.projectId)}, ${q(timestamp(item.snapshotDate))}, 'STATUS', ${qJson(content)}, ${q(managerId)})`;
}).join(",\n");

const complexitySql = projects.map(project => {
  const status = statuses.find(item => item.projectId === project.id);
  return `  (${projectId(project.id)}, NULL, ${q(project.complexity ?? null)}, ${q(timestamp(status?.updatedAt ?? project.startDate))}, 'seed-lab')`;
}).join(",\n");

const projectRisks = risks.filter(risk => risk.scopeType !== "Transversal");
const globalRisks = risks.filter(risk => risk.scopeType === "Transversal");
const riskColumns = "risk_id_origen, nombre, causa_potencial, control_actual, estado, categoria, probabilidad, impacto, severidad, estrategia, plan_mitigacion, plan_contingencia, responsable_nombre, creado_at, actualizado_at, creado_por, actualizado_por";
const riskValue = risk => {
  const status = statuses.find(item => item.projectId === risk.projectId);
  return `(${q(risk.id)}, ${q(risk.title)}, ${q(risk.description)}, NULL, ${q(risk.status)}, ${q(risk.categoryId ?? null)}, ${risk.probability}, ${risk.impact}, ${risk.probability * risk.impact}, ${q(risk.strategy)}, ${q(risk.responsePlan || null)}, ${q(risk.contingencyPrepared ? "Contingencia preparada en el seguimiento sintético del laboratorio." : null)}, ${q(userName(risk.ownerId))}, ${q(timestamp(risk.identifiedAt))}, ${q(timestamp(status?.updatedAt ?? risk.identifiedAt))}, 'seed-lab', 'seed-lab')`;
};
const projectRiskSql = projectRisks.map(risk => `  (${riskValue(risk).slice(1, -1)}, ${projectId(risk.projectId)}, NULL, false)`).join(",\n");
const globalRiskSql = globalRisks.map(risk => `  ${riskValue(risk)}`).join(",\n");

const billingSql = billing.map(item => {
  const project = projectById.get(item.projectId);
  const status = statuses.find(entry => entry.projectId === item.projectId);
  const period = `${(item.plannedDate ?? item.actualDate ?? item.showPricingDate).slice(0, 7)}-01`;
  return `  (${q(item.id)}, ${projectId(item.projectId)}, ${q(period)}, ${q(item.title)}, ${q(item.id)}, ${q(item.currency)}, ${item.showPricingAmount}, ${item.plannedAmount}, ${item.actualAmount ?? "NULL"}, NULL, ${q(item.billingStatus)}, ${q(item.actualOrigin)}, ${q(item.invoiceReference ?? null)}, ${q(item.showPricingOrigin)}, ${q(timestamp(status?.updatedAt ?? project?.plannedEndDate ?? null))}, 'seed-lab')`;
}).join(",\n");

const purchaseSql = purchases.map(item => {
  const user = userById.get(item.requestedById);
  return `  (${q(item.id)}, ${projectId(item.projectId)}, ${q(item.supplierName)}, ${q(date(item.orderedAt))}, ${q(user?.name ?? null)}, ${q(item.status)}, ${q(item.title)}, ${q(item.currency)}, ${item.expectedAmount ?? "NULL"}, ${item.expectedAmount ?? "NULL"}, ${item.actualAmount ?? "NULL"}, NULL, ${q(date(item.expectedDeliveryAt))}, ${q(date(item.receivedAt))}, ${q(timestamp(item.orderedAt))}, ${q(timestamp(item.receivedAt ?? item.orderedAt))}, 'seed-lab', 'seed-lab')`;
}).join(",\n");

const planChangeSql = planChanges.map(item => `  (${q(item.id)}, ${projectId(item.projectId)}, NULL, 'fecha_termino', ${q(item.currentEndDate)}, ${q(item.requestedEndDate)}, ${q(userName(item.requestedById))}, ${q(item.status)}, ${q(item.decisionNote)}, ${q(item.title)}, ${q(timestamp(item.requestedAt))}, ${q(timestamp(item.decidedAt))}, ${q(userName(item.decidedById))})`).join(",\n");

const changeControlSql = changeControls.map((item, index) => `  (${q(item.id)}, ${projectId(item.projectId)}, ${q(item.id)}, ${index + 1}, ${q(date(item.requestedAt))}, ${q(item.description)}, ${q(item.title)}, NULL, NULL, ${q(userName(item.requestedById))}, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ${q(item.status)}, ${q(timestamp(item.requestedAt))}, ${q(timestamp(item.decidedAt))}, 'seed-lab', 'seed-lab')`).join(",\n");

const timeSql = timeEntries.map(item => `  (${q(item.id)}, ${projectId(item.projectId)}, NULL, ${q(userName(item.userId))}, ${q(userById.get(item.userId)?.specialty ?? null)}, ${q(projectById.get(item.projectId)?.country ?? null)}, ${q(date(item.workDate))}, ${item.hours}, ${q(item.billable ? "Facturable" : "No facturable")}, NULL, ${q(item.activity)}, NULL, ${q(timestamp(item.workDate))})`).join(",\n");

const commitmentSql = commitments.map(item => `  (${q(item.id)}, ${q(item.title)}, ${q(item.description)}, ${q(userName(item.ownerId))}, NULL, ${item.status === "Completado"}, ${q(timestamp(item.committedAt))}, ${q(timestamp(item.completedAt ?? item.committedAt))}, 'seed-lab', 'seed-lab')`).join(",\n");

const lessonSql = lessons.map(item => `  (${q(item.id)}, ${projectId(item.projectId)}, NULL, ${q(date(item.recordedAt))}, ${q(item.title)}, ${q(item.context)}, NULL, ${q(item.recommendation)}, ${q(item.recommendation)}, NULL, ${q(timestamp(item.recordedAt))}, ${q(timestamp(item.recordedAt))}, 'seed-lab', 'seed-lab')`).join(",\n");

const documentSql = documents.map(item => `  (${projectId(item.projectId)}, ${q(item.type)}, ${q(`https://example.test/lab/${item.id}`)}, false, NULL, NULL, NULL, ${q(timestamp(item.updatedAt))})`).join(",\n");

const seedSql = `-- Semilla sintética del laboratorio GPL. Derivada de fixtures públicos ficticios.
-- No contiene datos corporativos, CSV ni registros de localStorage.
SET search_path TO pmo, public;

INSERT INTO estado_proyecto (nombre, es_cierre, requiere_documentacion) VALUES
${stateSql}
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cliente (id, nombre, sector_industria, descripcion) OVERRIDING SYSTEM VALUE VALUES
${clientSql};

INSERT INTO proyecto (id, tvt, tvt_key_origen, nombre, cliente_id, estado_cliente, pais, lob, servicio_lob, squad, gestor_nombre, preventa, tam, sdm, account_manager, sap, ceco, pep, tcv, tcv_unidad_codigo, fecha_recepcion_p1p2, fecha_termino_baseline, situacion_inicial, lideres_tecnicos, activo, creado_at, actualizado_at, creado_por, actualizado_por) OVERRIDING SYSTEM VALUE VALUES
${projectSql};

SELECT setval(pg_get_serial_sequence('pmo.cliente','id'), (SELECT max(id) FROM pmo.cliente), true);
SELECT setval(pg_get_serial_sequence('pmo.proyecto','id'), (SELECT max(id) FROM pmo.proyecto), true);

INSERT INTO proyecto_estado_actual (proyecto_id, estado_proyecto_id, fecha_registro_avance, avance_planificado_pct, avance_real_pct, spi_pct, fecha_inicio_proyecto, fecha_termino_proyecto, plazo_meses, operacion_no_aplica, meses_servicio, fecha_inicio_operacion, fecha_termino_operacion, margen_pct, estado_facturacion, facturacion_unidad_codigo, actividades, proximos_pasos, lecciones_resumen, checklist_entregables, terminado_fecha, terminado_mes, termino_real_base, actualizado_at, actualizado_por)
SELECT p.id, e.id, v.fecha_registro::date, v.plan, v.real,
       CASE WHEN v.plan > 0 THEN round(v.real::numeric / v.plan::numeric * 100, 4) ELSE NULL END,
       v.inicio::date, v.termino::date,
       round((v.termino::date - v.inicio::date) / 30.4375, 2),
       true, NULL, NULL, NULL, NULL, NULL, v.unidad, v.actividades, v.proximos, NULL, NULL, NULL, NULL, NULL, v.actualizado::timestamptz, 'seed-lab'
FROM (VALUES
${currentSql}
) AS v(tvt, estado, fecha_registro, plan, real, inicio, termino, unidad, actividades, proximos, actualizado)
JOIN pmo.proyecto p ON p.tvt = v.tvt
JOIN pmo.estado_proyecto e ON e.nombre = v.estado;

INSERT INTO proyecto_evento (proyecto_id, tvt_key_origen, tvt_origen, registrado_at, tipo_evento, contenido, usuario_email) VALUES
${eventSql};

INSERT INTO proyecto_complejidad (proyecto_id, indice_complejidad, tipificacion, actualizado_at, actualizado_por) VALUES
${complexitySql};

INSERT INTO riesgo_global (${riskColumns}) VALUES
${globalRiskSql};

INSERT INTO riesgo_proyecto (${riskColumns}, proyecto_id, riesgo_global_id, transversal) VALUES
${projectRiskSql};

INSERT INTO facturacion (id_origen, proyecto_id, periodo_mes, tipo, cuota, unidad_codigo, showprice, importe_planificado, importe_real, margen, estado, origen, origen_ref, comentario, actualizado_at, actualizado_por) VALUES
${billingSql};

INSERT INTO compra (id_origen, proyecto_id, proveedor_nombre_origen, fecha_compra, gestor_compra, estado_compra, concepto, unidad_codigo, total, presupuesto, monto_adjudicado, ahorro, recepcion_esperada, recepcion_real, creado_at, actualizado_at, creado_por, actualizado_por) VALUES
${purchaseSql};

INSERT INTO cambio_planificacion (id_origen, proyecto_id, solicitud_cambio_id, campo, valor_anterior, valor_propuesto, solicitante, estado, motivo, comentario, creado_at, resuelto_at, resuelto_por) VALUES
${planChangeSql};

INSERT INTO solicitud_cambio (id_origen, proyecto_id, folio, secuencia, fecha_elaboracion, descripcion, justificacion, firmado, urgencia, responsable_cambio, responsable_cliente_nombre, responsable_cliente_correo, responsable_tivit_nombre, responsable_cuenta, costo, costo_unidad_codigo, costo_tipo, costo_fecha_facturacion, documento_url, documento_id_origen, documento_creado_at, aprobacion, creado_at, actualizado_at, creado_por, actualizado_por) VALUES
${changeControlSql};

INSERT INTO registro_horas (id_origen, proyecto_id, especialista_id, especialista_nombre_origen, especialista_lob_origen, especialista_pais_origen, fecha, horas, tipo, modalidad_repase, comentario, email_formulario_origen, registrado_at) VALUES
${timeSql};

INSERT INTO compromiso (id_origen, titulo, descripcion, responsable, pais, completado, creado_at, actualizado_at, creado_por, actualizado_por) VALUES
${commitmentSql};

INSERT INTO leccion_aprendida (id_origen, proyecto_id, area, fecha, titulo, situacion, impacto, acciones_correctivas, leccion, correo_texto, creado_at, actualizado_at, creado_por, actualizado_por) VALUES
${lessonSql};

INSERT INTO documento_proyecto (proyecto_id, tipo_documento, url, relacionado_con_cierre, validado, validado_at, validado_por, registrado_at) VALUES
${documentSql};

INSERT INTO refresh_ejecucion (iniciado_at, finalizado_at, duracion_segundos, filas_snapshot, filas_fact, estado, error_detalle)
VALUES (now(), now(), 0, ${progress.length}, ${billing.length}, 'seed-lab', NULL);
`;

write("server/migrations/002_seed_catalogos.sql", catalogSql);
write("server/migrations/003_seed_lab.sql", seedSql);

const manifest = ["001_schema.sql", "002_seed_catalogos.sql", "003_seed_lab.sql"].map(file => {
  const content = readFileSync(resolve(root, "server/migrations", file));
  return { file, sha256: createHash("sha256").update(content).digest("hex") };
});
write("server/migrations/manifest.json", `${JSON.stringify({ schema: "pmo", asOfDate: config.asOfDate, migrations: manifest }, null, 2)}\n`);

console.log(`Migraciones generadas: ${manifest.length}. Semilla: ${progress.length} eventos, ${risks.length} riesgos, ${billing.length} facturas, ${purchases.length} compras.`);
