// REST projections; persistent entities are generated from app/api/migrations.
export type User = { id: string; name: string; initials: string; role: string; active: boolean };
export type Project = {
  id: string; tvt: string; nombre: string; estado: string;
  cliente: { id: string; nombre: string; sector: string | null };
  gestorId: string | null; gestorNombre: string | null;
  pais: string | null; lob: string; squad: string | null;
  avancePlanificadoPct: number | null; avanceRealPct: number | null;
  spiRatio: number | null; riesgosAbiertos: number;
  fechaInicio: string | null; fechaTerminoProyecto: string | null;
  actualizadoAt: string | null; situacion: string | null; proximosPasos: string | null;
  complejidad: string | null;
  tcv: { amount: string; currency: string | null } | null;
  acv: { amount: string; currency: string; period: string } | null;
  historial: { id: string; tipo: string; registradoAt: string; contenido: unknown; usuarioEmail: string | null }[];
};
export type Risk = {
  id: string; entidad: "RIESGO_GLOBAL" | "RIESGO_PROYECTO";
  proyectoId: string | null; proyectoTvt: string | null;
  nombre: string; causa: string | null; estado: string | null; categoria: string | null;
  probabilidad: number | null; impacto: number | null; severidad: number | null;
  estrategia: string | null; planMitigacion: string | null; planContingencia: string | null;
  responsableNombre: string | null; tipo: string | null; transversal: boolean;
  creadoAt: string | null; actualizadoAt: string | null;
};
export type Billing = {
  id: string; proyectoId: string; proyectoTvt: string | null; periodo: string;
  tipo: string | null; unidad: string | null;
  showprice: string | null; planificado: string | null; real: string | null;
  estado: string | null;
};
export type Bootstrap = {
  usuarioActualId: string; asOfDate: string;
  catalogos: { users: User[]; estados: { nombre: string }[] };
  proyectos: Project[]; riesgos: Risk[]; facturacion: Billing[];
  generadoAt: string;
};
