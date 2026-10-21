export function validateEnrichment(data) {
  const errors = [], fail = message => errors.push(message);
  const catalogs = data.catalogs;
  if (!catalogs) return ["Catálogos: faltan referencias de negocio."];
  const ref = (id, list) => list.some(item => item.id === id);
  const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  const amount = value => typeof value === "number" && Number.isFinite(value) && value >= 0;
  for (const key of ["lobs", "services", "squads", "riskCategories"]) {
    const rows = catalogs[key];
    if (!Array.isArray(rows) || !rows.length || rows.length > 20 || rows.some(row => !row.id || !row.label) || new Set(rows.map(row => row.id)).size !== rows.length) return [`Catálogos: ${key} inválido o duplicado.`];
  }
  if (!Array.isArray(catalogs.complexities) || !catalogs.complexities.length || catalogs.complexities.length > 20 || new Set(catalogs.complexities).size !== catalogs.complexities.length) return ["Catálogos: complejidades inválidas."];
  for (const client of data.clients) if (!["Nuevo", "Antiguo"].includes(client.relationship) || !client.segment) fail(`Cliente ${client.id}: relación/sector inválidos.`);
  for (const service of catalogs.services) if (!ref(service.lobId, catalogs.lobs)) fail("Servicio LOB: referencia inexistente.");
  for (const squad of catalogs.squads) if (!ref(squad.techLeadId, data.users)) fail("Squad: líder inexistente.");
  for (const project of data.projects) {
    if (!ref(project.lobId, catalogs.lobs) || !catalogs.services.some(service => service.id === project.serviceId && service.lobId === project.lobId)) fail(`Proyecto ${project.id}: relación LOB/servicio inválida.`);
    if (!ref(project.squadId, catalogs.squads) || !ref(project.techLeadId, data.users)) fail(`Proyecto ${project.id}: squad/líder inválido.`);
    if (!catalogs.complexities.includes(project.complexity)) fail(`Proyecto ${project.id}: complejidad inválida.`);
    if (!project.references || !["sap", "ceco", "pep"].every(key => typeof project.references[key] === "string" && project.references[key].startsWith("EJ-"))) fail(`Proyecto ${project.id}: referencias ficticias inválidas.`);
    for (const [field, role] of [["preSalesId", "Preventa"], ["tamId", "TAM"], ["sdmId", "SDM"], ["accountManagerId", "Account Manager"]]) if (!data.users.some(user => user.id === project[field] && user.role === role)) fail(`Proyecto ${project.id}: ${field} no corresponde al rol.`);
    if (project.p1p2ReceivedAt !== null && (!validDate(project.p1p2ReceivedAt) || project.p1p2ReceivedAt > data.config.asOfDate)) fail(`Proyecto ${project.id}: P1P2 inválido.`);
    if (project.budgetAmount !== null || project.currency !== null) fail(`Proyecto ${project.id}: presupuesto operativo sin fuente; debe permanecer ausente.`);
    for (const key of ["tcv", "acv"]) {
      const value = project[key];
      if (!value || !amount(value.amount) || !["PEN", "CLP", "COP", "USD"].includes(value.currency) || !validDate(value.date) || value.date > data.config.asOfDate || !value.origin || !value.status) fail(`Proyecto ${project.id}: referencia ${key} inválida.`);
    }
    if (!/^\d{4}$/.test(project.acv?.period)) fail(`Proyecto ${project.id}: ACV requiere año.`);
  }
  for (const risk of data.risks) if (!ref(risk.categoryId, catalogs.riskCategories)) fail(`Riesgo ${risk.id}: categoría inválida.`);
  for (const row of data.billingMilestones) {
    if (!validDate(row.showPricingDate) || !row.showPricingOrigin || !row.plannedOrigin) fail(`Facturación ${row.id}: fuente o fecha original inválida.`);
    if ((row.actualAmount === null) !== (row.actualDate === null) || (row.actualAmount === null) !== (row.actualOrigin === null)) fail(`Facturación ${row.id}: ausencia real incoherente.`);
    if (row.actualDate && row.actualDate > data.config.asOfDate) fail(`Facturación ${row.id}: real futuro.`);
    if ((row.billingStatus === "Facturado") !== (typeof row.invoiceReference === "string" && row.invoiceReference.length > 0)) fail(`Facturación ${row.id}: emisión sin respaldo.`);
  }
  for (const row of data.purchases) {
    if (!amount(row.expectedAmount) || (row.actualAmount !== null && !amount(row.actualAmount)) || !validDate(row.expectedCostDate) || !row.costOrigin || (row.actualAmount === null) !== (row.actualCostDate === null)) fail(`Compra ${row.id}: egreso inválido.`);
    if (row.actualCostDate && (!validDate(row.actualCostDate) || row.actualCostDate > data.config.asOfDate)) fail(`Compra ${row.id}: fecha real inválida.`);
  }
  return errors;
}
