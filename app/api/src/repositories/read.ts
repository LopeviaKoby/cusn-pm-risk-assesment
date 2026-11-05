import { config } from "../config";
import { sql } from "../db";
import { PROJECT_STATES, sumAmounts } from "../domain";
import { assertPermission, hasPermission, visibleProjects } from "../authorization";
import { ApiError } from '../errors';
import { isOperationalRisk } from '../domain/projects/state';
import { baselineDeviation, cpi } from '../domain/performance';
import { civilDate } from '../domain/shared/civil-date';
import { money } from '../domain/shared/money';
import { leadTime } from '../domain/procurement';
import { performanceLight, qualityLight, riskLight, type Light } from '../domain/health';

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
  spiPercent: string | null;
  cpiPercent: string | null;
  desviacionDias: number | null;
  salud: { plazo: Light; costo: Light; riesgo: Light; calidad: Light };
  riesgosAbiertos: number;
  fechaTerminoProyecto: string | null;
  fechaInicio: string | null;
  fechaRecepcionP1P2: string | null;
  fechaCierreReal: string | null;
  periodoCierreMes: string | null;
  actualizadoAt: string | null;
  tcv: { amount: string; currency: string | null; date: null } | null;
  tcvTipo: "DEFINIDO" | "ILIMITADO" | null;
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
  entidad: "RIESGO_GLOBAL" | "RIESGO_PROYECTO";
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
  tipo: string | null;
  transversal: boolean;
  operacional: boolean;
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
  origenLegacy: string | null;
  controlCambioId: string | null;
  margenPorcentaje: string | null;
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
  leadTimes: { compraBorp: number | null; borpSolped: number | null; solpedOc: number | null; ocConformidad: number | null; cicloCompleto: number | null };
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
  usuarioActualId: string;
  asOfDate: string;
  catalogos: CatalogoDTO;
  proyectos: ProyectoDTO[];
  riesgos: RiesgoDTO[];
  facturacion: FacturacionDTO[];
  compras: CompraDTO[];
  cambios: CambioDTO[];
  generadoAt: string;
};

const text = (v: unknown): string | null => v === null || v === undefined ? null : String(v);
const date = (v: unknown): string | null => v == null ? null : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);
const time = (v: unknown): string | null => v == null ? null : v instanceof Date ? v.toISOString() : String(v);
const num = (v: unknown): number | null => v == null ? null : Number(v);
const id = (v: unknown): string => String(v ?? "");

export async function getCatalogs(actor: string): Promise<CatalogoDTO> {
  const visible = await visibleProjects(actor);
  if (!visible.size) await assertPermission(actor, "proyectos.consultar", null);
  const [lobs, services, squads, countries, units, users, categories] = await Promise.all([
    sql<Row>`SELECT id::text, nombre FROM pmo_cusn.lob WHERE activo ORDER BY nombre`,
    sql<Row>`SELECT id::text,lob_id::text,nombre FROM pmo_cusn.servicio_lob WHERE activo ORDER BY nombre`,
    sql<Row>`SELECT id::text,nombre FROM pmo_cusn.squad WHERE activo ORDER BY nombre`,
    sql<Row>`SELECT codigo,nombre FROM pmo_cusn.pais WHERE activo ORDER BY nombre`,
    sql<Row>`SELECT codigo,clase FROM pmo_cusn.unidad_monetaria ORDER BY codigo`,
    sql<Row>`SELECT id::text,nombre,activo FROM pmo_cusn.usuario WHERE activo AND
      (id::text=${actor} OR id IN (SELECT usuario_id FROM pmo_cusn.participacion_proyecto WHERE proyecto_id::text=ANY(${[...visible]}::text[]))
        OR id IN (SELECT responsable_id FROM pmo_cusn.riesgo_proyecto WHERE proyecto_id::text=ANY(${[...visible]}::text[]))) ORDER BY nombre`,
    sql<Row>`SELECT DISTINCT categoria FROM pmo_cusn.riesgo_proyecto WHERE categoria IS NOT NULL AND proyecto_id::text=ANY(${[...visible]}::text[])`,
  ]);
  return {
    lobs:lobs.map(r=>({id:id(r.id),label:id(r.nombre)})),
    services:services.map(r=>({id:id(r.id),lobId:id(r.lob_id),label:id(r.nombre)})),
    squads:squads.map(r=>({id:id(r.id),label:id(r.nombre),techLeadId:null})),
    countries:countries.map(r=>({name:id(r.nombre),code:id(r.codigo)})),
    unidades:units.map(r=>({codigo:id(r.codigo),clase:id(r.clase)})),
    users:users.map(r=>({id:id(r.id),name:id(r.nombre),initials:id(r.nombre).split(/\s+/).slice(0,2).map(s=>s[0]).join(""),role:"Usuario",specialty:"",active:r.activo===true})),
    riskCategories:categories.map(r=>({id:id(r.categoria),label:id(r.categoria)})),
    complexities:["BAJO","MEDIO","ALTO","ESTRATEGICO"],
    estados:PROJECT_STATES.map(name=>({id:name,nombre:name,esCierre:name.startsWith("Cerrado"),requiereDocumentacion:name.startsWith("Cerrado")})),
  };
}

export async function getBilling(actor: string, project?: string): Promise<FacturacionDTO[]> {
  const visible = await visibleProjects(actor);
  const rows = await sql<Row>`SELECT f.*,f.id::text AS key,f.proyecto_id::text AS project,p.tvt
    FROM pmo_cusn.hito_facturacion f JOIN pmo_cusn.proyecto p ON p.id=f.proyecto_id
    WHERE p.id::text=ANY(${[...visible]}::text[]) AND (${project ?? null}::text IS NULL OR p.id::text=${project ?? null} OR p.tvt=${project ?? null}) ORDER BY f.periodo,f.id`;
  return rows.map(r=>({id:id(r.key),idOrigen:null,proyectoId:id(r.project),proyectoTvt:text(r.tvt),periodo:(date(r.periodo)??"").slice(0,7),tipo:text(r.tipo_hito),cuota:text(r.tipo_cuota),unidad:text(r.unidad_codigo),showprice:text(r.showprice),planificado:text(r.planificado),real:text(r.real_reportado),estado:text(r.estado),origen:text(r.origen),origenRef:text(r.origen_ref),origenLegacy:text(r.origen_legacy),controlCambioId:text(r.control_cambio_id),margenPorcentaje:text(r.margen_porcentaje),comentario:text(r.comentario),actualizadoAt:time(r.updated_at)}));
}

export async function getProjects(actor: string): Promise<ProyectoDTO[]> {
  const visible = await visibleProjects(actor);
  const [billing, risks] = await Promise.all([getBilling(actor),getRisks(actor)]);
  const rows = await sql<Row>`
    SELECT p.*,p.id::text AS key,p.cliente_id::text AS client,p.lob_id::text AS lob_key,p.squad_id::text AS squad_key,
      c.nombre AS client_name,c.sector,c.descripcion AS client_description,pa.nombre AS country,pa.codigo AS country_code,l.nombre AS lob_name,sq.nombre AS squad_name,
      sl.id::text AS service_key,sl.nombre AS service_name,
      s.avance_planificado,s.avance_real,s.spi,s.actividades,s.proximos_pasos,s.created_at AS seguimiento_at,
      cc.tcv_tipo,cc.tcv_valor,cc.unidad_codigo,ec.tipificacion,
      pm.usuario_id::text AS pm_id,u.nombre AS pm_name,
      (SELECT count(*)::text FROM pmo_cusn.riesgo_proyecto r WHERE r.proyecto_id=p.id AND r.estado <> 'Mitigado') AS risk_count,
      (SELECT count(*)::text FROM pmo_cusn.control_cambio ch WHERE ch.proyecto_id=p.id AND (ch.estado_aprobacion IS NULL OR ch.estado_aprobacion='PENDIENTE')) AS open_change_count
    FROM pmo_cusn.proyecto p JOIN pmo_cusn.cliente c ON c.id=p.cliente_id
    JOIN pmo_cusn.pais pa ON pa.id=p.pais_id JOIN pmo_cusn.lob l ON l.id=p.lob_id
    LEFT JOIN pmo_cusn.squad sq ON sq.id=p.squad_id
    LEFT JOIN LATERAL (SELECT servicio_lob_id FROM pmo_cusn.proyecto_servicio_lob WHERE proyecto_id=p.id ORDER BY servicio_lob_id LIMIT 1) ps ON true
    LEFT JOIN pmo_cusn.servicio_lob sl ON sl.id=ps.servicio_lob_id
    LEFT JOIN LATERAL (SELECT * FROM pmo_cusn.seguimiento_proyecto WHERE proyecto_id=p.id ORDER BY fecha_registro DESC,id DESC LIMIT 1) s ON true
    LEFT JOIN pmo_cusn.condicion_comercial cc ON cc.proyecto_id=p.id
    LEFT JOIN LATERAL (SELECT tipificacion FROM pmo_cusn.evaluacion_complejidad WHERE proyecto_id=p.id ORDER BY fecha_evaluacion DESC,id DESC LIMIT 1) ec ON true
    LEFT JOIN LATERAL (SELECT usuario_id FROM pmo_cusn.participacion_proyecto WHERE proyecto_id=p.id AND funcion='PM' AND (fecha_inicio IS NULL OR fecha_inicio<=(now() AT TIME ZONE 'America/Santiago')::date) AND (fecha_fin IS NULL OR fecha_fin>=(now() AT TIME ZONE 'America/Santiago')::date) ORDER BY id LIMIT 1) pm ON true
    LEFT JOIN pmo_cusn.usuario u ON u.id=pm.usuario_id
    WHERE p.activo AND p.id::text=ANY(${[...visible]}::text[]) ORDER BY p.id
  `;
  return rows.map(r=>{
    const key=id(r.key),currency=text(r.unidad_codigo),year=config.asOfDate.slice(0,4);
    const amounts=billing.filter(b=>b.proyectoId===key&&b.unidad===currency&&b.periodo.startsWith(year)&&b.planificado!==null).map(b=>b.planificado!);
    const planned=num(r.avance_planificado),actual=num(r.avance_real);
    const relevantRisks=risks.filter(risk=>risk.entidad==='RIESGO_PROYECTO'&&risk.proyectoId===key&&['Pendiente','Contingencia'].includes(risk.estado??''));
    const cpiPercent=currency?cpi(billing.filter(row=>row.periodo).map(row=>({projectId:row.proyectoId,unit:row.unidad??'',period:civilDate(`${row.periodo}-01`),planned:row.planificado===null?null:money(row.planificado),reported:row.real===null?null:money(row.real)})),key,currency,config.asOfDate.slice(0,7)):null;
    const baseline=date(r.fecha_termino_baseline),current=date(r.fecha_termino_actual);
      return {id:key,tvt:id(r.tvt),tvtKeyOrigen:null,nombre:id(r.nombre),cliente:{id:id(r.client),nombre:id(r.client_name),sector:text(r.sector),relationship:text(r.client_description)},
      gestorId:text(r.pm_id),gestorNombre:text(r.pm_name),pais:text(r.country),countryCode:id(r.country_code),lobId:id(r.lob_key),lob:id(r.lob_name),servicioLobId:text(r.service_key),servicioLob:text(r.service_name),squadId:text(r.squad_key),squad:text(r.squad_name),
      lideresTecnicos:null,techLeadId:null,preventaNombre:null,preSalesId:null,tamNombre:null,tamId:null,sdmNombre:null,sdmId:null,accountManagerNombre:null,accountManagerId:null,
        estado:id(r.estado_actual),estadoId:id(r.estado_actual),avancePlanificadoPct:planned,avanceRealPct:actual,spiRatio:r.spi==null?null:Number(r.spi)/100,spiPercent:text(r.spi),cpiPercent,desviacionDias:baseline&&current?baselineDeviation(civilDate(baseline),civilDate(current)):null,
        salud:{plazo:performanceLight(text(r.spi)),costo:performanceLight(cpiPercent),riesgo:riskLight(relevantRisks.map(risk=>risk.severidad)),calidad:qualityLight(relevantRisks.filter(risk=>risk.estado==='Contingencia').length,Number(r.open_change_count))},riesgosAbiertos:Number(r.risk_count),
        fechaTerminoProyecto:date(r.fecha_termino_actual??r.fecha_termino_baseline),fechaInicio:date(r.fecha_inicio),fechaRecepcionP1P2:date(r.fecha_recepcion_p1p2),fechaCierreReal:date(r.fecha_cierre_real),periodoCierreMes:text(r.periodo_cierre_mes),actualizadoAt:time(r.seguimiento_at??r.updated_at),
      tcv:r.tcv_tipo==='DEFINIDO'?{amount:id(r.tcv_valor),currency,date:null}:null,
      tcvTipo:r.tcv_tipo==='DEFINIDO'||r.tcv_tipo==='ILIMITADO'?r.tcv_tipo:null,
      acv:amounts.length&&currency?{amount:sumAmounts(amounts),currency,period:year,date:null,origin:"SQL · facturación planificada",status:"Plan comercial"}:null,
      complejidad:text(r.tipificacion),situacionInicial:text(r.situacion_inicial),situacion:text(r.actividades),proximosPasos:text(r.proximos_pasos),referencias:{sap:text(r.referencia_sap),ceco:text(r.referencia_ceco),pep:text(r.referencia_pep)},historial:[]};
  });
}

export async function getProject(actor: string, key: string): Promise<ProyectoDTO|null> {
  const project=(await getProjects(actor)).find(p=>p.id===key||p.tvt===key);
  if(!project)return null;
  const events=await sql<Row>`SELECT e.id::text,e.tipo_evento,e.fecha_evento,e.detalle,u.email FROM pmo_cusn.evento_proyecto e LEFT JOIN pmo_cusn.usuario u ON u.id=e.actor_id WHERE e.proyecto_id=${project.id} ORDER BY e.fecha_evento,e.id`;
  project.historial=events.map(r=>({id:id(r.id),tipo:id(r.tipo_evento),registradoAt:time(r.fecha_evento)??"",contenido:r.detalle,usuarioEmail:text(r.email)}));
  return project;
}

export async function getRisks(actor: string, project?: string): Promise<RiesgoDTO[]> {
  const visible=await visibleProjects(actor).catch(async error=>{
    if(error instanceof ApiError && await hasPermission(actor,"riesgos.gestionar",null))return new Set<string>();
    throw error;
  });
  const projectRows=await sql<Row>`SELECT r.*,r.id::text AS key,r.proyecto_id::text AS project,p.tvt,r.responsable_id::text AS owner,u.nombre AS owner_name,
      e.probabilidad,e.impacto,e.severidad,p.estado_actual AS project_state,
      EXISTS(SELECT 1 FROM pmo_cusn.riesgo_control_riesgo rc JOIN pmo_cusn.control_riesgo cr ON cr.id=rc.control_riesgo_id
        WHERE rc.riesgo_proyecto_id=r.id AND cr.activo) AS active_control
      FROM pmo_cusn.riesgo_proyecto r JOIN pmo_cusn.proyecto p ON p.id=r.proyecto_id
    LEFT JOIN pmo_cusn.usuario u ON u.id=r.responsable_id
    LEFT JOIN LATERAL (SELECT probabilidad,impacto,severidad FROM pmo_cusn.evaluacion_riesgo WHERE riesgo_proyecto_id=r.id ORDER BY fecha_evaluacion DESC,id DESC LIMIT 1) e ON true
    WHERE p.id::text=ANY(${[...visible]}::text[]) AND (${project??null}::text IS NULL OR p.id::text=${project??null} OR p.tvt=${project??null}) ORDER BY r.id`;
  const globalRows= !project && await hasPermission(actor,"riesgos_globales.gestionar",null)
    ? await sql<Row>`SELECT *,id::text AS key,probabilidad_sugerida AS probabilidad,impacto_sugerido AS impacto FROM pmo_cusn.riesgo_global WHERE activo ORDER BY id` : [];
  const map=(r:Row,global:boolean):RiesgoDTO=>({id:id(r.key),entidad:global?"RIESGO_GLOBAL":"RIESGO_PROYECTO",alcance:global||r.project==null?"GLOBAL":"PROYECTO",proyectoId:text(r.project),proyectoTvt:text(r.tvt),nombre:id(r.nombre),causa:text(r.descripcion),estado:global?null:text(r.estado),categoria:text(r.categoria),probabilidad:num(r.probabilidad),impacto:num(r.impacto),severidad:global&&num(r.probabilidad)!==null&&num(r.impacto)!==null?num(r.probabilidad)!*num(r.impacto)!:global?null:num(r.severidad),estrategia:text(r.estrategia),planMitigacion:text(r.plan_mitigacion),planContingencia:text(r.plan_contingencia),responsableNombre:text(r.owner_name),responsableId:text(r.owner),tipo:null,transversal:global||r.es_transversal===true,operacional:!global&&isOperationalRisk(text(r.project_state),r.active_control===true),scopes:[],creadoAt:time(r.created_at),actualizadoAt:time(r.updated_at),reviewDate:null});
  const transverse= !project && (await hasPermission(actor,"proyectos.consultar",null) || await hasPermission(actor,"riesgos.gestionar",null))
    ? await sql<Row>`SELECT r.*,r.id::text AS key,NULL::text AS project,NULL::text AS tvt,r.responsable_id::text AS owner,u.nombre AS owner_name,
      e.probabilidad,e.impacto,e.severidad FROM pmo_cusn.riesgo_proyecto r LEFT JOIN pmo_cusn.usuario u ON u.id=r.responsable_id
      LEFT JOIN LATERAL (SELECT probabilidad,impacto,severidad FROM pmo_cusn.evaluacion_riesgo WHERE riesgo_proyecto_id=r.id ORDER BY fecha_evaluacion DESC,id DESC LIMIT 1) e ON true
      WHERE r.proyecto_id IS NULL AND r.es_transversal ORDER BY r.id` : [];
  return [...projectRows.map(r=>map(r,false)),...transverse.map(r=>map(r,false)),...globalRows.map(r=>map(r,true))];
}

export async function getTransverseRisks(actor:string):Promise<RiesgoDTO[]> {
  if(!await hasPermission(actor,"proyectos.consultar",null) && !await hasPermission(actor,"riesgos.gestionar",null))
    throw new ApiError(403,"FORBIDDEN","No tienes permiso de portafolio.");
  return (await getRisks(actor)).filter(r=>r.entidad==="RIESGO_PROYECTO"&&r.proyectoId===null);
}

export async function getGlobalRisk(actor:string,key:string):Promise<RiesgoDTO|null> {
  await assertPermission(actor,"riesgos_globales.gestionar",null);
  const [r]=await sql<Row>`SELECT *,id::text AS key FROM pmo_cusn.riesgo_global WHERE id::text=${key} AND activo`;
  if(!r)return null;
  const probability=num(r.probabilidad_sugerida),impact=num(r.impacto_sugerido);
  return {id:id(r.key),entidad:"RIESGO_GLOBAL",alcance:"GLOBAL",proyectoId:null,proyectoTvt:null,nombre:id(r.nombre),causa:text(r.descripcion),estado:null,categoria:text(r.categoria),probabilidad:probability,impacto:impact,severidad:probability!==null&&impact!==null?probability*impact:null,estrategia:null,planMitigacion:null,planContingencia:null,responsableNombre:null,responsableId:null,tipo:null,transversal:true,operacional:false,scopes:[],creadoAt:time(r.created_at),actualizadoAt:null,reviewDate:null};
}
export async function getProjectRisk(actor:string,project:string,key:string):Promise<RiesgoDTO|null> {return (await getRisks(actor,project)).find(r=>r.id===key)??null;}

export async function getPurchases(actor:string,project?:string):Promise<CompraDTO[]> {
  const visible=await visibleProjects(actor);
  const rows=await sql<Row>`SELECT c.*,c.id::text AS key,c.proyecto_id::text AS project,p.tvt,v.nombre AS provider,u.nombre AS manager,
      (SELECT tipo_etapa FROM pmo_cusn.etapa_compra WHERE compra_id=c.id AND nullif(btrim(referencia_documento),'') IS NOT NULL
        ORDER BY CASE tipo_etapa WHEN 'CONFORMIDAD' THEN 4 WHEN 'OC' THEN 3 WHEN 'SOLPED' THEN 2 ELSE 1 END DESC LIMIT 1) AS stage,
      (c.valor_setup+c.valor_recurrente*c.meses_recurrentes)::text AS total,
      (SELECT max((e.fecha_registro AT TIME ZONE 'America/Santiago')::date)::text FROM pmo_cusn.etapa_compra e WHERE e.compra_id=c.id AND e.tipo_etapa='BORP' AND nullif(btrim(e.referencia_documento),'') IS NOT NULL) borp_day,
      (SELECT max((e.fecha_registro AT TIME ZONE 'America/Santiago')::date)::text FROM pmo_cusn.etapa_compra e WHERE e.compra_id=c.id AND e.tipo_etapa='SOLPED' AND nullif(btrim(e.referencia_documento),'') IS NOT NULL) solped_day,
      (SELECT max((e.fecha_registro AT TIME ZONE 'America/Santiago')::date)::text FROM pmo_cusn.etapa_compra e WHERE e.compra_id=c.id AND e.tipo_etapa='OC' AND nullif(btrim(e.referencia_documento),'') IS NOT NULL) oc_day,
      (SELECT max((e.fecha_registro AT TIME ZONE 'America/Santiago')::date)::text FROM pmo_cusn.etapa_compra e WHERE e.compra_id=c.id AND e.tipo_etapa='CONFORMIDAD' AND nullif(btrim(e.referencia_documento),'') IS NOT NULL) conformity_day
    FROM pmo_cusn.compra c JOIN pmo_cusn.proyecto p ON p.id=c.proyecto_id JOIN pmo_cusn.proveedor v ON v.id=c.proveedor_id
    LEFT JOIN pmo_cusn.usuario u ON u.id=c.gestor_compra_id WHERE p.id::text=ANY(${[...visible]}::text[])
    AND (${project??null}::text IS NULL OR p.id::text=${project??null} OR p.tvt=${project??null}) ORDER BY c.id`;
  return rows.map(r=>{
    const from=(value:unknown)=>{const raw=date(value);return raw?civilDate(raw):null;};
    const purchase=from(r.fecha_solicitud),borp=from(r.borp_day),solped=from(r.solped_day),oc=from(r.oc_day),conformity=from(r.conformity_day);
    return {id:id(r.key),idOrigen:null,proyectoId:id(r.project),proyectoTvt:text(r.tvt),concepto:text(r.concepto),proveedor:text(r.provider),estado:text(r.stage),fechaCompra:date(r.fecha_solicitud),gestor:text(r.manager),unidad:text(r.unidad_codigo),total:text(r.total),presupuesto:text(r.presupuesto),montoAdjudicado:text(r.monto_adjudicado),ahorro:text(r.ahorro),recepcionEsperada:date(r.fecha_recepcion_esperada),recepcionReal:date(r.fecha_recepcion_real),
      leadTimes:{compraBorp:leadTime(purchase,borp),borpSolped:leadTime(borp,solped),solpedOc:leadTime(solped,oc),ocConformidad:leadTime(oc,conformity),cicloCompleto:leadTime(purchase,conformity)}};
  });
}

export async function getPlanChanges(actor:string,state?:string):Promise<CambioDTO[]> {
  const visible=await visibleProjects(actor);
  const rows=await sql<Row>`SELECT s.*,s.id::text AS key,s.proyecto_id::text AS project,p.tvt,u.nombre AS requester,a.nombre AS approver
    FROM pmo_cusn.solicitud_cambio_planificacion s JOIN pmo_cusn.proyecto p ON p.id=s.proyecto_id
    JOIN pmo_cusn.usuario u ON u.id=s.solicitante_id LEFT JOIN pmo_cusn.usuario a ON a.id=s.aprobador_id
    WHERE p.id::text=ANY(${[...visible]}::text[]) AND (${state??null}::text IS NULL OR s.estado=upper(${state??null})) ORDER BY s.id`;
  return rows.map(r=>({id:id(r.key),idOrigen:null,proyectoId:id(r.project),proyectoTvt:text(r.tvt),campo:id(r.campo),valorAnterior:date(r.valor_anterior),valorPropuesto:date(r.valor_propuesto),solicitante:text(r.requester),estado:text(r.estado),titulo:text(r.justificacion),creadoAt:time(r.fecha_solicitud),resueltoAt:time(r.fecha_resolucion),resueltoPor:text(r.approver)}));
}

export async function buildBootstrap(actor:string):Promise<BootstrapDTO> {
  const catalogos=await getCatalogs(actor);
  const [projects,riesgos,facturacion,compras,cambios]=await Promise.all([getProjects(actor),getRisks(actor),getBilling(actor),getPurchases(actor),getPlanChanges(actor)]);
  const events=await sql<Row>`SELECT e.*,e.id::text AS key,e.proyecto_id::text AS project,u.email FROM pmo_cusn.evento_proyecto e
    LEFT JOIN pmo_cusn.usuario u ON u.id=e.actor_id WHERE e.proyecto_id::text=ANY(${projects.map(p=>p.id)}::text[]) ORDER BY e.fecha_evento,e.id`;
  const proyectos=projects.map(p=>({...p,historial:events.filter(e=>e.project===p.id).map(e=>({id:id(e.key),tipo:id(e.tipo_evento),registradoAt:time(e.fecha_evento)??"",contenido:e.detalle,usuarioEmail:text(e.email)}))}));
  return {usuarioActualId:actor,asOfDate:config.asOfDate,catalogos,proyectos,riesgos,facturacion,compras,cambios,generadoAt:new Date().toISOString()};
}
