import { config } from "../config";
import { sql } from "../db";

type Row = Record<string, unknown>;

export type UserDTO = { id: string; name: string; initials: string; role: string; specialty: string; active: boolean };
export type LobDTO = { id: string; label: string };
export type ServiceDTO = { id: string; lobId: string; label: string };
export type SquadDTO = { id: string; label: string; techLeadId: string | null };
export type CategoryDTO = { id: string; label: string };
export type CountryDTO = { name: string; code: string };
export type UnitDTO = { codigo: string; clase: string };
export type StateDTO = { id: string; nombre: string; esCierre: boolean; requiereDocumentacion: boolean };

export type CatalogoDTO = {
  lobs: LobDTO[];
  services: ServiceDTO[];
  squads: SquadDTO[];
  riskCategories: CategoryDTO[];
  complexities: string[];
  users: UserDTO[];
  countries: CountryDTO[];
  unidades: UnitDTO[];
  estados: StateDTO[];
};

export type ClienteDTO = { id: string; nombre: string; sector: string | null; relationship: string | null };
export type EventoDTO = { id: string; tipo: string; registradoAt: string; contenido: unknown; usuarioEmail: string | null };
export type ProyectoDTO = {
  id: string;
  tvt: string;
  tvtKeyOrigen: string | null;
  nombre: string;
  cliente: ClienteDTO;
  gestorNombre: string | null;
  gestorId: string | null;
  pais: string | null;
  countryCode: string;
  lobId: string;
  lob: string;
  servicioLobId: string | null;
  servicioLob: string | null;
  squadId: string | null;
  squad: string | null;
  lideresTecnicos: string | null;
  techLeadId: string | null;
  preventaNombre: string | null;
  preSalesId: string | null;
  tamNombre: string | null;
  tamId: string | null;
  sdmNombre: string | null;
  sdmId: string | null;
  accountManagerNombre: string | null;
  accountManagerId: string | null;
  estado: string;
  estadoId: string;
  avancePlanificadoPct: number | null;
  avanceRealPct: number | null;
  spiRatio: number | null;
  riesgosAbiertos: number;
  fechaTerminoProyecto: string | null;
  fechaInicio: string | null;
  fechaRecepcionP1P2: string | null;
  actualizadoAt: string | null;
  tcv: { amount: string; currency: string | null; date: null } | null;
  acv: { amount: string; currency: string; period: string; date: null; origin: string; status: string } | null;
  complejidad: string | null;
  situacionInicial: string | null;
  situacion: string | null;
  proximosPasos: string | null;
  referencias: { sap: string | null; ceco: string | null; pep: string | null };
  historial: EventoDTO[];
};
export type RiesgoDTO = {
  id: string;
  alcance: "GLOBAL" | "PROYECTO";
  proyectoId: string | null;
  proyectoTvt: string | null;
  nombre: string;
  causa: string | null;
  estado: string | null;
  categoria: string | null;
  probabilidad: number | null;
  impacto: number | null;
  severidad: number | null;
  estrategia: string | null;
  planMitigacion: string | null;
  planContingencia: string | null;
  responsableNombre: string | null;
  responsableId: string | null;
  tipo: "Amenaza" | "Oportunidad";
  transversal: boolean;
  scopes: string[];
  creadoAt: string | null;
  actualizadoAt: string | null;
  reviewDate: null;
};
export type FacturacionDTO = {
  id: string;
  idOrigen: string | null;
  proyectoId: string;
  proyectoTvt: string | null;
  periodo: string;
  tipo: string | null;
  cuota: string | null;
  unidad: string | null;
  showprice: string | null;
  planificado: string | null;
  real: string | null;
  estado: string | null;
  origen: string | null;
  origenRef: string | null;
  comentario: string | null;
  actualizadoAt: string | null;
};
export type CompraDTO = {
  id: string;
  idOrigen: string | null;
  proyectoId: string;
  proyectoTvt: string | null;
  concepto: string | null;
  proveedor: string | null;
  estado: string | null;
  fechaCompra: string | null;
  gestor: string | null;
  unidad: string | null;
  total: string | null;
  presupuesto: string | null;
  montoAdjudicado: string | null;
  ahorro: string | null;
  recepcionEsperada: string | null;
  recepcionReal: string | null;
};
export type CambioDTO = {
  id: string;
  idOrigen: string | null;
  proyectoId: string;
  proyectoTvt: string | null;
  campo: string;
  valorAnterior: string | null;
  valorPropuesto: string | null;
  solicitante: string | null;
  estado: string | null;
  titulo: string | null;
  creadoAt: string | null;
  resueltoAt: string | null;
  resueltoPor: string | null;
};
export type BootstrapDTO = {
  asOfDate: string;
  catalogos: CatalogoDTO;
  proyectos: ProyectoDTO[];
  riesgos: RiesgoDTO[];
  facturacion: FacturacionDTO[];
  compras: CompraDTO[];
  cambios: CambioDTO[];
  generadoAt: string;
};

const text = (value: unknown): string | null => value === null || value === undefined ? null : String(value);
const numberValue = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const dateValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};
const timeValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
};
const parseJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};
const initials = (name: string): string => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("");
const inferTipo = (strategy: string | null, name: string | null): "Amenaza" | "Oportunidad" => {
  const value = `${strategy ?? ""} ${name ?? ""}`.toLocaleLowerCase("es");
  return /explotar|potenciar|compartir|oportunidad/.test(value) ? "Oportunidad" : "Amenaza";
};

class CatalogIndex {
  readonly users: UserDTO[] = [];
  readonly lobs: LobDTO[] = [];
  readonly services: ServiceDTO[] = [];
  readonly squads: SquadDTO[] = [];
  readonly riskCategories: CategoryDTO[] = [];
  readonly complexities: string[] = [];
  readonly countries: CountryDTO[] = [];
  readonly unidades: UnitDTO[] = [];
  readonly estados: StateDTO[] = [];
  private readonly userByName = new Map<string, UserDTO>();
  readonly lobLabel = new Map<string, string>();
  readonly serviceLabel = new Map<string, string>();
  readonly squadLabel = new Map<string, string>();
  readonly countryCode = new Map<string, string>();

  addUser(user: UserDTO) {
    this.users.push(user);
    this.userByName.set(user.name, user);
  }

  userId(name: string | null): string | null {
    if (!name) return null;
    const existing = this.userByName.get(name);
    if (existing) return existing.id;
    const user: UserDTO = {
      id: `USR-GPL-${String(this.users.length + 1).padStart(2, "0")}`,
      name,
      initials: initials(name),
      role: "Usuario",
      specialty: "",
      active: true,
    };
    this.addUser(user);
    return user.id;
  }
}

async function loadCatalogs(): Promise<{ dto: CatalogoDTO; index: CatalogIndex }> {
  const index = new CatalogIndex();
  const rows = await sql<Row>`
    SELECT id::text AS id, tipo, valor, padre_valor, orden
    FROM pmo.catalogo_valor
    WHERE activo
    ORDER BY tipo, orden NULLS LAST, valor
  `;
  for (const row of rows) {
    const tipo = (text(row.tipo) ?? "").toUpperCase().replace(/[^A-Z_]/g, "_");
    const valor = text(row.valor) ?? "";
    const padre = text(row.padre_valor);
    const fallbackId = `${tipo || "CAT"}-${text(row.id) ?? "0"}`;
    if (tipo === "LOB") {
      const id = padre || valor || fallbackId;
      index.lobs.push({ id, label: valor });
      index.lobLabel.set(id, valor);
    } else if (tipo === "SERVICIO" || tipo === "SERVICIO_LOB") {
      const parts = (padre ?? "").split("|");
      const id = parts[0] || valor || fallbackId;
      index.services.push({ id, lobId: parts[1] ?? "", label: valor });
      index.serviceLabel.set(id, valor);
    } else if (tipo === "SQUAD") {
      const parts = (padre ?? "").split("|");
      const id = parts[0] || valor || fallbackId;
      index.squads.push({ id, label: valor, techLeadId: parts[1] || null });
      index.squadLabel.set(id, valor);
    } else if (tipo === "CATEGORIA_RIESGO" || tipo === "RIESGO_CATEGORIA") {
      index.riskCategories.push({ id: padre || valor || fallbackId, label: valor });
    } else if (tipo === "COMPLEJIDAD") {
      index.complexities.push(valor);
    } else if (tipo === "PAIS") {
      index.countries.push({ name: valor, code: padre ?? "" });
      index.countryCode.set(valor, padre ?? "");
    } else if (tipo === "USUARIO") {
      const parts = (padre ?? "").split("|");
      const id = parts[0] || valor || fallbackId;
      const userInitials = parts[1] || initials(valor);
      const role = parts[2] || "Usuario";
      const specialty = parts[3] || "";
      const active = parts[4] ?? "true";
      index.addUser({ id, name: valor, initials: userInitials, role, specialty, active: active !== "false" });
    }
  }

  const units = await sql<Row>`SELECT codigo, clase FROM pmo.unidad_monetaria ORDER BY codigo`;
  for (const row of units) index.unidades.push({ codigo: text(row.codigo) ?? "", clase: text(row.clase) ?? "" });

  const states = await sql<Row>`
    SELECT id::text AS id, nombre, es_cierre, requiere_documentacion
    FROM pmo.estado_proyecto
    ORDER BY id
  `;
  for (const row of states) {
    index.estados.push({
      id: text(row.id) ?? "",
      nombre: text(row.nombre) ?? "",
      esCierre: row.es_cierre === true,
      requiereDocumentacion: row.requiere_documentacion === true,
    });
  }

  return {
    index,
    dto: {
      lobs: index.lobs,
      services: index.services,
      squads: index.squads,
      riskCategories: index.riskCategories,
      complexities: index.complexities,
      users: index.users,
      countries: index.countries,
      unidades: index.unidades,
      estados: index.estados,
    },
  };
}

async function loadBilling(): Promise<FacturacionDTO[]> {
  const rows = await sql<Row>`
    SELECT f.id::text AS id, f.id_origen, f.proyecto_id::text AS proyecto_id, p.tvt AS proyecto_tvt,
           f.periodo_mes, f.tipo, f.cuota, f.unidad_codigo, f.showprice, f.importe_planificado, f.importe_real,
           f.estado, f.origen, f.origen_ref, f.comentario, f.actualizado_at
    FROM pmo.facturacion f
    JOIN pmo.proyecto p ON p.id = f.proyecto_id
    ORDER BY f.periodo_mes, f.id
  `;
  return rows.map(row => ({
    id: text(row.id_origen) ?? text(row.id) ?? "",
    idOrigen: text(row.id_origen),
    proyectoId: text(row.proyecto_id) ?? "",
    proyectoTvt: text(row.proyecto_tvt),
    periodo: (dateValue(row.periodo_mes) ?? "").slice(0, 7),
    tipo: text(row.tipo),
    cuota: text(row.cuota),
    unidad: text(row.unidad_codigo),
    showprice: text(row.showprice),
    planificado: text(row.importe_planificado),
    real: text(row.importe_real),
    estado: text(row.estado),
    origen: text(row.origen),
    origenRef: text(row.origen_ref),
    comentario: text(row.comentario),
    actualizadoAt: timeValue(row.actualizado_at),
  }));
}

function acvFor(projectId: string, currency: string | null, billing: FacturacionDTO[]) {
  if (!currency) return null;
  const year = config.asOfDate.slice(0, 4);
  const rows = billing.filter(row => row.proyectoId === projectId && row.unidad === currency && row.periodo.startsWith(year) && row.planificado !== null);
  if (!rows.length) return null;
  const amount = rows.reduce((sum, row) => sum + Number(row.planificado), 0);
  return {
    amount: amount.toFixed(4),
    currency,
    period: year,
    date: null,
    origin: "SQL · facturación planificada",
    status: "Plan comercial",
  } as const;
}

async function loadProjects(index: CatalogIndex, billing: FacturacionDTO[]): Promise<ProyectoDTO[]> {
  const rows = await sql<Row>`
    SELECT p.id::text AS id, p.tvt, p.tvt_key_origen, p.nombre,
           p.cliente_id::text AS cliente_id, c.nombre AS cliente_nombre,
           c.sector_industria AS cliente_sector, c.descripcion AS cliente_relationship,
           p.pais, p.lob, p.servicio_lob, p.squad, p.gestor_nombre,
           p.preventa, p.tam, p.sdm, p.account_manager, p.sap, p.ceco, p.pep,
           p.tcv, p.tcv_unidad_codigo, p.fecha_recepcion_p1p2, p.fecha_termino_baseline,
           p.situacion_inicial, p.lideres_tecnicos, p.creado_at, p.actualizado_at,
           e.id::text AS estado_id, e.nombre AS estado_nombre,
           s.avance_planificado_pct, s.avance_real_pct, s.spi_pct,
           s.fecha_inicio_proyecto, s.fecha_termino_proyecto, s.actividades, s.proximos_pasos,
           s.actualizado_at AS estado_actualizado_at, comp.tipificacion,
           (SELECT count(*) FROM pmo.riesgo_proyecto rp
             WHERE rp.proyecto_id = p.id AND coalesce(rp.estado, '') NOT IN ('Cerrado', 'Cerrada'))::text AS riesgos_abiertos
    FROM pmo.proyecto p
    JOIN pmo.cliente c ON c.id = p.cliente_id
    LEFT JOIN pmo.proyecto_estado_actual s ON s.proyecto_id = p.id
    LEFT JOIN pmo.estado_proyecto e ON e.id = s.estado_proyecto_id
    LEFT JOIN pmo.proyecto_complejidad comp ON comp.proyecto_id = p.id
    WHERE p.activo
    ORDER BY p.id
  `;

  return rows.map(row => {
    const id = text(row.id) ?? "";
    const gestorNombre = text(row.gestor_nombre);
    const lideresTecnicos = text(row.lideres_tecnicos);
    const preventaNombre = text(row.preventa);
    const tamNombre = text(row.tam);
    const sdmNombre = text(row.sdm);
    const accountManagerNombre = text(row.account_manager);
    const lobId = text(row.lob) ?? "";
    const servicioLobId = text(row.servicio_lob);
    const squadId = text(row.squad);
    const plan = numberValue(row.avance_planificado_pct);
    const real = numberValue(row.avance_real_pct);
    const storedSpi = numberValue(row.spi_pct);
    const spiRatio = storedSpi !== null ? Math.round(storedSpi * 100) / 10000 : plan !== null && real !== null && plan > 0 ? Math.round((real / plan) * 10000) / 10000 : null;
    const currency = text(row.tcv_unidad_codigo);
    return {
      id,
      tvt: text(row.tvt) ?? "",
      tvtKeyOrigen: text(row.tvt_key_origen),
      nombre: text(row.nombre) ?? "",
      cliente: {
        id: text(row.cliente_id) ?? "",
        nombre: text(row.cliente_nombre) ?? "",
        sector: text(row.cliente_sector),
        relationship: text(row.cliente_relationship),
      },
      gestorNombre,
      gestorId: index.userId(gestorNombre),
      pais: text(row.pais),
      countryCode: text(row.pais) ? index.countryCode.get(text(row.pais) ?? "") ?? "" : "",
      lobId,
      lob: index.lobLabel.get(lobId) ?? lobId,
      servicioLobId,
      servicioLob: servicioLobId ? index.serviceLabel.get(servicioLobId) ?? servicioLobId : null,
      squadId,
      squad: squadId ? index.squadLabel.get(squadId) ?? squadId : null,
      lideresTecnicos,
      techLeadId: index.userId(lideresTecnicos),
      preventaNombre,
      preSalesId: index.userId(preventaNombre),
      tamNombre,
      tamId: index.userId(tamNombre),
      sdmNombre,
      sdmId: index.userId(sdmNombre),
      accountManagerNombre,
      accountManagerId: index.userId(accountManagerNombre),
      estado: text(row.estado_nombre) ?? "Sin estado",
      estadoId: text(row.estado_id) ?? "",
      avancePlanificadoPct: plan,
      avanceRealPct: real,
      spiRatio,
      riesgosAbiertos: numberValue(row.riesgos_abiertos) ?? 0,
      fechaTerminoProyecto: dateValue(row.fecha_termino_proyecto ?? row.fecha_termino_baseline),
      fechaInicio: dateValue(row.fecha_inicio_proyecto ?? row.creado_at),
      fechaRecepcionP1P2: dateValue(row.fecha_recepcion_p1p2),
      actualizadoAt: timeValue(row.estado_actualizado_at ?? row.actualizado_at),
      tcv: row.tcv !== null && row.tcv !== undefined ? { amount: text(row.tcv) ?? "0", currency, date: null } : null,
      acv: acvFor(id, currency, billing),
      complejidad: text(row.tipificacion),
      situacionInicial: text(row.situacion_inicial),
      situacion: text(row.actividades),
      proximosPasos: text(row.proximos_pasos),
      referencias: { sap: text(row.sap), ceco: text(row.ceco), pep: text(row.pep) },
      historial: [],
    };
  });
}

async function loadEventsByProject(): Promise<Map<string, EventoDTO[]>> {
  const rows = await sql<Row>`
    SELECT id::text AS id, proyecto_id::text AS proyecto_id, tipo_evento, registrado_at, contenido, usuario_email
    FROM pmo.proyecto_evento
    ORDER BY proyecto_id, registrado_at, id
  `;
  const result = new Map<string, EventoDTO[]>();
  for (const row of rows) {
    const projectId = text(row.proyecto_id);
    if (!projectId) continue;
    const list = result.get(projectId) ?? [];
    list.push({
      id: text(row.id) ?? "",
      tipo: text(row.tipo_evento) ?? "",
      registradoAt: timeValue(row.registrado_at) ?? "",
      contenido: parseJson(row.contenido),
      usuarioEmail: text(row.usuario_email),
    });
    result.set(projectId, list);
  }
  return result;
}

async function loadRisks(index: CatalogIndex): Promise<RiesgoDTO[]> {
  const projectRows = await sql<Row>`
    SELECT r.id::text AS id, r.risk_id_origen, r.proyecto_id::text AS proyecto_id, p.tvt AS proyecto_tvt,
           r.transversal, r.nombre, r.causa_potencial, r.estado, r.categoria, r.probabilidad, r.impacto, r.severidad,
           r.estrategia, r.plan_mitigacion, r.plan_contingencia, r.responsable_nombre, r.creado_at, r.actualizado_at
    FROM pmo.riesgo_proyecto r
    JOIN pmo.proyecto p ON p.id = r.proyecto_id
    ORDER BY r.id
  `;
  const globalRows = await sql<Row>`
    SELECT id::text AS id, risk_id_origen, nombre, causa_potencial, estado, categoria, probabilidad, impacto,
           severidad, estrategia, plan_mitigacion, plan_contingencia, responsable_nombre, creado_at, actualizado_at
    FROM pmo.riesgo_global
    ORDER BY id
  `;
  const map = (row: Row, alcance: "GLOBAL" | "PROYECTO"): RiesgoDTO => {
    const responsableNombre = text(row.responsable_nombre);
    const estrategia = text(row.estrategia);
    return {
      id: text(row.risk_id_origen) ?? text(row.id) ?? "",
      alcance,
      proyectoId: text(row.proyecto_id),
      proyectoTvt: text(row.proyecto_tvt),
      nombre: text(row.nombre) ?? "",
      causa: text(row.causa_potencial),
      estado: text(row.estado),
      categoria: text(row.categoria),
      probabilidad: numberValue(row.probabilidad),
      impacto: numberValue(row.impacto),
      severidad: numberValue(row.severidad),
      estrategia,
      planMitigacion: text(row.plan_mitigacion),
      planContingencia: text(row.plan_contingencia),
      responsableNombre,
      responsableId: index.userId(responsableNombre),
      tipo: inferTipo(estrategia, text(row.nombre)),
      transversal: alcance === "GLOBAL" ? true : row.transversal === true,
      scopes: [],
      creadoAt: timeValue(row.creado_at),
      actualizadoAt: timeValue(row.actualizado_at),
      reviewDate: null,
    };
  };
  return [
    ...projectRows.map(row => map(row, "PROYECTO")),
    ...globalRows.map(row => map(row, "GLOBAL")),
  ];
}

async function loadPurchases(): Promise<CompraDTO[]> {
  const rows = await sql<Row>`
    SELECT c.id::text AS id, c.id_origen, c.proyecto_id::text AS proyecto_id, p.tvt AS proyecto_tvt,
           c.concepto, c.proveedor_nombre_origen, c.estado_compra, c.fecha_compra, c.gestor_compra, c.unidad_codigo,
           c.total, c.presupuesto, c.monto_adjudicado, c.ahorro, c.recepcion_esperada, c.recepcion_real
    FROM pmo.compra c
    JOIN pmo.proyecto p ON p.id = c.proyecto_id
    ORDER BY c.id
  `;
  return rows.map(row => ({
    id: text(row.id_origen) ?? text(row.id) ?? "",
    idOrigen: text(row.id_origen),
    proyectoId: text(row.proyecto_id) ?? "",
    proyectoTvt: text(row.proyecto_tvt),
    concepto: text(row.concepto),
    proveedor: text(row.proveedor_nombre_origen),
    estado: text(row.estado_compra),
    fechaCompra: dateValue(row.fecha_compra),
    gestor: text(row.gestor_compra),
    unidad: text(row.unidad_codigo),
    total: text(row.total),
    presupuesto: text(row.presupuesto),
    montoAdjudicado: text(row.monto_adjudicado),
    ahorro: text(row.ahorro),
    recepcionEsperada: dateValue(row.recepcion_esperada),
    recepcionReal: dateValue(row.recepcion_real),
  }));
}

async function loadPlanChanges(): Promise<CambioDTO[]> {
  const rows = await sql<Row>`
    SELECT c.id::text AS id, c.id_origen, c.proyecto_id::text AS proyecto_id, p.tvt AS proyecto_tvt,
           c.campo, c.valor_anterior, c.valor_propuesto, c.solicitante, c.estado, c.comentario,
           c.creado_at, c.resuelto_at, c.resuelto_por
    FROM pmo.cambio_planificacion c
    JOIN pmo.proyecto p ON p.id = c.proyecto_id
    ORDER BY c.creado_at, c.id
  `;
  return rows.map(row => ({
    id: text(row.id_origen) ?? text(row.id) ?? "",
    idOrigen: text(row.id_origen),
    proyectoId: text(row.proyecto_id) ?? "",
    proyectoTvt: text(row.proyecto_tvt),
    campo: text(row.campo) ?? "",
    valorAnterior: text(row.valor_anterior),
    valorPropuesto: text(row.valor_propuesto),
    solicitante: text(row.solicitante),
    estado: text(row.estado),
    titulo: text(row.comentario),
    creadoAt: timeValue(row.creado_at),
    resueltoAt: timeValue(row.resuelto_at),
    resueltoPor: text(row.resuelto_por),
  }));
}

export async function buildBootstrap(): Promise<BootstrapDTO> {
  const catalogs = await loadCatalogs();
  const billing = await loadBilling();
  const projects = await loadProjects(catalogs.index, billing);
  const events = await loadEventsByProject();
  const risks = await loadRisks(catalogs.index);
  const purchases = await loadPurchases();
  const changes = await loadPlanChanges();
  return {
    asOfDate: config.asOfDate,
    catalogos: catalogs.dto,
    proyectos: projects.map(project => ({ ...project, historial: events.get(project.id) ?? [] })),
    riesgos: risks,
    facturacion: billing,
    compras: purchases,
    cambios: changes,
    generadoAt: new Date().toISOString(),
  };
}

export async function getCatalogs(): Promise<CatalogoDTO> {
  return (await loadCatalogs()).dto;
}

export async function getProjects(): Promise<ProyectoDTO[]> {
  const catalogs = await loadCatalogs();
  return loadProjects(catalogs.index, await loadBilling());
}

export async function getProject(idOrTvt: string): Promise<ProyectoDTO | null> {
  const catalogs = await loadCatalogs();
  const billing = await loadBilling();
  const projects = await loadProjects(catalogs.index, billing);
  const project = projects.find(item => item.id === idOrTvt || item.tvt === idOrTvt);
  if (!project) return null;
  const events = await loadEventsByProject();
  return { ...project, historial: events.get(project.id) ?? [] };
}

export async function getRisks(projectId?: string): Promise<RiesgoDTO[]> {
  const risks = await loadRisks(await catalogIndex());
  if (!projectId) return risks;
  return risks.filter(risk => risk.proyectoId === projectId || risk.proyectoTvt === projectId);
}

export async function getGlobalRisk(id: string): Promise<RiesgoDTO | null> {
  const risks = await loadRisks(await catalogIndex());
  return risks.find(risk => risk.alcance === "GLOBAL" && risk.id === id) ?? null;
}

export async function getProjectRisk(projectId: string, riskId: string): Promise<RiesgoDTO | null> {
  const risks = await loadRisks(await catalogIndex());
  return risks.find(risk => risk.alcance === "PROYECTO" && risk.id === riskId && (risk.proyectoId === projectId || risk.proyectoTvt === projectId)) ?? null;
}

export async function getBilling(projectId?: string): Promise<FacturacionDTO[]> {
  const rows = await loadBilling();
  if (!projectId) return rows;
  return rows.filter(row => row.proyectoId === projectId || row.proyectoTvt === projectId);
}

export async function getPurchases(projectId?: string): Promise<CompraDTO[]> {
  const rows = await loadPurchases();
  if (!projectId) return rows;
  return rows.filter(row => row.proyectoId === projectId || row.proyectoTvt === projectId);
}

export async function getPlanChanges(estado?: string): Promise<CambioDTO[]> {
  const rows = await loadPlanChanges();
  if (!estado) return rows;
  return rows.filter(row => row.estado?.toLocaleLowerCase("es") === estado.toLocaleLowerCase("es"));
}

async function catalogIndex(): Promise<CatalogIndex> {
  return (await loadCatalogs()).index;
}
