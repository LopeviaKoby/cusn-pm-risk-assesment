import { api } from "./client";
import {
  installData,
  type BillingMilestone,
  type Client,
  type DemoData,
  type PlanChangeRequest,
  type Project,
  type ProjectEvent,
  type ProjectStatus,
  type ProgressSnapshot,
  type Purchase,
  type Risk,
  type User,
} from "@/demo/data";
import { refreshCatalogs } from "@/demo/catalogs";
import { setCurrentUser } from "@/demo/session";

type CatalogoDTO = {
  lobs: { id: string; label: string }[];
  services: { id: string; lobId: string; label: string }[];
  squads: { id: string; label: string; techLeadId: string | null }[];
  riskCategories: { id: string; label: string }[];
  complexities: string[];
  users: User[];
  countries: { name: string; code: string }[];
  unidades: { codigo: string; clase: string }[];
  estados: { id: string; nombre: string; esCierre: boolean; requiereDocumentacion: boolean }[];
};

type ProyectoDTO = {
  id: string;
  tvt: string;
  tvtKeyOrigen: string | null;
  nombre: string;
  cliente: { id: string; nombre: string; sector: string | null; relationship: string | null };
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
  historial: { id: string; tipo: string; registradoAt: string; contenido: unknown; usuarioEmail: string | null }[];
};

type RiesgoDTO = {
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

type FacturacionDTO = {
  id: string;
  proyectoId: string;
  periodo: string;
  tipo: string | null;
  unidad: string | null;
  showprice: string | null;
  planificado: string | null;
  real: string | null;
  estado: string | null;
  origen: string | null;
  origenRef: string | null;
  comentario: string | null;
};

type CompraDTO = {
  id: string;
  proyectoId: string;
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

type CambioDTO = {
  id: string;
  proyectoId: string;
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

type BootstrapDTO = {
  asOfDate: string;
  catalogos: CatalogoDTO;
  proyectos: ProyectoDTO[];
  riesgos: RiesgoDTO[];
  facturacion: FacturacionDTO[];
  compras: CompraDTO[];
  cambios: CambioDTO[];
  generadoAt: string;
};

type Catalogs = DemoData["catalogs"];

const sessionUser: User = {
  id: "USR-GPL-000",
  name: "PMO GPL",
  initials: "PG",
  role: "Project Manager",
  specialty: "Gestión de portafolio",
  active: true,
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

function normalizeStatus(value: string): string {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized === "en ejecucion") return "En ejecución";
  if (normalized === "en transicion") return "En transición";
  if (normalized === "en planeacion") return "En planeación";
  if (normalized === "requiere p1p2") return "Requiere P1P2";
  return value;
}

function mapClients(projects: ProyectoDTO[]): Client[] {
  const clients = new Map<string, Client>();
  for (const project of projects) {
    if (clients.has(project.cliente.id)) continue;
    clients.set(project.cliente.id, {
      id: project.cliente.id,
      name: project.cliente.nombre,
      segment: project.cliente.sector ?? "",
      country: project.pais ?? "",
      relationship: project.cliente.relationship ?? "",
    });
  }
  return [...clients.values()];
}

function mapProjects(projects: ProyectoDTO[], user: User): Project[] {
  return projects.map(project => ({
    id: project.id,
    code: project.tvt,
    name: project.nombre,
    description: project.situacionInicial ?? "",
    clientId: project.cliente.id,
    country: project.pais ?? "",
    countryCode: project.countryCode,
    managerId: project.gestorId ?? user.id,
    startDate: project.fechaInicio ?? "",
    plannedEndDate: project.fechaTerminoProyecto ?? "",
    budgetAmount: null,
    currency: null,
    lobId: project.lobId,
    lob: project.lob,
    serviceId: project.servicioLobId ?? "",
    service: project.servicioLob,
    squadId: project.squadId ?? "",
    squad: project.squad,
    techLeadId: project.techLeadId ?? user.id,
    complexity: project.complejidad ?? "",
    p1p2ReceivedAt: project.fechaRecepcionP1P2 ?? "",
    preSalesId: project.preSalesId ?? "",
    tamId: project.tamId ?? "",
    sdmId: project.sdmId ?? "",
    accountManagerId: project.accountManagerId ?? "",
    references: {
      sap: project.referencias.sap ?? "",
      ceco: project.referencias.ceco ?? "",
      pep: project.referencias.pep ?? "",
    },
    tcv: project.tcv
      ? { amount: Number(project.tcv.amount), currency: project.tcv.currency ?? "", date: "", origin: "SQL · proyecto.tcv", status: "Referencia comercial" }
      : (null as unknown as Project["tcv"]),
    acv: project.acv
      ? { amount: Number(project.acv.amount), currency: project.acv.currency, period: project.acv.period, date: "", origin: project.acv.origin, status: project.acv.status }
      : (null as unknown as Project["acv"]),
  })) as Project[];
}

function mapStatuses(projects: ProyectoDTO[], user: User, asOfDate: string): ProjectStatus[] {
  return projects.map(project => ({
    id: `PST-${project.id}`,
    projectId: project.id,
    status: normalizeStatus(project.estado),
    statusSince: project.fechaInicio ?? asOfDate,
    updatedAt: project.actualizadoAt?.slice(0, 10) ?? asOfDate,
    updatedById: project.gestorId ?? user.id,
    situationNote: project.situacion ?? "",
    nextSteps: project.proximosPasos ?? null,
    plannedProgress: project.avancePlanificadoPct !== null ? project.avancePlanificadoPct / 100 : null,
    actualProgress: project.avanceRealPct !== null ? project.avanceRealPct / 100 : null,
    spi: project.spiRatio,
  })) as ProjectStatus[];
}

function mapProgress(projects: ProyectoDTO[], user: User): ProgressSnapshot[] {
  const result: ProgressSnapshot[] = [];
  for (const project of projects) {
    let hasSnapshot = false;
    for (const event of project.historial) {
      if (event.tipo !== "STATUS") continue;
      const content = asRecord(event.contenido);
      const planned = Number(content.avancePlanificadoPct);
      const actual = Number(content.avanceRealPct);
      if (!Number.isFinite(planned) || !Number.isFinite(actual)) continue;
      hasSnapshot = true;
      result.push({
        id: `PPH-${event.id}`,
        projectId: project.id,
        snapshotDate: event.registradoAt.slice(0, 10),
        plannedProgress: Math.round(planned * 100) / 10000,
        actualProgress: Math.round(actual * 100) / 10000,
        reportedById: typeof content.reportadoPor === "string" ? content.reportadoPor : project.gestorId ?? user.id,
        note: typeof content.nota === "string" ? content.nota : "",
      } as ProgressSnapshot);
    }
    if (!hasSnapshot && project.avancePlanificadoPct !== null && project.avanceRealPct !== null) {
      const snapshotDate = (project.actualizadoAt ?? project.fechaTerminoProyecto ?? project.fechaInicio ?? "").slice(0, 10);
      if (snapshotDate && project.fechaInicio && project.fechaInicio < snapshotDate) {
        result.push({
          id: `PPH-START-${project.id}`,
          projectId: project.id,
          snapshotDate: project.fechaInicio,
          plannedProgress: 0,
          actualProgress: 0,
          reportedById: project.gestorId ?? user.id,
          note: "Inicio del proyecto",
        } as ProgressSnapshot);
      }
      if (snapshotDate) result.push({
        id: `PPH-CURRENT-${project.id}`,
        projectId: project.id,
        snapshotDate,
        plannedProgress: Math.round(project.avancePlanificadoPct * 100) / 10000,
        actualProgress: Math.round(project.avanceRealPct * 100) / 10000,
        reportedById: project.gestorId ?? user.id,
        note: "Avance actual registrado",
      } as ProgressSnapshot);
    }
  }
  return result;
}

function mapRisks(risks: RiesgoDTO[], user: User, asOfDate: string): Risk[] {
  return risks.map(risk => {
    const ownerId = risk.responsableId ?? user.id;
    return {
      id: risk.id,
      title: risk.nombre,
      description: risk.causa ?? "",
      type: risk.tipo,
      scopeType: risk.alcance === "GLOBAL" || risk.transversal ? "Transversal" : "Proyecto",
      projectId: risk.alcance === "GLOBAL" ? null : risk.proyectoId,
      ownerId,
      status: risk.estado ?? "Sin estado",
      strategy: risk.estrategia ?? "",
      probability: risk.probabilidad ?? 1,
      impact: risk.impacto ?? 1,
      scopes: risk.scopes,
      identifiedAt: risk.creadoAt?.slice(0, 10) ?? asOfDate,
      identifiedById: ownerId,
      responsePlan: risk.planMitigacion ?? "",
      contingencyPrepared: !!risk.planContingencia,
      categoryId: risk.categoria ?? "",
      contingency: risk.planContingencia ?? "",
      trigger: "",
    } as Risk;
  }) as Risk[];
}

function mapBilling(rows: FacturacionDTO[]): BillingMilestone[] {
  return rows.map(row => {
    const periodDate = row.periodo ? `${row.periodo}-01` : "";
    return {
      id: row.id,
      projectId: row.proyectoId,
      title: row.tipo ?? "Facturación",
      showPricingAmount: Number(row.showprice ?? 0),
      plannedAmount: Number(row.planificado ?? 0),
      actualAmount: row.real !== null ? Number(row.real) : null,
      currency: row.unidad ?? "",
      plannedDate: periodDate,
      actualDate: row.real !== null ? periodDate : null,
      billingStatus: row.estado ?? "",
      showPricingDate: periodDate,
      showPricingOrigin: row.comentario ?? "SQL · facturacion.showprice",
      plannedOrigin: "SQL · facturacion.importe_planificado",
      actualOrigin: row.origen ?? "SQL · facturacion.importe_real",
      invoiceReference: row.origenRef,
    } as BillingMilestone;
  }) as BillingMilestone[];
}

function mapPurchases(rows: CompraDTO[], user: User): Purchase[] {
  return rows.map(row => ({
    id: row.id,
    projectId: row.proyectoId,
    title: row.concepto ?? "Compra",
    supplierName: row.proveedor ?? "",
    status: row.estado ?? "",
    requestedById: user.id,
    orderedAt: row.fechaCompra ?? "",
    expectedDeliveryAt: row.recepcionEsperada ?? "",
    receivedAt: row.recepcionReal,
    currency: row.unidad ?? "",
    expectedAmount: Number(row.total ?? 0),
    actualAmount: row.montoAdjudicado !== null ? Number(row.montoAdjudicado) : null,
    expectedCostDate: row.recepcionEsperada ?? "",
    actualCostDate: row.recepcionReal,
    costOrigin: "SQL · compra.total / monto_adjudicado",
  })) as Purchase[];
}

function mapPlanChanges(rows: CambioDTO[], user: User, asOfDate: string): PlanChangeRequest[] {
  return rows.map(row => ({
    id: row.id,
    projectId: row.proyectoId,
    title: row.titulo ?? `Cambio de ${row.campo}`,
    requestedEndDate: row.valorPropuesto ?? "",
    currentEndDate: row.valorAnterior ?? "",
    status: row.estado ?? "",
    requestedById: user.id,
    requestedAt: row.creadoAt?.slice(0, 10) ?? asOfDate,
    decidedById: null,
    decidedAt: row.resueltoAt?.slice(0, 10) ?? null,
    decisionNote: null,
    relatedRiskId: "",
  })) as PlanChangeRequest[];
}

function mapCatalogs(dto: CatalogoDTO): Catalogs {
  return {
    lobs: dto.lobs,
    services: dto.services,
    squads: dto.squads.map(squad => ({ ...squad, techLeadId: squad.techLeadId ?? "" })),
    riskCategories: dto.riskCategories,
    complexities: dto.complexities,
  };
}

export async function loadBootstrap(): Promise<void> {
  const dto = await api<BootstrapDTO>("/api/v1/datos");
  const users = [...dto.catalogos.users.filter(user => user.id !== sessionUser.id), sessionUser];
  const projects = mapProjects(dto.proyectos, sessionUser);
  const projectEvents: ProjectEvent[] = dto.proyectos.flatMap(project =>
    project.historial.map(event => ({
      id: event.id,
      projectId: project.id,
      tipo: event.tipo,
      registradoAt: event.registradoAt,
      contenido: event.contenido,
      usuario: event.usuarioEmail,
    })),
  );
  installData({
    asOfDate: dto.asOfDate,
    catalogs: mapCatalogs(dto.catalogos),
    clients: mapClients(dto.proyectos),
    users,
    projects,
    projectStatus: mapStatuses(dto.proyectos, sessionUser, dto.asOfDate),
    projectProgressHistory: mapProgress(dto.proyectos, sessionUser),
    projectEvents,
    risks: mapRisks(dto.riesgos, sessionUser, dto.asOfDate),
    billingMilestones: mapBilling(dto.facturacion),
    purchases: mapPurchases(dto.compras, sessionUser),
    planChangeRequests: mapPlanChanges(dto.cambios, sessionUser, dto.asOfDate),
    milestones: [],
    riskSuggestions: [],
    riskReviews: [],
    riskActions: [],
    riskEvents: [],
    evidence: [],
    changeControls: [],
    timeEntries: [],
    commitments: [],
    lessonsLearned: [],
    projectDocuments: [],
    projectDecisions: [],
  });
  setCurrentUser(sessionUser);
  refreshCatalogs(dto.catalogos.estados.map(state => normalizeStatus(state.nombre)));
}
