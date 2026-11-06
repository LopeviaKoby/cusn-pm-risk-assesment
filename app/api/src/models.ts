// Generado por db:models desde el catálogo PostgreSQL del DDL v2.1.0. No editar a mano.
// bigint y numeric se reciben como string; date/timestamptz como Date en Bun SQL.
export type BigintId = string;
export type Decimal = string;
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export interface AccionRiesgoRow {
  id: BigintId;
  riesgo_proyecto_id: BigintId;
  responsable_id: BigintId | null;
  descripcion: string;
  estado: string;
  fecha_compromiso: Date | null;
  fecha_cumplimiento: Date | null;
  created_at: Date;
}
export type AccionRiesgoInsert = Pick<AccionRiesgoRow, "riesgo_proyecto_id" | "descripcion"> & Partial<Pick<AccionRiesgoRow, "riesgo_proyecto_id" | "responsable_id" | "descripcion" | "estado" | "fecha_compromiso" | "fecha_cumplimiento" | "created_at">>;

export interface AmbitoCambioRow {
  id: BigintId;
  nombre: string;
  activo: boolean;
}
export type AmbitoCambioInsert = Pick<AmbitoCambioRow, "nombre"> & Partial<Pick<AmbitoCambioRow, "nombre" | "activo">>;

export interface AsignacionRolRow {
  id: BigintId;
  usuario_id: BigintId;
  rol_id: BigintId;
  alcance_lectura: "GLOBAL" | "ASIGNADOS";
  asignado_por_id: BigintId | null;
  created_at: Date;
  revocado_at: Date | null;
}
export type AsignacionRolInsert = Pick<AsignacionRolRow, "usuario_id" | "rol_id" | "alcance_lectura"> & Partial<Pick<AsignacionRolRow, "usuario_id" | "rol_id" | "alcance_lectura" | "asignado_por_id" | "created_at" | "revocado_at">>;

export interface AuditoriaSeguridadRow {
  id: BigintId;
  actor_id: BigintId | null;
  delegacion_id: BigintId | null;
  workspace_id: BigintId | null;
  proyecto_id: BigintId | null;
  operacion: string;
  recurso_tipo: string;
  recurso_id: string | null;
  resultado: "PERMITIDO" | "DENEGADO" | "ERROR";
  detalle: Json;
  fecha_evento: Date;
}
export type AuditoriaSeguridadInsert = Pick<AuditoriaSeguridadRow, "operacion" | "recurso_tipo" | "resultado"> & Partial<Pick<AuditoriaSeguridadRow, "actor_id" | "delegacion_id" | "workspace_id" | "proyecto_id" | "operacion" | "recurso_tipo" | "recurso_id" | "resultado" | "detalle" | "fecha_evento">>;

export interface CambioAmbitoRow {
  control_cambio_id: BigintId;
  ambito_id: BigintId;
}
export type CambioAmbitoInsert = Pick<CambioAmbitoRow, "control_cambio_id" | "ambito_id"> & Partial<Pick<CambioAmbitoRow, "control_cambio_id" | "ambito_id">>;

export interface ClienteRow {
  id: BigintId;
  nombre: string;
  sector: string | null;
  descripcion: string | null;
  estado_cliente: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}
export type ClienteInsert = Pick<ClienteRow, "nombre"> & Partial<Pick<ClienteRow, "nombre" | "sector" | "descripcion" | "estado_cliente" | "activo" | "created_at" | "updated_at">>;

export interface CompraRow {
  id: BigintId;
  proyecto_id: BigintId;
  proveedor_id: BigintId;
  gestor_compra_id: BigintId | null;
  concepto: string | null;
  descripcion: string | null;
  tipo_gasto: "CAPEX" | "OPEX" | null;
  unidad_codigo: string | null;
  fecha_solicitud: Date | null;
  monto_adjudicado: Decimal | null;
  valor_setup: Decimal | null;
  valor_recurrente: Decimal | null;
  meses_recurrentes: number | null;
  observaciones: string | null;
  created_at: Date;
}
export type CompraInsert = Pick<CompraRow, "proyecto_id" | "proveedor_id"> & Partial<Pick<CompraRow, "proyecto_id" | "proveedor_id" | "gestor_compra_id" | "concepto" | "descripcion" | "tipo_gasto" | "unidad_codigo" | "fecha_solicitud" | "monto_adjudicado" | "valor_setup" | "valor_recurrente" | "meses_recurrentes" | "observaciones" | "created_at">>;

export interface CompromisoRow {
  id: BigintId;
  proyecto_id: BigintId | null;
  pais_id: BigintId | null;
  responsable_id: BigintId | null;
  responsable_texto: string | null;
  titulo: string;
  descripcion: string | null;
  alcance: "GLOBAL" | "PAIS" | "PROYECTO";
  fecha_compromiso: Date | null;
  fecha_limite: Date | null;
  completado: boolean;
  completado_at: Date | null;
  created_at: Date;
}
export type CompromisoInsert = Pick<CompromisoRow, "titulo" | "alcance"> & Partial<Pick<CompromisoRow, "proyecto_id" | "pais_id" | "responsable_id" | "responsable_texto" | "titulo" | "descripcion" | "alcance" | "fecha_compromiso" | "fecha_limite" | "completado" | "completado_at" | "created_at">>;

export interface CondicionComercialRow {
  id: BigintId;
  proyecto_id: BigintId;
  tcv_tipo: "DEFINIDO" | "ILIMITADO";
  tcv_valor: Decimal | null;
  unidad_codigo: string | null;
  updated_at: Date;
}
export type CondicionComercialInsert = Pick<CondicionComercialRow, "proyecto_id" | "tcv_tipo"> & Partial<Pick<CondicionComercialRow, "proyecto_id" | "tcv_tipo" | "tcv_valor" | "unidad_codigo" | "updated_at">>;

export interface ContactoClienteRow {
  id: BigintId;
  cliente_id: BigintId;
  nombre: string;
  email: string | null;
  telefono: string | null;
  activo: boolean;
}
export type ContactoClienteInsert = Pick<ContactoClienteRow, "cliente_id" | "nombre"> & Partial<Pick<ContactoClienteRow, "cliente_id" | "nombre" | "email" | "telefono" | "activo">>;

export interface ControlCambioRow {
  id: BigintId;
  proyecto_id: BigintId;
  secuencia: number;
  folio: string;
  fecha_elaboracion: Date;
  descripcion: string;
  justificacion: string | null;
  urgencia: "ALTA" | "MEDIA" | "BAJA";
  estado_firma: "PENDIENTE" | "NOTIFICADO" | "FIRMADO";
  estado_aprobacion: "PENDIENTE" | "APROBADO" | "RECHAZADO" | null;
  responsabilidad: "CLIENTE" | "TIVIT" | "AMBOS" | null;
  responsable_cliente_id: BigintId | null;
  responsable_interno_id: BigintId | null;
  account_responsable_id: BigintId | null;
  impacto_monetario: Decimal | null;
  tipo_impacto: "COSTO_TIVIT" | "BENEFICIO" | null;
  unidad_codigo: string | null;
  created_at: Date;
}
export type ControlCambioInsert = Pick<ControlCambioRow, "proyecto_id" | "secuencia" | "folio" | "fecha_elaboracion" | "descripcion" | "urgencia"> & Partial<Pick<ControlCambioRow, "proyecto_id" | "secuencia" | "folio" | "fecha_elaboracion" | "descripcion" | "justificacion" | "urgencia" | "estado_firma" | "estado_aprobacion" | "responsabilidad" | "responsable_cliente_id" | "responsable_interno_id" | "account_responsable_id" | "impacto_monetario" | "tipo_impacto" | "unidad_codigo" | "created_at">>;

export interface ControlCambioDocumentoRow {
  control_cambio_id: BigintId;
  documento_id: BigintId;
  vinculado_at: Date;
}
export type ControlCambioDocumentoInsert = Pick<ControlCambioDocumentoRow, "control_cambio_id" | "documento_id"> & Partial<Pick<ControlCambioDocumentoRow, "control_cambio_id" | "documento_id" | "vinculado_at">>;

export interface ControlRiesgoRow {
  id: BigintId;
  nombre: string;
  descripcion: string;
  tipo_control: "PREVENTIVO" | "DETECTIVO" | "CORRECTIVO" | null;
  responsable_id: BigintId | null;
  frecuencia: string | null;
  activo: boolean;
  created_at: Date;
}
export type ControlRiesgoInsert = Pick<ControlRiesgoRow, "nombre" | "descripcion"> & Partial<Pick<ControlRiesgoRow, "nombre" | "descripcion" | "tipo_control" | "responsable_id" | "frecuencia" | "activo" | "created_at">>;

export interface DelegacionAccesoRow {
  id: BigintId;
  tipo: string;
  delegante_id: BigintId;
  delegado_id: BigintId;
  autorizado_por_id: BigintId | null;
  alcance: string;
  proyecto_id: BigintId;
  inicio: Date;
  fin: Date;
  motivo: string;
  estado: "PENDIENTE" | "ACTIVA" | "REVOCADA" | "RECHAZADA";
  revocado_at: Date | null;
  revocado_por_id: BigintId | null;
  created_at: Date;
}
export type DelegacionAccesoInsert = Pick<DelegacionAccesoRow, "delegante_id" | "delegado_id" | "proyecto_id" | "inicio" | "fin" | "motivo"> & Partial<Pick<DelegacionAccesoRow, "tipo" | "delegante_id" | "delegado_id" | "autorizado_por_id" | "alcance" | "proyecto_id" | "inicio" | "fin" | "motivo" | "estado" | "revocado_at" | "revocado_por_id" | "created_at">>;

export interface DelegacionPermisoRow {
  delegacion_id: BigintId;
  permiso_id: BigintId;
}
export type DelegacionPermisoInsert = Pick<DelegacionPermisoRow, "delegacion_id" | "permiso_id"> & Partial<Pick<DelegacionPermisoRow, "delegacion_id" | "permiso_id">>;

export interface DocumentoRow {
  id: BigintId;
  tipo_documento_id: BigintId | null;
  drive_file_id: string;
  nombre: string;
  mime_type: string;
  drive_version: BigintId | null;
  drive_modified_at: Date | null;
  ultimo_sync_at: Date | null;
  estado_registro: "VIGENTE" | "ARCHIVADO";
  created_by: BigintId | null;
  created_at: Date;
}
export type DocumentoInsert = Pick<DocumentoRow, "drive_file_id" | "nombre" | "mime_type"> & Partial<Pick<DocumentoRow, "tipo_documento_id" | "drive_file_id" | "nombre" | "mime_type" | "drive_version" | "drive_modified_at" | "ultimo_sync_at" | "estado_registro" | "created_by" | "created_at">>;

export interface EtapaCompraRow {
  id: BigintId;
  compra_id: BigintId;
  tipo_etapa: "BORP" | "SOLPED" | "OC" | "CONFORMIDAD";
  referencia_documento: string | null;
  estado: string | null;
  fecha_registro: Date | null;
}
export type EtapaCompraInsert = Pick<EtapaCompraRow, "compra_id" | "tipo_etapa"> & Partial<Pick<EtapaCompraRow, "compra_id" | "tipo_etapa" | "referencia_documento" | "estado" | "fecha_registro">>;

export interface EvaluacionComplejidadRow {
  id: BigintId;
  proyecto_id: BigintId;
  evaluador_id: BigintId | null;
  riesgo: number;
  facturacion: number;
  plazo: number;
  alcance: number;
  nota_riesgo: string | null;
  nota_facturacion: string | null;
  nota_plazo: string | null;
  nota_alcance: string | null;
  indice_complejidad: Decimal;
  tipificacion: "BAJO" | "MEDIO" | "ALTO" | "ESTRATEGICO";
  override_estrategico: boolean;
  motivo_override: string | null;
  version_modelo: string;
  fecha_evaluacion: Date;
}
export type EvaluacionComplejidadInsert = Pick<EvaluacionComplejidadRow, "proyecto_id" | "riesgo" | "facturacion" | "plazo" | "alcance" | "indice_complejidad" | "tipificacion"> & Partial<Pick<EvaluacionComplejidadRow, "proyecto_id" | "evaluador_id" | "riesgo" | "facturacion" | "plazo" | "alcance" | "nota_riesgo" | "nota_facturacion" | "nota_plazo" | "nota_alcance" | "indice_complejidad" | "tipificacion" | "override_estrategico" | "motivo_override" | "version_modelo" | "fecha_evaluacion">>;

export interface EvaluacionRiesgoRow {
  id: BigintId;
  riesgo_proyecto_id: BigintId;
  evaluador_id: BigintId | null;
  fecha_evaluacion: Date;
  tipo_evaluacion: "INICIAL" | "RESIDUAL" | "REVISION";
  probabilidad: number;
  impacto: number;
  readonly severidad: number | null;
  justificacion: string | null;
}
export type EvaluacionRiesgoInsert = Pick<EvaluacionRiesgoRow, "riesgo_proyecto_id" | "tipo_evaluacion" | "probabilidad" | "impacto"> & Partial<Pick<EvaluacionRiesgoRow, "riesgo_proyecto_id" | "evaluador_id" | "fecha_evaluacion" | "tipo_evaluacion" | "probabilidad" | "impacto" | "justificacion">>;

export interface EventoProyectoRow {
  id: BigintId;
  proyecto_id: BigintId;
  actor_id: BigintId | null;
  tipo_evento: string;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  motivo: string | null;
  detalle: Json;
  fecha_evento: Date;
}
export type EventoProyectoInsert = Pick<EventoProyectoRow, "proyecto_id" | "tipo_evento"> & Partial<Pick<EventoProyectoRow, "proyecto_id" | "actor_id" | "tipo_evento" | "estado_anterior" | "estado_nuevo" | "motivo" | "detalle" | "fecha_evento">>;

export interface HitoFacturacionRow {
  id: BigintId;
  proyecto_id: BigintId;
  periodo: Date;
  tipo_hito: string | null;
  tipo_cuota: string | null;
  unidad_codigo: string | null;
  showprice: Decimal | null;
  planificado: Decimal | null;
  real_reportado: Decimal | null;
  estado: string | null;
  comentario: string | null;
  origen: string | null;
  origen_ref: string | null;
  updated_at: Date;
}
export type HitoFacturacionInsert = Pick<HitoFacturacionRow, "proyecto_id" | "periodo"> & Partial<Pick<HitoFacturacionRow, "proyecto_id" | "periodo" | "tipo_hito" | "tipo_cuota" | "unidad_codigo" | "showprice" | "planificado" | "real_reportado" | "estado" | "comentario" | "origen" | "origen_ref" | "updated_at">>;

export interface InvitacionWorkspaceRow {
  id: BigintId;
  workspace_id: BigintId;
  email_destinatario: string;
  invitado_por_id: BigintId;
  rol_solicitado_id: BigintId | null;
  puede_crear_proyectos: boolean;
  token_hash: string;
  estado: "PENDIENTE" | "ACEPTADA" | "REVOCADA" | "EXPIRADA";
  expires_at: Date;
  accepted_at: Date | null;
  created_at: Date;
}
export type InvitacionWorkspaceInsert = Pick<InvitacionWorkspaceRow, "workspace_id" | "email_destinatario" | "invitado_por_id" | "token_hash" | "expires_at"> & Partial<Pick<InvitacionWorkspaceRow, "workspace_id" | "email_destinatario" | "invitado_por_id" | "rol_solicitado_id" | "puede_crear_proyectos" | "token_hash" | "estado" | "expires_at" | "accepted_at" | "created_at">>;

export interface ItemChecklistDocumentoRow {
  item_checklist_id: BigintId;
  documento_id: BigintId;
  vinculado_at: Date;
  vinculado_por: BigintId | null;
}
export type ItemChecklistDocumentoInsert = Pick<ItemChecklistDocumentoRow, "item_checklist_id" | "documento_id"> & Partial<Pick<ItemChecklistDocumentoRow, "item_checklist_id" | "documento_id" | "vinculado_at" | "vinculado_por">>;

export interface ItemChecklistProyectoRow {
  id: BigintId;
  proyecto_id: BigintId;
  tipo_entregable_id: BigintId | null;
  nombre: string;
  orden: number | null;
  obligatorio: boolean;
  requiere_documento: boolean;
  completado: boolean;
  comentario: string | null;
  completado_por: BigintId | null;
  completado_at: Date | null;
}
export type ItemChecklistProyectoInsert = Pick<ItemChecklistProyectoRow, "proyecto_id" | "nombre"> & Partial<Pick<ItemChecklistProyectoRow, "proyecto_id" | "tipo_entregable_id" | "nombre" | "orden" | "obligatorio" | "requiere_documento" | "completado" | "comentario" | "completado_por" | "completado_at">>;

export interface LeccionAprendidaRow {
  id: BigintId;
  proyecto_id: BigintId | null;
  autor_id: BigintId | null;
  fecha: Date | null;
  titulo: string;
  area: string | null;
  situacion: string | null;
  impacto: string | null;
  acciones_correctivas: string | null;
  leccion: string;
  correo_texto: string | null;
  created_at: Date;
  updated_at: Date;
}
export type LeccionAprendidaInsert = Pick<LeccionAprendidaRow, "titulo" | "leccion"> & Partial<Pick<LeccionAprendidaRow, "proyecto_id" | "autor_id" | "fecha" | "titulo" | "area" | "situacion" | "impacto" | "acciones_correctivas" | "leccion" | "correo_texto" | "created_at" | "updated_at">>;

export interface LeccionDocumentoRow {
  leccion_id: BigintId;
  documento_id: BigintId;
  vinculado_at: Date;
}
export type LeccionDocumentoInsert = Pick<LeccionDocumentoRow, "leccion_id" | "documento_id"> & Partial<Pick<LeccionDocumentoRow, "leccion_id" | "documento_id" | "vinculado_at">>;

export interface LobRow {
  id: BigintId;
  nombre: string;
  activo: boolean;
}
export type LobInsert = Pick<LobRow, "nombre"> & Partial<Pick<LobRow, "nombre" | "activo">>;

export interface MembresiaWorkspaceRow {
  id: BigintId;
  workspace_id: BigintId;
  usuario_id: BigintId;
  puede_crear_proyectos: boolean;
  estado: "ACTIVA" | "SUSPENDIDA" | "RETIRADA";
  incorporado_por_id: BigintId | null;
  created_at: Date;
  updated_at: Date;
}
export type MembresiaWorkspaceInsert = Pick<MembresiaWorkspaceRow, "workspace_id" | "usuario_id"> & Partial<Pick<MembresiaWorkspaceRow, "workspace_id" | "usuario_id" | "puede_crear_proyectos" | "estado" | "incorporado_por_id" | "created_at" | "updated_at">>;

export interface PaisRow {
  id: BigintId;
  codigo: string;
  nombre: string;
  activo: boolean;
}
export type PaisInsert = Pick<PaisRow, "codigo" | "nombre"> & Partial<Pick<PaisRow, "codigo" | "nombre" | "activo">>;

export interface ParticipacionProyectoRow {
  id: BigintId;
  proyecto_id: BigintId;
  usuario_id: BigintId;
  funcion: "PM_TITULAR" | "ESPECIALISTA" | "OBSERVADOR" | "LIDER_TECNICO" | "TAM" | "SDM";
  fecha_inicio: Date;
  fecha_fin: Date | null;
}
export type ParticipacionProyectoInsert = Pick<ParticipacionProyectoRow, "proyecto_id" | "usuario_id" | "funcion"> & Partial<Pick<ParticipacionProyectoRow, "proyecto_id" | "usuario_id" | "funcion" | "fecha_inicio" | "fecha_fin">>;

export interface PermisoRow {
  id: BigintId;
  codigo: string;
  descripcion: string;
  delegable: boolean;
}
export type PermisoInsert = Pick<PermisoRow, "codigo" | "descripcion"> & Partial<Pick<PermisoRow, "codigo" | "descripcion" | "delegable">>;

export interface ProveedorRow {
  id: BigintId;
  nombre: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}
export type ProveedorInsert = Pick<ProveedorRow, "nombre"> & Partial<Pick<ProveedorRow, "nombre" | "activo" | "created_at" | "updated_at">>;

export interface ProyectoRow {
  id: BigintId;
  tvt: string;
  readonly tvt_normalizado: string | null;
  workspace_id: BigintId;
  creado_por_id: BigintId;
  version: BigintId;
  cliente_id: BigintId;
  pais_id: BigintId;
  lob_id: BigintId;
  squad_id: BigintId | null;
  nombre: string;
  descripcion: string | null;
  situacion_inicial: string | null;
  estado_actual: "Requiere P1P2" | "En ejecución" | "En transición" | "Detenido" | "Cancelado" | "Cerrado exitoso" | "Cerrado con observaciones";
  fecha_recepcion_p1p2: Date | null;
  fecha_inicio: Date | null;
  fecha_termino_baseline: Date | null;
  fecha_termino_actual: Date | null;
  drive_folder_id: string | null;
  referencia_sap: string | null;
  referencia_ceco: string | null;
  referencia_pep: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}
export type ProyectoInsert = Pick<ProyectoRow, "tvt" | "workspace_id" | "creado_por_id" | "cliente_id" | "pais_id" | "lob_id" | "nombre"> & Partial<Pick<ProyectoRow, "tvt" | "workspace_id" | "creado_por_id" | "version" | "cliente_id" | "pais_id" | "lob_id" | "squad_id" | "nombre" | "descripcion" | "situacion_inicial" | "estado_actual" | "fecha_recepcion_p1p2" | "fecha_inicio" | "fecha_termino_baseline" | "fecha_termino_actual" | "drive_folder_id" | "referencia_sap" | "referencia_ceco" | "referencia_pep" | "activo" | "created_at" | "updated_at">>;

export interface ProyectoContactoRow {
  proyecto_id: BigintId;
  contacto_id: BigintId;
  cliente_id: BigintId;
  rol_contacto: string;
}
export type ProyectoContactoInsert = Pick<ProyectoContactoRow, "proyecto_id" | "contacto_id" | "cliente_id" | "rol_contacto"> & Partial<Pick<ProyectoContactoRow, "proyecto_id" | "contacto_id" | "cliente_id" | "rol_contacto">>;

export interface ProyectoDocumentoRow {
  proyecto_id: BigintId;
  documento_id: BigintId;
  vinculado_at: Date;
  vinculado_por: BigintId | null;
}
export type ProyectoDocumentoInsert = Pick<ProyectoDocumentoRow, "proyecto_id" | "documento_id"> & Partial<Pick<ProyectoDocumentoRow, "proyecto_id" | "documento_id" | "vinculado_at" | "vinculado_por">>;

export interface ProyectoServicioLobRow {
  proyecto_id: BigintId;
  servicio_lob_id: BigintId;
  lob_id: BigintId;
}
export type ProyectoServicioLobInsert = Pick<ProyectoServicioLobRow, "proyecto_id" | "servicio_lob_id" | "lob_id"> & Partial<Pick<ProyectoServicioLobRow, "proyecto_id" | "servicio_lob_id" | "lob_id">>;

export interface RegistroNotificacionRow {
  id: BigintId;
  usuario_destinatario_id: BigintId | null;
  proyecto_id: BigintId | null;
  destinatario_email: string;
  tipo: string;
  canal: "EMAIL" | "APLICACION";
  asunto: string;
  estado_envio: "PENDIENTE" | "ENVIADA" | "ERROR" | "CANCELADA";
  creado_at: Date;
  enviado_at: Date | null;
  error_detalle: string | null;
}
export type RegistroNotificacionInsert = Pick<RegistroNotificacionRow, "destinatario_email" | "tipo" | "asunto"> & Partial<Pick<RegistroNotificacionRow, "usuario_destinatario_id" | "proyecto_id" | "destinatario_email" | "tipo" | "canal" | "asunto" | "estado_envio" | "creado_at" | "enviado_at" | "error_detalle">>;

export interface RiesgoControlRiesgoRow {
  riesgo_proyecto_id: BigintId;
  control_riesgo_id: BigintId;
  observaciones: string | null;
}
export type RiesgoControlRiesgoInsert = Pick<RiesgoControlRiesgoRow, "riesgo_proyecto_id" | "control_riesgo_id"> & Partial<Pick<RiesgoControlRiesgoRow, "riesgo_proyecto_id" | "control_riesgo_id" | "observaciones">>;

export interface RiesgoGlobalRow {
  id: BigintId;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  probabilidad_sugerida: number | null;
  impacto_sugerido: number | null;
  activo: boolean;
  created_at: Date;
}
export type RiesgoGlobalInsert = Pick<RiesgoGlobalRow, "nombre"> & Partial<Pick<RiesgoGlobalRow, "nombre" | "descripcion" | "categoria" | "probabilidad_sugerida" | "impacto_sugerido" | "activo" | "created_at">>;

export interface RiesgoProyectoRow {
  id: BigintId;
  proyecto_id: BigintId;
  riesgo_global_id: BigintId | null;
  responsable_id: BigintId | null;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  estado: "Pendiente" | "Contingencia" | "Controlado" | "Mitigado";
  estrategia: "Mitigar" | "Aceptar" | "Transferir" | "Evitar" | "Reducir" | null;
  plan_mitigacion: string | null;
  plan_contingencia: string | null;
  created_at: Date;
  updated_at: Date;
}
export type RiesgoProyectoInsert = Pick<RiesgoProyectoRow, "proyecto_id" | "nombre"> & Partial<Pick<RiesgoProyectoRow, "proyecto_id" | "riesgo_global_id" | "responsable_id" | "nombre" | "descripcion" | "categoria" | "estado" | "estrategia" | "plan_mitigacion" | "plan_contingencia" | "created_at" | "updated_at">>;

export interface RolRow {
  id: BigintId;
  codigo: "ADMIN" | "PM" | "ESPECIALISTA" | "VISUALIZADOR";
  nombre: string;
  activo: boolean;
}
export type RolInsert = Pick<RolRow, "codigo" | "nombre"> & Partial<Pick<RolRow, "codigo" | "nombre" | "activo">>;

export interface RolPermisoRow {
  rol_id: BigintId;
  permiso_id: BigintId;
}
export type RolPermisoInsert = Pick<RolPermisoRow, "rol_id" | "permiso_id"> & Partial<Pick<RolPermisoRow, "rol_id" | "permiso_id">>;

export interface SeguimientoProyectoRow {
  id: BigintId;
  proyecto_id: BigintId;
  registrado_por: BigintId | null;
  fecha_registro: Date;
  avance_planificado: Decimal;
  avance_real: Decimal;
  actividades: string | null;
  proximos_pasos: string | null;
  observaciones: string | null;
  created_at: Date;
}
export type SeguimientoProyectoInsert = Pick<SeguimientoProyectoRow, "proyecto_id" | "fecha_registro" | "avance_planificado" | "avance_real"> & Partial<Pick<SeguimientoProyectoRow, "proyecto_id" | "registrado_por" | "fecha_registro" | "avance_planificado" | "avance_real" | "actividades" | "proximos_pasos" | "observaciones" | "created_at">>;

export interface ServicioLobRow {
  id: BigintId;
  lob_id: BigintId;
  nombre: string;
  activo: boolean;
}
export type ServicioLobInsert = Pick<ServicioLobRow, "lob_id" | "nombre"> & Partial<Pick<ServicioLobRow, "lob_id" | "nombre" | "activo">>;

export interface ServicioOperativoRow {
  id: BigintId;
  proyecto_id: BigintId;
  fecha_inicio: Date | null;
  fecha_termino: Date | null;
  meses_servicio: number | null;
  observaciones: string | null;
}
export type ServicioOperativoInsert = Pick<ServicioOperativoRow, "proyecto_id"> & Partial<Pick<ServicioOperativoRow, "proyecto_id" | "fecha_inicio" | "fecha_termino" | "meses_servicio" | "observaciones">>;

export interface SolicitudCambioPlanificacionRow {
  id: BigintId;
  proyecto_id: BigintId;
  control_cambio_id: BigintId | null;
  solicitante_id: BigintId;
  aprobador_id: BigintId | null;
  campo: "FECHA_INICIO" | "FECHA_TERMINO" | "FECHA_OPERACION_INICIO" | "FECHA_OPERACION_TERMINO";
  valor_anterior: Date;
  valor_propuesto: Date;
  es_excepcion: boolean;
  justificacion: string | null;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  fecha_solicitud: Date;
  fecha_resolucion: Date | null;
}
export type SolicitudCambioPlanificacionInsert = Pick<SolicitudCambioPlanificacionRow, "proyecto_id" | "solicitante_id" | "campo" | "valor_anterior" | "valor_propuesto"> & Partial<Pick<SolicitudCambioPlanificacionRow, "proyecto_id" | "control_cambio_id" | "solicitante_id" | "aprobador_id" | "campo" | "valor_anterior" | "valor_propuesto" | "es_excepcion" | "justificacion" | "estado" | "fecha_solicitud" | "fecha_resolucion">>;

export interface SquadRow {
  id: BigintId;
  nombre: string;
  activo: boolean;
}
export type SquadInsert = Pick<SquadRow, "nombre"> & Partial<Pick<SquadRow, "nombre" | "activo">>;

export interface TipoDocumentoRow {
  id: BigintId;
  codigo: string;
  nombre: string;
  activo: boolean;
}
export type TipoDocumentoInsert = Pick<TipoDocumentoRow, "codigo" | "nombre"> & Partial<Pick<TipoDocumentoRow, "codigo" | "nombre" | "activo">>;

export interface TipoEntregableRow {
  id: BigintId;
  nombre: string;
  descripcion: string | null;
  orden: number | null;
  activo: boolean;
}
export type TipoEntregableInsert = Pick<TipoEntregableRow, "nombre"> & Partial<Pick<TipoEntregableRow, "nombre" | "descripcion" | "orden" | "activo">>;

export interface UnidadMonetariaRow {
  codigo: "USD" | "PEN" | "CLP" | "COP" | "ARS" | "BRL" | "PAB" | "MXN" | "UF";
  clase: "MONEDA" | "UNIDAD_INDEXADA";
}
export type UnidadMonetariaInsert = Pick<UnidadMonetariaRow, "codigo" | "clase"> & Partial<Pick<UnidadMonetariaRow, "codigo" | "clase">>;

export interface UsuarioRow {
  id: BigintId;
  email: string;
  nombre: string;
  password_hash: string | null;
  refresh_token_hash: string | null;
  refresh_expires_at: Date | null;
  recovery_token_hash: string | null;
  recovery_expires_at: Date | null;
  failed_login_count: number;
  locked_until: Date | null;
  session_version: BigintId;
  tipo_usuario: "INTERNO" | "EXTERNO";
  contacto_cliente_id: BigintId | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}
export type UsuarioInsert = Pick<UsuarioRow, "email" | "nombre"> & Partial<Pick<UsuarioRow, "email" | "nombre" | "password_hash" | "refresh_token_hash" | "refresh_expires_at" | "recovery_token_hash" | "recovery_expires_at" | "failed_login_count" | "locked_until" | "session_version" | "tipo_usuario" | "contacto_cliente_id" | "activo" | "created_at" | "updated_at">>;

export interface ValidacionCierreRow {
  id: BigintId;
  proyecto_id: BigintId;
  validador_id: BigintId | null;
  fecha_validacion: Date;
  checklist_ok: boolean | null;
  documentos_ok: boolean | null;
  riesgos_ok: boolean | null;
  lecciones_ok: boolean | null;
  resultado: "PENDIENTE" | "APTO" | "NO_APTO" | "SIN_EVIDENCIA_HISTORICA";
  observaciones: string | null;
}
export type ValidacionCierreInsert = Pick<ValidacionCierreRow, "proyecto_id" | "resultado"> & Partial<Pick<ValidacionCierreRow, "proyecto_id" | "validador_id" | "fecha_validacion" | "checklist_ok" | "documentos_ok" | "riesgos_ok" | "lecciones_ok" | "resultado" | "observaciones">>;

export interface WorkspaceRow {
  id: BigintId;
  nombre: string;
  slug: string;
  creado_por_id: BigintId;
  estado: "ACTIVO" | "ARCHIVADO";
  version: BigintId;
  created_at: Date;
  updated_at: Date;
}
export type WorkspaceInsert = Pick<WorkspaceRow, "nombre" | "slug" | "creado_por_id"> & Partial<Pick<WorkspaceRow, "nombre" | "slug" | "creado_por_id" | "estado" | "version" | "created_at" | "updated_at">>;

export const databaseConstraints = [
  {
    "table_name": "accion_riesgo",
    "name": "accion_riesgo_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "accion_riesgo",
    "name": "accion_riesgo_descripcion_check",
    "kind": "c",
    "definition": "CHECK ((btrim(descripcion) <> ''::text))"
  },
  {
    "table_name": "accion_riesgo",
    "name": "accion_riesgo_descripcion_not_null",
    "kind": "n",
    "definition": "NOT NULL descripcion"
  },
  {
    "table_name": "accion_riesgo",
    "name": "accion_riesgo_estado_not_null",
    "kind": "n",
    "definition": "NOT NULL estado"
  },
  {
    "table_name": "accion_riesgo",
    "name": "accion_riesgo_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "accion_riesgo",
    "name": "accion_riesgo_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "accion_riesgo",
    "name": "accion_riesgo_responsable_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (responsable_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "accion_riesgo",
    "name": "accion_riesgo_riesgo_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (riesgo_proyecto_id) REFERENCES pmo_cusn.riesgo_proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "accion_riesgo",
    "name": "accion_riesgo_riesgo_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL riesgo_proyecto_id"
  },
  {
    "table_name": "ambito_cambio",
    "name": "ambito_cambio_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "ambito_cambio",
    "name": "ambito_cambio_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "ambito_cambio",
    "name": "ambito_cambio_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "ambito_cambio",
    "name": "ambito_cambio_nombre_key",
    "kind": "u",
    "definition": "UNIQUE (nombre)"
  },
  {
    "table_name": "ambito_cambio",
    "name": "ambito_cambio_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "ambito_cambio",
    "name": "ambito_cambio_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "asignacion_rol",
    "name": "asignacion_rol_alcance_lectura_check",
    "kind": "c",
    "definition": "CHECK ((alcance_lectura = ANY (ARRAY['GLOBAL'::text, 'ASIGNADOS'::text])))"
  },
  {
    "table_name": "asignacion_rol",
    "name": "asignacion_rol_alcance_lectura_not_null",
    "kind": "n",
    "definition": "NOT NULL alcance_lectura"
  },
  {
    "table_name": "asignacion_rol",
    "name": "asignacion_rol_asignado_por_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (asignado_por_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "asignacion_rol",
    "name": "asignacion_rol_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "asignacion_rol",
    "name": "asignacion_rol_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "asignacion_rol",
    "name": "asignacion_rol_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "asignacion_rol",
    "name": "asignacion_rol_rol_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (rol_id) REFERENCES pmo_cusn.rol(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "asignacion_rol",
    "name": "asignacion_rol_rol_id_not_null",
    "kind": "n",
    "definition": "NOT NULL rol_id"
  },
  {
    "table_name": "asignacion_rol",
    "name": "asignacion_rol_usuario_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (usuario_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "asignacion_rol",
    "name": "asignacion_rol_usuario_id_not_null",
    "kind": "n",
    "definition": "NOT NULL usuario_id"
  },
  {
    "table_name": "asignacion_rol",
    "name": "ck_asignacion_revocacion",
    "kind": "c",
    "definition": "CHECK (((revocado_at IS NULL) OR (revocado_at >= created_at)))"
  },
  {
    "table_name": "asignacion_rol",
    "name": "ctr_pm_titular_rol",
    "kind": "t",
    "definition": "TRIGGER DEFERRABLE INITIALLY DEFERRED"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_actor_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (actor_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_delegacion_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (delegacion_id) REFERENCES pmo_cusn.delegacion_acceso(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_detalle_not_null",
    "kind": "n",
    "definition": "NOT NULL detalle"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_fecha_evento_not_null",
    "kind": "n",
    "definition": "NOT NULL fecha_evento"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_operacion_check",
    "kind": "c",
    "definition": "CHECK ((btrim(operacion) <> ''::text))"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_operacion_not_null",
    "kind": "n",
    "definition": "NOT NULL operacion"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_recurso_tipo_check",
    "kind": "c",
    "definition": "CHECK ((btrim(recurso_tipo) <> ''::text))"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_recurso_tipo_not_null",
    "kind": "n",
    "definition": "NOT NULL recurso_tipo"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_resultado_check",
    "kind": "c",
    "definition": "CHECK ((resultado = ANY (ARRAY['PERMITIDO'::text, 'DENEGADO'::text, 'ERROR'::text])))"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_resultado_not_null",
    "kind": "n",
    "definition": "NOT NULL resultado"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_workspace_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (workspace_id) REFERENCES pmo_cusn.workspace(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "cambio_ambito",
    "name": "cambio_ambito_ambito_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (ambito_id) REFERENCES pmo_cusn.ambito_cambio(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "cambio_ambito",
    "name": "cambio_ambito_ambito_id_not_null",
    "kind": "n",
    "definition": "NOT NULL ambito_id"
  },
  {
    "table_name": "cambio_ambito",
    "name": "cambio_ambito_control_cambio_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (control_cambio_id) REFERENCES pmo_cusn.control_cambio(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "cambio_ambito",
    "name": "cambio_ambito_control_cambio_id_not_null",
    "kind": "n",
    "definition": "NOT NULL control_cambio_id"
  },
  {
    "table_name": "cambio_ambito",
    "name": "cambio_ambito_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (control_cambio_id, ambito_id)"
  },
  {
    "table_name": "cliente",
    "name": "cliente_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "cliente",
    "name": "cliente_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "cliente",
    "name": "cliente_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "cliente",
    "name": "cliente_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "cliente",
    "name": "cliente_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "cliente",
    "name": "cliente_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "cliente",
    "name": "cliente_updated_at_not_null",
    "kind": "n",
    "definition": "NOT NULL updated_at"
  },
  {
    "table_name": "compra",
    "name": "compra_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "compra",
    "name": "compra_gestor_compra_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (gestor_compra_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "compra",
    "name": "compra_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "compra",
    "name": "compra_meses_recurrentes_check",
    "kind": "c",
    "definition": "CHECK (((meses_recurrentes IS NULL) OR (meses_recurrentes >= 0)))"
  },
  {
    "table_name": "compra",
    "name": "compra_monto_adjudicado_check",
    "kind": "c",
    "definition": "CHECK (((monto_adjudicado IS NULL) OR (monto_adjudicado >= (0)::numeric)))"
  },
  {
    "table_name": "compra",
    "name": "compra_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "compra",
    "name": "compra_proveedor_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proveedor_id) REFERENCES pmo_cusn.proveedor(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "compra",
    "name": "compra_proveedor_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proveedor_id"
  },
  {
    "table_name": "compra",
    "name": "compra_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "compra",
    "name": "compra_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "compra",
    "name": "compra_tipo_gasto_check",
    "kind": "c",
    "definition": "CHECK ((tipo_gasto = ANY (ARRAY['CAPEX'::text, 'OPEX'::text])))"
  },
  {
    "table_name": "compra",
    "name": "compra_unidad_codigo_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (unidad_codigo) REFERENCES pmo_cusn.unidad_monetaria(codigo) ON DELETE RESTRICT"
  },
  {
    "table_name": "compra",
    "name": "compra_valor_recurrente_check",
    "kind": "c",
    "definition": "CHECK (((valor_recurrente IS NULL) OR (valor_recurrente >= (0)::numeric)))"
  },
  {
    "table_name": "compra",
    "name": "compra_valor_setup_check",
    "kind": "c",
    "definition": "CHECK (((valor_setup IS NULL) OR (valor_setup >= (0)::numeric)))"
  },
  {
    "table_name": "compromiso",
    "name": "ck_compromiso_alcance",
    "kind": "c",
    "definition": "CHECK ((((alcance = 'GLOBAL'::text) AND (proyecto_id IS NULL) AND (pais_id IS NULL)) OR ((alcance = 'PAIS'::text) AND (pais_id IS NOT NULL) AND (proyecto_id IS NULL)) OR ((alcance = 'PROYECTO'::text) AND (proyecto_id IS NOT NULL) AND (pais_id IS NULL))))"
  },
  {
    "table_name": "compromiso",
    "name": "ck_compromiso_fechas",
    "kind": "c",
    "definition": "CHECK (((fecha_compromiso IS NULL) OR (fecha_limite IS NULL) OR (fecha_limite >= fecha_compromiso)))"
  },
  {
    "table_name": "compromiso",
    "name": "ck_compromiso_responsable",
    "kind": "c",
    "definition": "CHECK (((responsable_id IS NOT NULL) OR ((responsable_texto IS NOT NULL) AND (btrim(responsable_texto) <> ''::text))))"
  },
  {
    "table_name": "compromiso",
    "name": "compromiso_alcance_check",
    "kind": "c",
    "definition": "CHECK ((alcance = ANY (ARRAY['GLOBAL'::text, 'PAIS'::text, 'PROYECTO'::text])))"
  },
  {
    "table_name": "compromiso",
    "name": "compromiso_alcance_not_null",
    "kind": "n",
    "definition": "NOT NULL alcance"
  },
  {
    "table_name": "compromiso",
    "name": "compromiso_completado_not_null",
    "kind": "n",
    "definition": "NOT NULL completado"
  },
  {
    "table_name": "compromiso",
    "name": "compromiso_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "compromiso",
    "name": "compromiso_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "compromiso",
    "name": "compromiso_pais_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (pais_id) REFERENCES pmo_cusn.pais(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "compromiso",
    "name": "compromiso_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "compromiso",
    "name": "compromiso_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "compromiso",
    "name": "compromiso_responsable_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (responsable_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "compromiso",
    "name": "compromiso_titulo_check",
    "kind": "c",
    "definition": "CHECK ((btrim(titulo) <> ''::text))"
  },
  {
    "table_name": "compromiso",
    "name": "compromiso_titulo_not_null",
    "kind": "n",
    "definition": "NOT NULL titulo"
  },
  {
    "table_name": "condicion_comercial",
    "name": "ck_condicion_tcv",
    "kind": "c",
    "definition": "CHECK ((((tcv_tipo = 'ILIMITADO'::text) AND (tcv_valor IS NULL)) OR ((tcv_tipo = 'DEFINIDO'::text) AND (tcv_valor IS NOT NULL) AND (tcv_valor >= (0)::numeric) AND (unidad_codigo IS NOT NULL))))"
  },
  {
    "table_name": "condicion_comercial",
    "name": "condicion_comercial_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "condicion_comercial",
    "name": "condicion_comercial_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "condicion_comercial",
    "name": "condicion_comercial_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "condicion_comercial",
    "name": "condicion_comercial_proyecto_id_key",
    "kind": "u",
    "definition": "UNIQUE (proyecto_id)"
  },
  {
    "table_name": "condicion_comercial",
    "name": "condicion_comercial_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "condicion_comercial",
    "name": "condicion_comercial_tcv_tipo_check",
    "kind": "c",
    "definition": "CHECK ((tcv_tipo = ANY (ARRAY['DEFINIDO'::text, 'ILIMITADO'::text])))"
  },
  {
    "table_name": "condicion_comercial",
    "name": "condicion_comercial_tcv_tipo_not_null",
    "kind": "n",
    "definition": "NOT NULL tcv_tipo"
  },
  {
    "table_name": "condicion_comercial",
    "name": "condicion_comercial_unidad_codigo_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (unidad_codigo) REFERENCES pmo_cusn.unidad_monetaria(codigo) ON DELETE RESTRICT"
  },
  {
    "table_name": "condicion_comercial",
    "name": "condicion_comercial_updated_at_not_null",
    "kind": "n",
    "definition": "NOT NULL updated_at"
  },
  {
    "table_name": "contacto_cliente",
    "name": "contacto_cliente_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "contacto_cliente",
    "name": "contacto_cliente_cliente_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (cliente_id) REFERENCES pmo_cusn.cliente(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "contacto_cliente",
    "name": "contacto_cliente_cliente_id_not_null",
    "kind": "n",
    "definition": "NOT NULL cliente_id"
  },
  {
    "table_name": "contacto_cliente",
    "name": "contacto_cliente_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "contacto_cliente",
    "name": "contacto_cliente_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "contacto_cliente",
    "name": "contacto_cliente_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "contacto_cliente",
    "name": "contacto_cliente_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "contacto_cliente",
    "name": "uq_contacto_cliente_id_cliente",
    "kind": "u",
    "definition": "UNIQUE (id, cliente_id)"
  },
  {
    "table_name": "control_cambio",
    "name": "ck_cc_moneda",
    "kind": "c",
    "definition": "CHECK (((impacto_monetario IS NULL) OR (unidad_codigo IS NOT NULL)))"
  },
  {
    "table_name": "control_cambio",
    "name": "ck_cc_responsables",
    "kind": "c",
    "definition": "CHECK (((responsabilidad IS NULL) OR ((responsabilidad = 'CLIENTE'::text) AND (responsable_cliente_id IS NOT NULL)) OR ((responsabilidad = 'TIVIT'::text) AND (responsable_interno_id IS NOT NULL)) OR ((responsabilidad = 'AMBOS'::text) AND (responsable_cliente_id IS NOT NULL) AND (responsable_interno_id IS NOT NULL))))"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_account_responsable_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (account_responsable_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_descripcion_check",
    "kind": "c",
    "definition": "CHECK ((btrim(descripcion) <> ''::text))"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_descripcion_not_null",
    "kind": "n",
    "definition": "NOT NULL descripcion"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_estado_aprobacion_check",
    "kind": "c",
    "definition": "CHECK ((estado_aprobacion = ANY (ARRAY['PENDIENTE'::text, 'APROBADO'::text, 'RECHAZADO'::text])))"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_estado_firma_check",
    "kind": "c",
    "definition": "CHECK ((estado_firma = ANY (ARRAY['PENDIENTE'::text, 'NOTIFICADO'::text, 'FIRMADO'::text])))"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_estado_firma_not_null",
    "kind": "n",
    "definition": "NOT NULL estado_firma"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_fecha_elaboracion_not_null",
    "kind": "n",
    "definition": "NOT NULL fecha_elaboracion"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_folio_check",
    "kind": "c",
    "definition": "CHECK ((btrim(folio) <> ''::text))"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_folio_not_null",
    "kind": "n",
    "definition": "NOT NULL folio"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_responsabilidad_check",
    "kind": "c",
    "definition": "CHECK ((responsabilidad = ANY (ARRAY['CLIENTE'::text, 'TIVIT'::text, 'AMBOS'::text])))"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_responsable_cliente_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (responsable_cliente_id) REFERENCES pmo_cusn.contacto_cliente(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_responsable_interno_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (responsable_interno_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_secuencia_check",
    "kind": "c",
    "definition": "CHECK ((secuencia > 0))"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_secuencia_not_null",
    "kind": "n",
    "definition": "NOT NULL secuencia"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_tipo_impacto_check",
    "kind": "c",
    "definition": "CHECK ((tipo_impacto = ANY (ARRAY['COSTO_TIVIT'::text, 'BENEFICIO'::text])))"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_unidad_codigo_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (unidad_codigo) REFERENCES pmo_cusn.unidad_monetaria(codigo) ON DELETE RESTRICT"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_urgencia_check",
    "kind": "c",
    "definition": "CHECK ((urgencia = ANY (ARRAY['ALTA'::text, 'MEDIA'::text, 'BAJA'::text])))"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_urgencia_not_null",
    "kind": "n",
    "definition": "NOT NULL urgencia"
  },
  {
    "table_name": "control_cambio",
    "name": "uq_cc_id_proyecto",
    "kind": "u",
    "definition": "UNIQUE (id, proyecto_id)"
  },
  {
    "table_name": "control_cambio",
    "name": "uq_cc_proyecto_folio",
    "kind": "u",
    "definition": "UNIQUE (proyecto_id, folio)"
  },
  {
    "table_name": "control_cambio",
    "name": "uq_cc_proyecto_secuencia",
    "kind": "u",
    "definition": "UNIQUE (proyecto_id, secuencia)"
  },
  {
    "table_name": "control_cambio_documento",
    "name": "control_cambio_documento_control_cambio_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (control_cambio_id) REFERENCES pmo_cusn.control_cambio(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "control_cambio_documento",
    "name": "control_cambio_documento_control_cambio_id_not_null",
    "kind": "n",
    "definition": "NOT NULL control_cambio_id"
  },
  {
    "table_name": "control_cambio_documento",
    "name": "control_cambio_documento_documento_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (documento_id) REFERENCES pmo_cusn.documento(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "control_cambio_documento",
    "name": "control_cambio_documento_documento_id_not_null",
    "kind": "n",
    "definition": "NOT NULL documento_id"
  },
  {
    "table_name": "control_cambio_documento",
    "name": "control_cambio_documento_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (control_cambio_id, documento_id)"
  },
  {
    "table_name": "control_cambio_documento",
    "name": "control_cambio_documento_vinculado_at_not_null",
    "kind": "n",
    "definition": "NOT NULL vinculado_at"
  },
  {
    "table_name": "control_riesgo",
    "name": "control_riesgo_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "control_riesgo",
    "name": "control_riesgo_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "control_riesgo",
    "name": "control_riesgo_descripcion_check",
    "kind": "c",
    "definition": "CHECK ((btrim(descripcion) <> ''::text))"
  },
  {
    "table_name": "control_riesgo",
    "name": "control_riesgo_descripcion_not_null",
    "kind": "n",
    "definition": "NOT NULL descripcion"
  },
  {
    "table_name": "control_riesgo",
    "name": "control_riesgo_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "control_riesgo",
    "name": "control_riesgo_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "control_riesgo",
    "name": "control_riesgo_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "control_riesgo",
    "name": "control_riesgo_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "control_riesgo",
    "name": "control_riesgo_responsable_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (responsable_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "control_riesgo",
    "name": "control_riesgo_tipo_control_check",
    "kind": "c",
    "definition": "CHECK ((tipo_control = ANY (ARRAY['PREVENTIVO'::text, 'DETECTIVO'::text, 'CORRECTIVO'::text])))"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "ck_delegacion_distintos",
    "kind": "c",
    "definition": "CHECK ((delegante_id <> delegado_id))"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "ck_delegacion_revocacion",
    "kind": "c",
    "definition": "CHECK ((((estado = 'REVOCADA'::text) AND (revocado_at IS NOT NULL) AND (revocado_por_id IS NOT NULL)) OR ((estado <> 'REVOCADA'::text) AND (revocado_at IS NULL) AND (revocado_por_id IS NULL))))"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "ck_delegacion_vigencia",
    "kind": "c",
    "definition": "CHECK ((fin > inicio))"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_alcance_check",
    "kind": "c",
    "definition": "CHECK ((alcance = 'PROYECTO'::text))"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_alcance_not_null",
    "kind": "n",
    "definition": "NOT NULL alcance"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_autorizado_por_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (autorizado_por_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_delegado_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (delegado_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_delegado_id_not_null",
    "kind": "n",
    "definition": "NOT NULL delegado_id"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_delegante_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (delegante_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_delegante_id_not_null",
    "kind": "n",
    "definition": "NOT NULL delegante_id"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_estado_check",
    "kind": "c",
    "definition": "CHECK ((estado = ANY (ARRAY['PENDIENTE'::text, 'ACTIVA'::text, 'REVOCADA'::text, 'RECHAZADA'::text])))"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_estado_not_null",
    "kind": "n",
    "definition": "NOT NULL estado"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_fin_not_null",
    "kind": "n",
    "definition": "NOT NULL fin"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_inicio_not_null",
    "kind": "n",
    "definition": "NOT NULL inicio"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_motivo_check",
    "kind": "c",
    "definition": "CHECK ((btrim(motivo) <> ''::text))"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_motivo_not_null",
    "kind": "n",
    "definition": "NOT NULL motivo"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_revocado_por_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (revocado_por_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_tipo_check",
    "kind": "c",
    "definition": "CHECK ((tipo = 'SUPLENCIA_PM'::text))"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_tipo_not_null",
    "kind": "n",
    "definition": "NOT NULL tipo"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "ex_suplencia_pm_no_superpuesta",
    "kind": "x",
    "definition": "EXCLUDE USING gist (proyecto_id WITH =, tstzrange(inicio, fin, '[)'::text) WITH &&) WHERE (((tipo = 'SUPLENCIA_PM'::text) AND (estado = ANY (ARRAY['PENDIENTE'::text, 'ACTIVA'::text]))))"
  },
  {
    "table_name": "delegacion_permiso",
    "name": "delegacion_permiso_delegacion_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (delegacion_id) REFERENCES pmo_cusn.delegacion_acceso(id) ON DELETE CASCADE"
  },
  {
    "table_name": "delegacion_permiso",
    "name": "delegacion_permiso_delegacion_id_not_null",
    "kind": "n",
    "definition": "NOT NULL delegacion_id"
  },
  {
    "table_name": "delegacion_permiso",
    "name": "delegacion_permiso_permiso_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (permiso_id) REFERENCES pmo_cusn.permiso(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "delegacion_permiso",
    "name": "delegacion_permiso_permiso_id_not_null",
    "kind": "n",
    "definition": "NOT NULL permiso_id"
  },
  {
    "table_name": "delegacion_permiso",
    "name": "delegacion_permiso_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (delegacion_id, permiso_id)"
  },
  {
    "table_name": "documento",
    "name": "documento_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "documento",
    "name": "documento_created_by_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (created_by) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "documento",
    "name": "documento_drive_file_id_check",
    "kind": "c",
    "definition": "CHECK ((btrim(drive_file_id) <> ''::text))"
  },
  {
    "table_name": "documento",
    "name": "documento_drive_file_id_key",
    "kind": "u",
    "definition": "UNIQUE (drive_file_id)"
  },
  {
    "table_name": "documento",
    "name": "documento_drive_file_id_not_null",
    "kind": "n",
    "definition": "NOT NULL drive_file_id"
  },
  {
    "table_name": "documento",
    "name": "documento_drive_version_check",
    "kind": "c",
    "definition": "CHECK (((drive_version IS NULL) OR (drive_version > 0)))"
  },
  {
    "table_name": "documento",
    "name": "documento_estado_registro_check",
    "kind": "c",
    "definition": "CHECK ((estado_registro = ANY (ARRAY['VIGENTE'::text, 'ARCHIVADO'::text])))"
  },
  {
    "table_name": "documento",
    "name": "documento_estado_registro_not_null",
    "kind": "n",
    "definition": "NOT NULL estado_registro"
  },
  {
    "table_name": "documento",
    "name": "documento_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "documento",
    "name": "documento_mime_type_not_null",
    "kind": "n",
    "definition": "NOT NULL mime_type"
  },
  {
    "table_name": "documento",
    "name": "documento_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "documento",
    "name": "documento_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "documento",
    "name": "documento_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "documento",
    "name": "documento_tipo_documento_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (tipo_documento_id) REFERENCES pmo_cusn.tipo_documento(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "etapa_compra",
    "name": "etapa_compra_compra_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (compra_id) REFERENCES pmo_cusn.compra(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "etapa_compra",
    "name": "etapa_compra_compra_id_not_null",
    "kind": "n",
    "definition": "NOT NULL compra_id"
  },
  {
    "table_name": "etapa_compra",
    "name": "etapa_compra_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "etapa_compra",
    "name": "etapa_compra_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "etapa_compra",
    "name": "etapa_compra_tipo_etapa_check",
    "kind": "c",
    "definition": "CHECK ((tipo_etapa = ANY (ARRAY['BORP'::text, 'SOLPED'::text, 'OC'::text, 'CONFORMIDAD'::text])))"
  },
  {
    "table_name": "etapa_compra",
    "name": "etapa_compra_tipo_etapa_not_null",
    "kind": "n",
    "definition": "NOT NULL tipo_etapa"
  },
  {
    "table_name": "etapa_compra",
    "name": "uq_compra_tipo_etapa",
    "kind": "u",
    "definition": "UNIQUE (compra_id, tipo_etapa)"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "ck_complejidad_override",
    "kind": "c",
    "definition": "CHECK (((NOT override_estrategico) OR ((tipificacion = 'ESTRATEGICO'::text) AND (motivo_override IS NOT NULL) AND (btrim(motivo_override) <> ''::text))))"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "ck_complejidad_v1_formula",
    "kind": "c",
    "definition": "CHECK (((version_modelo <> 'V1'::text) OR (indice_complejidad = round((((((riesgo)::numeric * 0.35) + ((facturacion)::numeric * 0.20)) + ((plazo)::numeric * 0.15)) + ((alcance)::numeric * 0.30)), 1))))"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_alcance_check",
    "kind": "c",
    "definition": "CHECK (((alcance >= 1) AND (alcance <= 5)))"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_alcance_not_null",
    "kind": "n",
    "definition": "NOT NULL alcance"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_evaluador_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (evaluador_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_facturacion_check",
    "kind": "c",
    "definition": "CHECK (((facturacion >= 1) AND (facturacion <= 5)))"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_facturacion_not_null",
    "kind": "n",
    "definition": "NOT NULL facturacion"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_fecha_evaluacion_not_null",
    "kind": "n",
    "definition": "NOT NULL fecha_evaluacion"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_indice_complejidad_check",
    "kind": "c",
    "definition": "CHECK (((indice_complejidad >= (1)::numeric) AND (indice_complejidad <= (5)::numeric)))"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_indice_complejidad_not_null",
    "kind": "n",
    "definition": "NOT NULL indice_complejidad"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_override_estrategico_not_null",
    "kind": "n",
    "definition": "NOT NULL override_estrategico"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_plazo_check",
    "kind": "c",
    "definition": "CHECK (((plazo >= 1) AND (plazo <= 5)))"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_plazo_not_null",
    "kind": "n",
    "definition": "NOT NULL plazo"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_riesgo_check",
    "kind": "c",
    "definition": "CHECK (((riesgo >= 1) AND (riesgo <= 5)))"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_riesgo_not_null",
    "kind": "n",
    "definition": "NOT NULL riesgo"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_tipificacion_check",
    "kind": "c",
    "definition": "CHECK ((tipificacion = ANY (ARRAY['BAJO'::text, 'MEDIO'::text, 'ALTO'::text, 'ESTRATEGICO'::text])))"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_tipificacion_not_null",
    "kind": "n",
    "definition": "NOT NULL tipificacion"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_version_modelo_not_null",
    "kind": "n",
    "definition": "NOT NULL version_modelo"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "evaluacion_riesgo_evaluador_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (evaluador_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "evaluacion_riesgo_fecha_evaluacion_not_null",
    "kind": "n",
    "definition": "NOT NULL fecha_evaluacion"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "evaluacion_riesgo_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "evaluacion_riesgo_impacto_check",
    "kind": "c",
    "definition": "CHECK (((impacto >= 1) AND (impacto <= 4)))"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "evaluacion_riesgo_impacto_not_null",
    "kind": "n",
    "definition": "NOT NULL impacto"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "evaluacion_riesgo_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "evaluacion_riesgo_probabilidad_check",
    "kind": "c",
    "definition": "CHECK (((probabilidad >= 1) AND (probabilidad <= 4)))"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "evaluacion_riesgo_probabilidad_not_null",
    "kind": "n",
    "definition": "NOT NULL probabilidad"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "evaluacion_riesgo_riesgo_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (riesgo_proyecto_id) REFERENCES pmo_cusn.riesgo_proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "evaluacion_riesgo_riesgo_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL riesgo_proyecto_id"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "evaluacion_riesgo_tipo_evaluacion_check",
    "kind": "c",
    "definition": "CHECK ((tipo_evaluacion = ANY (ARRAY['INICIAL'::text, 'RESIDUAL'::text, 'REVISION'::text])))"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "evaluacion_riesgo_tipo_evaluacion_not_null",
    "kind": "n",
    "definition": "NOT NULL tipo_evaluacion"
  },
  {
    "table_name": "evento_proyecto",
    "name": "evento_proyecto_actor_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (actor_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "evento_proyecto",
    "name": "evento_proyecto_detalle_not_null",
    "kind": "n",
    "definition": "NOT NULL detalle"
  },
  {
    "table_name": "evento_proyecto",
    "name": "evento_proyecto_fecha_evento_not_null",
    "kind": "n",
    "definition": "NOT NULL fecha_evento"
  },
  {
    "table_name": "evento_proyecto",
    "name": "evento_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "evento_proyecto",
    "name": "evento_proyecto_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "evento_proyecto",
    "name": "evento_proyecto_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "evento_proyecto",
    "name": "evento_proyecto_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "evento_proyecto",
    "name": "evento_proyecto_tipo_evento_check",
    "kind": "c",
    "definition": "CHECK ((btrim(tipo_evento) <> ''::text))"
  },
  {
    "table_name": "evento_proyecto",
    "name": "evento_proyecto_tipo_evento_not_null",
    "kind": "n",
    "definition": "NOT NULL tipo_evento"
  },
  {
    "table_name": "hito_facturacion",
    "name": "ck_facturacion_mes",
    "kind": "c",
    "definition": "CHECK ((periodo = (date_trunc('month'::text, (periodo)::timestamp without time zone))::date))"
  },
  {
    "table_name": "hito_facturacion",
    "name": "hito_facturacion_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "hito_facturacion",
    "name": "hito_facturacion_periodo_not_null",
    "kind": "n",
    "definition": "NOT NULL periodo"
  },
  {
    "table_name": "hito_facturacion",
    "name": "hito_facturacion_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "hito_facturacion",
    "name": "hito_facturacion_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "hito_facturacion",
    "name": "hito_facturacion_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "hito_facturacion",
    "name": "hito_facturacion_unidad_codigo_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (unidad_codigo) REFERENCES pmo_cusn.unidad_monetaria(codigo) ON DELETE RESTRICT"
  },
  {
    "table_name": "hito_facturacion",
    "name": "hito_facturacion_updated_at_not_null",
    "kind": "n",
    "definition": "NOT NULL updated_at"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "ck_invitacion_workspace_estado",
    "kind": "c",
    "definition": "CHECK ((((estado = 'ACEPTADA'::text) AND (accepted_at IS NOT NULL)) OR ((estado <> 'ACEPTADA'::text) AND (accepted_at IS NULL))))"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "ck_invitacion_workspace_tiempo",
    "kind": "c",
    "definition": "CHECK ((expires_at > created_at))"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_email_destinatario_check",
    "kind": "c",
    "definition": "CHECK ((POSITION(('@'::text) IN (email_destinatario)) > 1))"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_email_destinatario_not_null",
    "kind": "n",
    "definition": "NOT NULL email_destinatario"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_estado_check",
    "kind": "c",
    "definition": "CHECK ((estado = ANY (ARRAY['PENDIENTE'::text, 'ACEPTADA'::text, 'REVOCADA'::text, 'EXPIRADA'::text])))"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_estado_not_null",
    "kind": "n",
    "definition": "NOT NULL estado"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_expires_at_not_null",
    "kind": "n",
    "definition": "NOT NULL expires_at"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_invitado_por_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (invitado_por_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_invitado_por_id_not_null",
    "kind": "n",
    "definition": "NOT NULL invitado_por_id"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_puede_crear_proyectos_not_null",
    "kind": "n",
    "definition": "NOT NULL puede_crear_proyectos"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_rol_solicitado_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (rol_solicitado_id) REFERENCES pmo_cusn.rol(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_token_hash_check",
    "kind": "c",
    "definition": "CHECK ((btrim(token_hash) <> ''::text))"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_token_hash_key",
    "kind": "u",
    "definition": "UNIQUE (token_hash)"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_token_hash_not_null",
    "kind": "n",
    "definition": "NOT NULL token_hash"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_workspace_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (workspace_id) REFERENCES pmo_cusn.workspace(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_workspace_id_not_null",
    "kind": "n",
    "definition": "NOT NULL workspace_id"
  },
  {
    "table_name": "item_checklist_documento",
    "name": "item_checklist_documento_documento_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (documento_id) REFERENCES pmo_cusn.documento(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "item_checklist_documento",
    "name": "item_checklist_documento_documento_id_not_null",
    "kind": "n",
    "definition": "NOT NULL documento_id"
  },
  {
    "table_name": "item_checklist_documento",
    "name": "item_checklist_documento_item_checklist_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (item_checklist_id) REFERENCES pmo_cusn.item_checklist_proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "item_checklist_documento",
    "name": "item_checklist_documento_item_checklist_id_not_null",
    "kind": "n",
    "definition": "NOT NULL item_checklist_id"
  },
  {
    "table_name": "item_checklist_documento",
    "name": "item_checklist_documento_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (item_checklist_id, documento_id)"
  },
  {
    "table_name": "item_checklist_documento",
    "name": "item_checklist_documento_vinculado_at_not_null",
    "kind": "n",
    "definition": "NOT NULL vinculado_at"
  },
  {
    "table_name": "item_checklist_documento",
    "name": "item_checklist_documento_vinculado_por_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (vinculado_por) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "item_checklist_proyecto_completado_not_null",
    "kind": "n",
    "definition": "NOT NULL completado"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "item_checklist_proyecto_completado_por_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (completado_por) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "item_checklist_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "item_checklist_proyecto_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "item_checklist_proyecto_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "item_checklist_proyecto_obligatorio_not_null",
    "kind": "n",
    "definition": "NOT NULL obligatorio"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "item_checklist_proyecto_orden_check",
    "kind": "c",
    "definition": "CHECK (((orden IS NULL) OR (orden >= 0)))"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "item_checklist_proyecto_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "item_checklist_proyecto_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "item_checklist_proyecto_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "item_checklist_proyecto_requiere_documento_not_null",
    "kind": "n",
    "definition": "NOT NULL requiere_documento"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "item_checklist_proyecto_tipo_entregable_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (tipo_entregable_id) REFERENCES pmo_cusn.tipo_entregable(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "leccion_aprendida",
    "name": "leccion_aprendida_autor_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (autor_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "leccion_aprendida",
    "name": "leccion_aprendida_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "leccion_aprendida",
    "name": "leccion_aprendida_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "leccion_aprendida",
    "name": "leccion_aprendida_leccion_check",
    "kind": "c",
    "definition": "CHECK ((btrim(leccion) <> ''::text))"
  },
  {
    "table_name": "leccion_aprendida",
    "name": "leccion_aprendida_leccion_not_null",
    "kind": "n",
    "definition": "NOT NULL leccion"
  },
  {
    "table_name": "leccion_aprendida",
    "name": "leccion_aprendida_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "leccion_aprendida",
    "name": "leccion_aprendida_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "leccion_aprendida",
    "name": "leccion_aprendida_titulo_check",
    "kind": "c",
    "definition": "CHECK ((btrim(titulo) <> ''::text))"
  },
  {
    "table_name": "leccion_aprendida",
    "name": "leccion_aprendida_titulo_not_null",
    "kind": "n",
    "definition": "NOT NULL titulo"
  },
  {
    "table_name": "leccion_aprendida",
    "name": "leccion_aprendida_updated_at_not_null",
    "kind": "n",
    "definition": "NOT NULL updated_at"
  },
  {
    "table_name": "leccion_documento",
    "name": "leccion_documento_documento_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (documento_id) REFERENCES pmo_cusn.documento(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "leccion_documento",
    "name": "leccion_documento_documento_id_not_null",
    "kind": "n",
    "definition": "NOT NULL documento_id"
  },
  {
    "table_name": "leccion_documento",
    "name": "leccion_documento_leccion_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (leccion_id) REFERENCES pmo_cusn.leccion_aprendida(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "leccion_documento",
    "name": "leccion_documento_leccion_id_not_null",
    "kind": "n",
    "definition": "NOT NULL leccion_id"
  },
  {
    "table_name": "leccion_documento",
    "name": "leccion_documento_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (leccion_id, documento_id)"
  },
  {
    "table_name": "leccion_documento",
    "name": "leccion_documento_vinculado_at_not_null",
    "kind": "n",
    "definition": "NOT NULL vinculado_at"
  },
  {
    "table_name": "lob",
    "name": "lob_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "lob",
    "name": "lob_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "lob",
    "name": "lob_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "lob",
    "name": "lob_nombre_key",
    "kind": "u",
    "definition": "UNIQUE (nombre)"
  },
  {
    "table_name": "lob",
    "name": "lob_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "lob",
    "name": "lob_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "membresia_workspace",
    "name": "ctr_pm_titular_membresia",
    "kind": "t",
    "definition": "TRIGGER DEFERRABLE INITIALLY DEFERRED"
  },
  {
    "table_name": "membresia_workspace",
    "name": "membresia_workspace_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "membresia_workspace",
    "name": "membresia_workspace_estado_check",
    "kind": "c",
    "definition": "CHECK ((estado = ANY (ARRAY['ACTIVA'::text, 'SUSPENDIDA'::text, 'RETIRADA'::text])))"
  },
  {
    "table_name": "membresia_workspace",
    "name": "membresia_workspace_estado_not_null",
    "kind": "n",
    "definition": "NOT NULL estado"
  },
  {
    "table_name": "membresia_workspace",
    "name": "membresia_workspace_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "membresia_workspace",
    "name": "membresia_workspace_incorporado_por_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (incorporado_por_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "membresia_workspace",
    "name": "membresia_workspace_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "membresia_workspace",
    "name": "membresia_workspace_puede_crear_proyectos_not_null",
    "kind": "n",
    "definition": "NOT NULL puede_crear_proyectos"
  },
  {
    "table_name": "membresia_workspace",
    "name": "membresia_workspace_updated_at_not_null",
    "kind": "n",
    "definition": "NOT NULL updated_at"
  },
  {
    "table_name": "membresia_workspace",
    "name": "membresia_workspace_usuario_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (usuario_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "membresia_workspace",
    "name": "membresia_workspace_usuario_id_not_null",
    "kind": "n",
    "definition": "NOT NULL usuario_id"
  },
  {
    "table_name": "membresia_workspace",
    "name": "membresia_workspace_workspace_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (workspace_id) REFERENCES pmo_cusn.workspace(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "membresia_workspace",
    "name": "membresia_workspace_workspace_id_not_null",
    "kind": "n",
    "definition": "NOT NULL workspace_id"
  },
  {
    "table_name": "membresia_workspace",
    "name": "uq_membresia_workspace_usuario",
    "kind": "u",
    "definition": "UNIQUE (workspace_id, usuario_id)"
  },
  {
    "table_name": "pais",
    "name": "pais_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "pais",
    "name": "pais_codigo_key",
    "kind": "u",
    "definition": "UNIQUE (codigo)"
  },
  {
    "table_name": "pais",
    "name": "pais_codigo_not_null",
    "kind": "n",
    "definition": "NOT NULL codigo"
  },
  {
    "table_name": "pais",
    "name": "pais_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "pais",
    "name": "pais_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "pais",
    "name": "pais_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "pais",
    "name": "pais_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "ck_participacion_fechas",
    "kind": "c",
    "definition": "CHECK (((fecha_fin IS NULL) OR (fecha_fin > fecha_inicio)))"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "ctr_pm_titular_participacion",
    "kind": "t",
    "definition": "TRIGGER DEFERRABLE INITIALLY DEFERRED"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "ex_pm_titular_periodos",
    "kind": "x",
    "definition": "EXCLUDE USING gist (proyecto_id WITH =, tstzrange(fecha_inicio, fecha_fin, '[)'::text) WITH &&) WHERE ((funcion = 'PM_TITULAR'::text))"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "participacion_proyecto_fecha_inicio_not_null",
    "kind": "n",
    "definition": "NOT NULL fecha_inicio"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "participacion_proyecto_funcion_check",
    "kind": "c",
    "definition": "CHECK ((funcion = ANY (ARRAY['PM_TITULAR'::text, 'ESPECIALISTA'::text, 'OBSERVADOR'::text, 'LIDER_TECNICO'::text, 'TAM'::text, 'SDM'::text])))"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "participacion_proyecto_funcion_not_null",
    "kind": "n",
    "definition": "NOT NULL funcion"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "participacion_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "participacion_proyecto_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "participacion_proyecto_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "participacion_proyecto_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "participacion_proyecto_usuario_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (usuario_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "participacion_proyecto_usuario_id_not_null",
    "kind": "n",
    "definition": "NOT NULL usuario_id"
  },
  {
    "table_name": "permiso",
    "name": "permiso_codigo_check",
    "kind": "c",
    "definition": "CHECK ((btrim(codigo) <> ''::text))"
  },
  {
    "table_name": "permiso",
    "name": "permiso_codigo_key",
    "kind": "u",
    "definition": "UNIQUE (codigo)"
  },
  {
    "table_name": "permiso",
    "name": "permiso_codigo_not_null",
    "kind": "n",
    "definition": "NOT NULL codigo"
  },
  {
    "table_name": "permiso",
    "name": "permiso_delegable_not_null",
    "kind": "n",
    "definition": "NOT NULL delegable"
  },
  {
    "table_name": "permiso",
    "name": "permiso_descripcion_not_null",
    "kind": "n",
    "definition": "NOT NULL descripcion"
  },
  {
    "table_name": "permiso",
    "name": "permiso_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "permiso",
    "name": "permiso_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "proveedor",
    "name": "proveedor_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "proveedor",
    "name": "proveedor_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "proveedor",
    "name": "proveedor_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "proveedor",
    "name": "proveedor_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "proveedor",
    "name": "proveedor_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "proveedor",
    "name": "proveedor_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "proveedor",
    "name": "proveedor_updated_at_not_null",
    "kind": "n",
    "definition": "NOT NULL updated_at"
  },
  {
    "table_name": "proyecto",
    "name": "ck_proyecto_estado",
    "kind": "c",
    "definition": "CHECK ((estado_actual = ANY (ARRAY['Requiere P1P2'::text, 'En ejecución'::text, 'En transición'::text, 'Detenido'::text, 'Cancelado'::text, 'Cerrado exitoso'::text, 'Cerrado con observaciones'::text])))"
  },
  {
    "table_name": "proyecto",
    "name": "ck_proyecto_fecha_termino_actual",
    "kind": "c",
    "definition": "CHECK (((fecha_inicio IS NULL) OR (fecha_termino_actual IS NULL) OR (fecha_termino_actual >= fecha_inicio)))"
  },
  {
    "table_name": "proyecto",
    "name": "ck_proyecto_fechas",
    "kind": "c",
    "definition": "CHECK (((fecha_inicio IS NULL) OR (fecha_termino_baseline IS NULL) OR (fecha_termino_baseline >= fecha_inicio)))"
  },
  {
    "table_name": "proyecto",
    "name": "ctr_pm_titular_proyecto",
    "kind": "t",
    "definition": "TRIGGER DEFERRABLE INITIALLY DEFERRED"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_cliente_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (cliente_id) REFERENCES pmo_cusn.cliente(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_cliente_id_not_null",
    "kind": "n",
    "definition": "NOT NULL cliente_id"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_creado_por_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (creado_por_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_creado_por_id_not_null",
    "kind": "n",
    "definition": "NOT NULL creado_por_id"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_drive_folder_id_key",
    "kind": "u",
    "definition": "UNIQUE (drive_folder_id)"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_estado_actual_not_null",
    "kind": "n",
    "definition": "NOT NULL estado_actual"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_lob_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (lob_id) REFERENCES pmo_cusn.lob(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_lob_id_not_null",
    "kind": "n",
    "definition": "NOT NULL lob_id"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_pais_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (pais_id) REFERENCES pmo_cusn.pais(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_pais_id_not_null",
    "kind": "n",
    "definition": "NOT NULL pais_id"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_squad_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (squad_id) REFERENCES pmo_cusn.squad(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_tvt_check",
    "kind": "c",
    "definition": "CHECK ((btrim(tvt) <> ''::text))"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_tvt_normalizado_key",
    "kind": "u",
    "definition": "UNIQUE (tvt_normalizado)"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_tvt_not_null",
    "kind": "n",
    "definition": "NOT NULL tvt"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_updated_at_not_null",
    "kind": "n",
    "definition": "NOT NULL updated_at"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_version_check",
    "kind": "c",
    "definition": "CHECK ((version > 0))"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_version_not_null",
    "kind": "n",
    "definition": "NOT NULL version"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_workspace_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (workspace_id) REFERENCES pmo_cusn.workspace(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_workspace_id_not_null",
    "kind": "n",
    "definition": "NOT NULL workspace_id"
  },
  {
    "table_name": "proyecto",
    "name": "uq_proyecto_id_cliente",
    "kind": "u",
    "definition": "UNIQUE (id, cliente_id)"
  },
  {
    "table_name": "proyecto",
    "name": "uq_proyecto_id_lob",
    "kind": "u",
    "definition": "UNIQUE (id, lob_id)"
  },
  {
    "table_name": "proyecto_contacto",
    "name": "proyecto_contacto_cliente_id_not_null",
    "kind": "n",
    "definition": "NOT NULL cliente_id"
  },
  {
    "table_name": "proyecto_contacto",
    "name": "proyecto_contacto_contacto_id_cliente_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (contacto_id, cliente_id) REFERENCES pmo_cusn.contacto_cliente(id, cliente_id) ON DELETE RESTRICT"
  },
  {
    "table_name": "proyecto_contacto",
    "name": "proyecto_contacto_contacto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL contacto_id"
  },
  {
    "table_name": "proyecto_contacto",
    "name": "proyecto_contacto_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (proyecto_id, contacto_id, rol_contacto)"
  },
  {
    "table_name": "proyecto_contacto",
    "name": "proyecto_contacto_proyecto_id_cliente_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id, cliente_id) REFERENCES pmo_cusn.proyecto(id, cliente_id) ON DELETE CASCADE"
  },
  {
    "table_name": "proyecto_contacto",
    "name": "proyecto_contacto_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "proyecto_contacto",
    "name": "proyecto_contacto_rol_contacto_check",
    "kind": "c",
    "definition": "CHECK ((btrim(rol_contacto) <> ''::text))"
  },
  {
    "table_name": "proyecto_contacto",
    "name": "proyecto_contacto_rol_contacto_not_null",
    "kind": "n",
    "definition": "NOT NULL rol_contacto"
  },
  {
    "table_name": "proyecto_documento",
    "name": "proyecto_documento_documento_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (documento_id) REFERENCES pmo_cusn.documento(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "proyecto_documento",
    "name": "proyecto_documento_documento_id_not_null",
    "kind": "n",
    "definition": "NOT NULL documento_id"
  },
  {
    "table_name": "proyecto_documento",
    "name": "proyecto_documento_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (proyecto_id, documento_id)"
  },
  {
    "table_name": "proyecto_documento",
    "name": "proyecto_documento_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "proyecto_documento",
    "name": "proyecto_documento_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "proyecto_documento",
    "name": "proyecto_documento_vinculado_at_not_null",
    "kind": "n",
    "definition": "NOT NULL vinculado_at"
  },
  {
    "table_name": "proyecto_documento",
    "name": "proyecto_documento_vinculado_por_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (vinculado_por) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "proyecto_servicio_lob",
    "name": "proyecto_servicio_lob_lob_id_not_null",
    "kind": "n",
    "definition": "NOT NULL lob_id"
  },
  {
    "table_name": "proyecto_servicio_lob",
    "name": "proyecto_servicio_lob_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (proyecto_id, servicio_lob_id)"
  },
  {
    "table_name": "proyecto_servicio_lob",
    "name": "proyecto_servicio_lob_proyecto_id_lob_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id, lob_id) REFERENCES pmo_cusn.proyecto(id, lob_id) ON DELETE CASCADE"
  },
  {
    "table_name": "proyecto_servicio_lob",
    "name": "proyecto_servicio_lob_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "proyecto_servicio_lob",
    "name": "proyecto_servicio_lob_servicio_lob_id_lob_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (servicio_lob_id, lob_id) REFERENCES pmo_cusn.servicio_lob(id, lob_id) ON DELETE RESTRICT"
  },
  {
    "table_name": "proyecto_servicio_lob",
    "name": "proyecto_servicio_lob_servicio_lob_id_not_null",
    "kind": "n",
    "definition": "NOT NULL servicio_lob_id"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_asunto_not_null",
    "kind": "n",
    "definition": "NOT NULL asunto"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_canal_check",
    "kind": "c",
    "definition": "CHECK ((canal = ANY (ARRAY['EMAIL'::text, 'APLICACION'::text])))"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_canal_not_null",
    "kind": "n",
    "definition": "NOT NULL canal"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_creado_at_not_null",
    "kind": "n",
    "definition": "NOT NULL creado_at"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_destinatario_email_check",
    "kind": "c",
    "definition": "CHECK ((POSITION(('@'::text) IN (destinatario_email)) > 1))"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_destinatario_email_not_null",
    "kind": "n",
    "definition": "NOT NULL destinatario_email"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_estado_envio_check",
    "kind": "c",
    "definition": "CHECK ((estado_envio = ANY (ARRAY['PENDIENTE'::text, 'ENVIADA'::text, 'ERROR'::text, 'CANCELADA'::text])))"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_estado_envio_not_null",
    "kind": "n",
    "definition": "NOT NULL estado_envio"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_tipo_not_null",
    "kind": "n",
    "definition": "NOT NULL tipo"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_usuario_destinatario_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (usuario_destinatario_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "riesgo_control_riesgo",
    "name": "riesgo_control_riesgo_control_riesgo_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (control_riesgo_id) REFERENCES pmo_cusn.control_riesgo(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "riesgo_control_riesgo",
    "name": "riesgo_control_riesgo_control_riesgo_id_not_null",
    "kind": "n",
    "definition": "NOT NULL control_riesgo_id"
  },
  {
    "table_name": "riesgo_control_riesgo",
    "name": "riesgo_control_riesgo_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (riesgo_proyecto_id, control_riesgo_id)"
  },
  {
    "table_name": "riesgo_control_riesgo",
    "name": "riesgo_control_riesgo_riesgo_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (riesgo_proyecto_id) REFERENCES pmo_cusn.riesgo_proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "riesgo_control_riesgo",
    "name": "riesgo_control_riesgo_riesgo_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL riesgo_proyecto_id"
  },
  {
    "table_name": "riesgo_global",
    "name": "riesgo_global_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "riesgo_global",
    "name": "riesgo_global_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "riesgo_global",
    "name": "riesgo_global_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "riesgo_global",
    "name": "riesgo_global_impacto_sugerido_check",
    "kind": "c",
    "definition": "CHECK (((impacto_sugerido >= 1) AND (impacto_sugerido <= 4)))"
  },
  {
    "table_name": "riesgo_global",
    "name": "riesgo_global_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "riesgo_global",
    "name": "riesgo_global_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "riesgo_global",
    "name": "riesgo_global_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "riesgo_global",
    "name": "riesgo_global_probabilidad_sugerida_check",
    "kind": "c",
    "definition": "CHECK (((probabilidad_sugerida >= 1) AND (probabilidad_sugerida <= 4)))"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_estado_check",
    "kind": "c",
    "definition": "CHECK ((estado = ANY (ARRAY['Pendiente'::text, 'Contingencia'::text, 'Controlado'::text, 'Mitigado'::text])))"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_estado_not_null",
    "kind": "n",
    "definition": "NOT NULL estado"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_estrategia_check",
    "kind": "c",
    "definition": "CHECK ((estrategia = ANY (ARRAY['Mitigar'::text, 'Aceptar'::text, 'Transferir'::text, 'Evitar'::text, 'Reducir'::text])))"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_responsable_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (responsable_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_riesgo_global_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (riesgo_global_id) REFERENCES pmo_cusn.riesgo_global(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_updated_at_not_null",
    "kind": "n",
    "definition": "NOT NULL updated_at"
  },
  {
    "table_name": "rol",
    "name": "ck_rol_codigo",
    "kind": "c",
    "definition": "CHECK (((codigo)::text = ANY ((ARRAY['ADMIN'::character varying, 'PM'::character varying, 'ESPECIALISTA'::character varying, 'VISUALIZADOR'::character varying])::text[])))"
  },
  {
    "table_name": "rol",
    "name": "rol_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "rol",
    "name": "rol_codigo_key",
    "kind": "u",
    "definition": "UNIQUE (codigo)"
  },
  {
    "table_name": "rol",
    "name": "rol_codigo_not_null",
    "kind": "n",
    "definition": "NOT NULL codigo"
  },
  {
    "table_name": "rol",
    "name": "rol_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "rol",
    "name": "rol_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "rol",
    "name": "rol_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "rol_permiso",
    "name": "rol_permiso_permiso_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (permiso_id) REFERENCES pmo_cusn.permiso(id) ON DELETE CASCADE"
  },
  {
    "table_name": "rol_permiso",
    "name": "rol_permiso_permiso_id_not_null",
    "kind": "n",
    "definition": "NOT NULL permiso_id"
  },
  {
    "table_name": "rol_permiso",
    "name": "rol_permiso_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (rol_id, permiso_id)"
  },
  {
    "table_name": "rol_permiso",
    "name": "rol_permiso_rol_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (rol_id) REFERENCES pmo_cusn.rol(id) ON DELETE CASCADE"
  },
  {
    "table_name": "rol_permiso",
    "name": "rol_permiso_rol_id_not_null",
    "kind": "n",
    "definition": "NOT NULL rol_id"
  },
  {
    "table_name": "seguimiento_proyecto",
    "name": "seguimiento_proyecto_avance_planificado_check",
    "kind": "c",
    "definition": "CHECK (((avance_planificado >= (0)::numeric) AND (avance_planificado <= (100)::numeric)))"
  },
  {
    "table_name": "seguimiento_proyecto",
    "name": "seguimiento_proyecto_avance_planificado_not_null",
    "kind": "n",
    "definition": "NOT NULL avance_planificado"
  },
  {
    "table_name": "seguimiento_proyecto",
    "name": "seguimiento_proyecto_avance_real_check",
    "kind": "c",
    "definition": "CHECK (((avance_real >= (0)::numeric) AND (avance_real <= (100)::numeric)))"
  },
  {
    "table_name": "seguimiento_proyecto",
    "name": "seguimiento_proyecto_avance_real_not_null",
    "kind": "n",
    "definition": "NOT NULL avance_real"
  },
  {
    "table_name": "seguimiento_proyecto",
    "name": "seguimiento_proyecto_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "seguimiento_proyecto",
    "name": "seguimiento_proyecto_fecha_registro_not_null",
    "kind": "n",
    "definition": "NOT NULL fecha_registro"
  },
  {
    "table_name": "seguimiento_proyecto",
    "name": "seguimiento_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "seguimiento_proyecto",
    "name": "seguimiento_proyecto_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "seguimiento_proyecto",
    "name": "seguimiento_proyecto_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "seguimiento_proyecto",
    "name": "seguimiento_proyecto_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "seguimiento_proyecto",
    "name": "seguimiento_proyecto_registrado_por_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (registrado_por) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "servicio_lob",
    "name": "servicio_lob_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "servicio_lob",
    "name": "servicio_lob_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "servicio_lob",
    "name": "servicio_lob_lob_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (lob_id) REFERENCES pmo_cusn.lob(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "servicio_lob",
    "name": "servicio_lob_lob_id_not_null",
    "kind": "n",
    "definition": "NOT NULL lob_id"
  },
  {
    "table_name": "servicio_lob",
    "name": "servicio_lob_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "servicio_lob",
    "name": "servicio_lob_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "servicio_lob",
    "name": "servicio_lob_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "servicio_lob",
    "name": "uq_servicio_lob_id_lob",
    "kind": "u",
    "definition": "UNIQUE (id, lob_id)"
  },
  {
    "table_name": "servicio_lob",
    "name": "uq_servicio_lob_nombre",
    "kind": "u",
    "definition": "UNIQUE (lob_id, nombre)"
  },
  {
    "table_name": "servicio_operativo",
    "name": "ck_servicio_operativo_fechas",
    "kind": "c",
    "definition": "CHECK (((fecha_inicio IS NULL) OR (fecha_termino IS NULL) OR (fecha_termino >= fecha_inicio)))"
  },
  {
    "table_name": "servicio_operativo",
    "name": "servicio_operativo_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "servicio_operativo",
    "name": "servicio_operativo_meses_servicio_check",
    "kind": "c",
    "definition": "CHECK (((meses_servicio IS NULL) OR (meses_servicio > 0)))"
  },
  {
    "table_name": "servicio_operativo",
    "name": "servicio_operativo_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "servicio_operativo",
    "name": "servicio_operativo_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "servicio_operativo",
    "name": "servicio_operativo_proyecto_id_key",
    "kind": "u",
    "definition": "UNIQUE (proyecto_id)"
  },
  {
    "table_name": "servicio_operativo",
    "name": "servicio_operativo_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "ck_solicitud_diferencia",
    "kind": "c",
    "definition": "CHECK ((valor_anterior <> valor_propuesto))"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "ck_solicitud_excepcion",
    "kind": "c",
    "definition": "CHECK (((es_excepcion AND (control_cambio_id IS NULL) AND (justificacion IS NOT NULL) AND (btrim(justificacion) <> ''::text)) OR ((NOT es_excepcion) AND (control_cambio_id IS NOT NULL))))"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "ck_solicitud_resolucion",
    "kind": "c",
    "definition": "CHECK ((((estado = 'PENDIENTE'::text) AND (fecha_resolucion IS NULL) AND (aprobador_id IS NULL)) OR ((estado = ANY (ARRAY['APROBADO'::text, 'RECHAZADO'::text])) AND (fecha_resolucion IS NOT NULL) AND (aprobador_id IS NOT NULL))))"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "ck_solicitud_separacion_funciones",
    "kind": "c",
    "definition": "CHECK (((aprobador_id IS NULL) OR (aprobador_id <> solicitante_id)))"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "fk_solicitud_cc_mismo_proyecto",
    "kind": "f",
    "definition": "FOREIGN KEY (control_cambio_id, proyecto_id) REFERENCES pmo_cusn.control_cambio(id, proyecto_id) ON DELETE RESTRICT"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_aprobador_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (aprobador_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_campo_check",
    "kind": "c",
    "definition": "CHECK ((campo = ANY (ARRAY['FECHA_INICIO'::text, 'FECHA_TERMINO'::text, 'FECHA_OPERACION_INICIO'::text, 'FECHA_OPERACION_TERMINO'::text])))"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_campo_not_null",
    "kind": "n",
    "definition": "NOT NULL campo"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_es_excepcion_not_null",
    "kind": "n",
    "definition": "NOT NULL es_excepcion"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_estado_check",
    "kind": "c",
    "definition": "CHECK ((estado = ANY (ARRAY['PENDIENTE'::text, 'APROBADO'::text, 'RECHAZADO'::text])))"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_estado_not_null",
    "kind": "n",
    "definition": "NOT NULL estado"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_fecha_solicitud_not_null",
    "kind": "n",
    "definition": "NOT NULL fecha_solicitud"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_solicitante_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (solicitante_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_solicitante_id_not_null",
    "kind": "n",
    "definition": "NOT NULL solicitante_id"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_valor_anterior_not_null",
    "kind": "n",
    "definition": "NOT NULL valor_anterior"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_valor_propuesto_not_null",
    "kind": "n",
    "definition": "NOT NULL valor_propuesto"
  },
  {
    "table_name": "squad",
    "name": "squad_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "squad",
    "name": "squad_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "squad",
    "name": "squad_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "squad",
    "name": "squad_nombre_key",
    "kind": "u",
    "definition": "UNIQUE (nombre)"
  },
  {
    "table_name": "squad",
    "name": "squad_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "squad",
    "name": "squad_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "tipo_documento",
    "name": "tipo_documento_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "tipo_documento",
    "name": "tipo_documento_codigo_check",
    "kind": "c",
    "definition": "CHECK ((btrim(codigo) <> ''::text))"
  },
  {
    "table_name": "tipo_documento",
    "name": "tipo_documento_codigo_key",
    "kind": "u",
    "definition": "UNIQUE (codigo)"
  },
  {
    "table_name": "tipo_documento",
    "name": "tipo_documento_codigo_not_null",
    "kind": "n",
    "definition": "NOT NULL codigo"
  },
  {
    "table_name": "tipo_documento",
    "name": "tipo_documento_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "tipo_documento",
    "name": "tipo_documento_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "tipo_documento",
    "name": "tipo_documento_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "tipo_documento",
    "name": "tipo_documento_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "tipo_entregable",
    "name": "tipo_entregable_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "tipo_entregable",
    "name": "tipo_entregable_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "tipo_entregable",
    "name": "tipo_entregable_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "tipo_entregable",
    "name": "tipo_entregable_nombre_key",
    "kind": "u",
    "definition": "UNIQUE (nombre)"
  },
  {
    "table_name": "tipo_entregable",
    "name": "tipo_entregable_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "tipo_entregable",
    "name": "tipo_entregable_orden_check",
    "kind": "c",
    "definition": "CHECK (((orden IS NULL) OR (orden >= 0)))"
  },
  {
    "table_name": "tipo_entregable",
    "name": "tipo_entregable_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "unidad_monetaria",
    "name": "ck_unidad_monetaria_codigo",
    "kind": "c",
    "definition": "CHECK (((codigo)::text = ANY ((ARRAY['USD'::character varying, 'PEN'::character varying, 'CLP'::character varying, 'COP'::character varying, 'ARS'::character varying, 'BRL'::character varying, 'PAB'::character varying, 'MXN'::character varying, 'UF'::character varying])::text[])))"
  },
  {
    "table_name": "unidad_monetaria",
    "name": "unidad_monetaria_clase_check",
    "kind": "c",
    "definition": "CHECK ((clase = ANY (ARRAY['MONEDA'::text, 'UNIDAD_INDEXADA'::text])))"
  },
  {
    "table_name": "unidad_monetaria",
    "name": "unidad_monetaria_clase_not_null",
    "kind": "n",
    "definition": "NOT NULL clase"
  },
  {
    "table_name": "unidad_monetaria",
    "name": "unidad_monetaria_codigo_not_null",
    "kind": "n",
    "definition": "NOT NULL codigo"
  },
  {
    "table_name": "unidad_monetaria",
    "name": "unidad_monetaria_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (codigo)"
  },
  {
    "table_name": "usuario",
    "name": "ck_usuario_recovery_par",
    "kind": "c",
    "definition": "CHECK (((recovery_token_hash IS NULL) = (recovery_expires_at IS NULL)))"
  },
  {
    "table_name": "usuario",
    "name": "ck_usuario_refresh_par",
    "kind": "c",
    "definition": "CHECK (((refresh_token_hash IS NULL) = (refresh_expires_at IS NULL)))"
  },
  {
    "table_name": "usuario",
    "name": "ctr_pm_titular_usuario",
    "kind": "t",
    "definition": "TRIGGER DEFERRABLE INITIALLY DEFERRED"
  },
  {
    "table_name": "usuario",
    "name": "usuario_activo_not_null",
    "kind": "n",
    "definition": "NOT NULL activo"
  },
  {
    "table_name": "usuario",
    "name": "usuario_contacto_cliente_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (contacto_cliente_id) REFERENCES pmo_cusn.contacto_cliente(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "usuario",
    "name": "usuario_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "usuario",
    "name": "usuario_email_check",
    "kind": "c",
    "definition": "CHECK ((POSITION(('@'::text) IN (email)) > 1))"
  },
  {
    "table_name": "usuario",
    "name": "usuario_email_not_null",
    "kind": "n",
    "definition": "NOT NULL email"
  },
  {
    "table_name": "usuario",
    "name": "usuario_failed_login_count_check",
    "kind": "c",
    "definition": "CHECK ((failed_login_count >= 0))"
  },
  {
    "table_name": "usuario",
    "name": "usuario_failed_login_count_not_null",
    "kind": "n",
    "definition": "NOT NULL failed_login_count"
  },
  {
    "table_name": "usuario",
    "name": "usuario_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "usuario",
    "name": "usuario_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "usuario",
    "name": "usuario_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "usuario",
    "name": "usuario_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "usuario",
    "name": "usuario_recovery_token_hash_key",
    "kind": "u",
    "definition": "UNIQUE (recovery_token_hash)"
  },
  {
    "table_name": "usuario",
    "name": "usuario_refresh_token_hash_key",
    "kind": "u",
    "definition": "UNIQUE (refresh_token_hash)"
  },
  {
    "table_name": "usuario",
    "name": "usuario_session_version_check",
    "kind": "c",
    "definition": "CHECK ((session_version > 0))"
  },
  {
    "table_name": "usuario",
    "name": "usuario_session_version_not_null",
    "kind": "n",
    "definition": "NOT NULL session_version"
  },
  {
    "table_name": "usuario",
    "name": "usuario_tipo_usuario_check",
    "kind": "c",
    "definition": "CHECK ((tipo_usuario = ANY (ARRAY['INTERNO'::text, 'EXTERNO'::text])))"
  },
  {
    "table_name": "usuario",
    "name": "usuario_tipo_usuario_not_null",
    "kind": "n",
    "definition": "NOT NULL tipo_usuario"
  },
  {
    "table_name": "usuario",
    "name": "usuario_updated_at_not_null",
    "kind": "n",
    "definition": "NOT NULL updated_at"
  },
  {
    "table_name": "validacion_cierre",
    "name": "ck_cierre_apto",
    "kind": "c",
    "definition": "CHECK (((resultado <> 'APTO'::text) OR ((validador_id IS NOT NULL) AND (checklist_ok IS TRUE) AND (documentos_ok IS TRUE) AND (riesgos_ok IS TRUE) AND (lecciones_ok IS TRUE))))"
  },
  {
    "table_name": "validacion_cierre",
    "name": "validacion_cierre_fecha_validacion_not_null",
    "kind": "n",
    "definition": "NOT NULL fecha_validacion"
  },
  {
    "table_name": "validacion_cierre",
    "name": "validacion_cierre_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "validacion_cierre",
    "name": "validacion_cierre_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "validacion_cierre",
    "name": "validacion_cierre_proyecto_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (proyecto_id) REFERENCES pmo_cusn.proyecto(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "validacion_cierre",
    "name": "validacion_cierre_proyecto_id_not_null",
    "kind": "n",
    "definition": "NOT NULL proyecto_id"
  },
  {
    "table_name": "validacion_cierre",
    "name": "validacion_cierre_resultado_check",
    "kind": "c",
    "definition": "CHECK ((resultado = ANY (ARRAY['PENDIENTE'::text, 'APTO'::text, 'NO_APTO'::text, 'SIN_EVIDENCIA_HISTORICA'::text])))"
  },
  {
    "table_name": "validacion_cierre",
    "name": "validacion_cierre_resultado_not_null",
    "kind": "n",
    "definition": "NOT NULL resultado"
  },
  {
    "table_name": "validacion_cierre",
    "name": "validacion_cierre_validador_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (validador_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "workspace",
    "name": "workspace_creado_por_id_fkey",
    "kind": "f",
    "definition": "FOREIGN KEY (creado_por_id) REFERENCES pmo_cusn.usuario(id) ON DELETE RESTRICT"
  },
  {
    "table_name": "workspace",
    "name": "workspace_creado_por_id_not_null",
    "kind": "n",
    "definition": "NOT NULL creado_por_id"
  },
  {
    "table_name": "workspace",
    "name": "workspace_created_at_not_null",
    "kind": "n",
    "definition": "NOT NULL created_at"
  },
  {
    "table_name": "workspace",
    "name": "workspace_estado_check",
    "kind": "c",
    "definition": "CHECK ((estado = ANY (ARRAY['ACTIVO'::text, 'ARCHIVADO'::text])))"
  },
  {
    "table_name": "workspace",
    "name": "workspace_estado_not_null",
    "kind": "n",
    "definition": "NOT NULL estado"
  },
  {
    "table_name": "workspace",
    "name": "workspace_id_not_null",
    "kind": "n",
    "definition": "NOT NULL id"
  },
  {
    "table_name": "workspace",
    "name": "workspace_nombre_check",
    "kind": "c",
    "definition": "CHECK ((btrim(nombre) <> ''::text))"
  },
  {
    "table_name": "workspace",
    "name": "workspace_nombre_not_null",
    "kind": "n",
    "definition": "NOT NULL nombre"
  },
  {
    "table_name": "workspace",
    "name": "workspace_pkey",
    "kind": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "table_name": "workspace",
    "name": "workspace_slug_check",
    "kind": "c",
    "definition": "CHECK ((slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text))"
  },
  {
    "table_name": "workspace",
    "name": "workspace_slug_key",
    "kind": "u",
    "definition": "UNIQUE (slug)"
  },
  {
    "table_name": "workspace",
    "name": "workspace_slug_not_null",
    "kind": "n",
    "definition": "NOT NULL slug"
  },
  {
    "table_name": "workspace",
    "name": "workspace_updated_at_not_null",
    "kind": "n",
    "definition": "NOT NULL updated_at"
  },
  {
    "table_name": "workspace",
    "name": "workspace_version_check",
    "kind": "c",
    "definition": "CHECK ((version > 0))"
  },
  {
    "table_name": "workspace",
    "name": "workspace_version_not_null",
    "kind": "n",
    "definition": "NOT NULL version"
  }
] as const;
export const databaseIndexes = [
  {
    "table_name": "accion_riesgo",
    "name": "accion_riesgo_pkey",
    "definition": "CREATE UNIQUE INDEX accion_riesgo_pkey ON pmo_cusn.accion_riesgo USING btree (id)"
  },
  {
    "table_name": "accion_riesgo",
    "name": "ix_accion_riesgo_riesgo",
    "definition": "CREATE INDEX ix_accion_riesgo_riesgo ON pmo_cusn.accion_riesgo USING btree (riesgo_proyecto_id)"
  },
  {
    "table_name": "ambito_cambio",
    "name": "ambito_cambio_nombre_key",
    "definition": "CREATE UNIQUE INDEX ambito_cambio_nombre_key ON pmo_cusn.ambito_cambio USING btree (nombre)"
  },
  {
    "table_name": "ambito_cambio",
    "name": "ambito_cambio_pkey",
    "definition": "CREATE UNIQUE INDEX ambito_cambio_pkey ON pmo_cusn.ambito_cambio USING btree (id)"
  },
  {
    "table_name": "asignacion_rol",
    "name": "asignacion_rol_pkey",
    "definition": "CREATE UNIQUE INDEX asignacion_rol_pkey ON pmo_cusn.asignacion_rol USING btree (id)"
  },
  {
    "table_name": "asignacion_rol",
    "name": "ix_asignacion_rol",
    "definition": "CREATE INDEX ix_asignacion_rol ON pmo_cusn.asignacion_rol USING btree (rol_id)"
  },
  {
    "table_name": "asignacion_rol",
    "name": "ix_asignacion_usuario",
    "definition": "CREATE INDEX ix_asignacion_usuario ON pmo_cusn.asignacion_rol USING btree (usuario_id)"
  },
  {
    "table_name": "asignacion_rol",
    "name": "uq_asignacion_rol_corporativo_vigente",
    "definition": "CREATE UNIQUE INDEX uq_asignacion_rol_corporativo_vigente ON pmo_cusn.asignacion_rol USING btree (usuario_id) WHERE (revocado_at IS NULL)"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "auditoria_seguridad_pkey",
    "definition": "CREATE UNIQUE INDEX auditoria_seguridad_pkey ON pmo_cusn.auditoria_seguridad USING btree (id)"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "ix_auditoria_actor_fecha",
    "definition": "CREATE INDEX ix_auditoria_actor_fecha ON pmo_cusn.auditoria_seguridad USING btree (actor_id, fecha_evento DESC)"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "ix_auditoria_proyecto_fecha",
    "definition": "CREATE INDEX ix_auditoria_proyecto_fecha ON pmo_cusn.auditoria_seguridad USING btree (proyecto_id, fecha_evento DESC)"
  },
  {
    "table_name": "auditoria_seguridad",
    "name": "ix_auditoria_workspace_fecha",
    "definition": "CREATE INDEX ix_auditoria_workspace_fecha ON pmo_cusn.auditoria_seguridad USING btree (workspace_id, fecha_evento DESC)"
  },
  {
    "table_name": "cambio_ambito",
    "name": "cambio_ambito_pkey",
    "definition": "CREATE UNIQUE INDEX cambio_ambito_pkey ON pmo_cusn.cambio_ambito USING btree (control_cambio_id, ambito_id)"
  },
  {
    "table_name": "cambio_ambito",
    "name": "ix_cambio_ambito_ambito",
    "definition": "CREATE INDEX ix_cambio_ambito_ambito ON pmo_cusn.cambio_ambito USING btree (ambito_id)"
  },
  {
    "table_name": "cliente",
    "name": "cliente_pkey",
    "definition": "CREATE UNIQUE INDEX cliente_pkey ON pmo_cusn.cliente USING btree (id)"
  },
  {
    "table_name": "compra",
    "name": "compra_pkey",
    "definition": "CREATE UNIQUE INDEX compra_pkey ON pmo_cusn.compra USING btree (id)"
  },
  {
    "table_name": "compra",
    "name": "ix_compra_proveedor",
    "definition": "CREATE INDEX ix_compra_proveedor ON pmo_cusn.compra USING btree (proveedor_id)"
  },
  {
    "table_name": "compra",
    "name": "ix_compra_proyecto",
    "definition": "CREATE INDEX ix_compra_proyecto ON pmo_cusn.compra USING btree (proyecto_id)"
  },
  {
    "table_name": "compromiso",
    "name": "compromiso_pkey",
    "definition": "CREATE UNIQUE INDEX compromiso_pkey ON pmo_cusn.compromiso USING btree (id)"
  },
  {
    "table_name": "compromiso",
    "name": "ix_compromiso_proyecto",
    "definition": "CREATE INDEX ix_compromiso_proyecto ON pmo_cusn.compromiso USING btree (proyecto_id)"
  },
  {
    "table_name": "compromiso",
    "name": "ix_compromiso_responsable",
    "definition": "CREATE INDEX ix_compromiso_responsable ON pmo_cusn.compromiso USING btree (responsable_id)"
  },
  {
    "table_name": "condicion_comercial",
    "name": "condicion_comercial_pkey",
    "definition": "CREATE UNIQUE INDEX condicion_comercial_pkey ON pmo_cusn.condicion_comercial USING btree (id)"
  },
  {
    "table_name": "condicion_comercial",
    "name": "condicion_comercial_proyecto_id_key",
    "definition": "CREATE UNIQUE INDEX condicion_comercial_proyecto_id_key ON pmo_cusn.condicion_comercial USING btree (proyecto_id)"
  },
  {
    "table_name": "contacto_cliente",
    "name": "contacto_cliente_pkey",
    "definition": "CREATE UNIQUE INDEX contacto_cliente_pkey ON pmo_cusn.contacto_cliente USING btree (id)"
  },
  {
    "table_name": "contacto_cliente",
    "name": "ix_contacto_cliente_cliente",
    "definition": "CREATE INDEX ix_contacto_cliente_cliente ON pmo_cusn.contacto_cliente USING btree (cliente_id)"
  },
  {
    "table_name": "contacto_cliente",
    "name": "uq_contacto_cliente_id_cliente",
    "definition": "CREATE UNIQUE INDEX uq_contacto_cliente_id_cliente ON pmo_cusn.contacto_cliente USING btree (id, cliente_id)"
  },
  {
    "table_name": "control_cambio",
    "name": "control_cambio_pkey",
    "definition": "CREATE UNIQUE INDEX control_cambio_pkey ON pmo_cusn.control_cambio USING btree (id)"
  },
  {
    "table_name": "control_cambio",
    "name": "ix_cc_proyecto",
    "definition": "CREATE INDEX ix_cc_proyecto ON pmo_cusn.control_cambio USING btree (proyecto_id)"
  },
  {
    "table_name": "control_cambio",
    "name": "uq_cc_id_proyecto",
    "definition": "CREATE UNIQUE INDEX uq_cc_id_proyecto ON pmo_cusn.control_cambio USING btree (id, proyecto_id)"
  },
  {
    "table_name": "control_cambio",
    "name": "uq_cc_proyecto_folio",
    "definition": "CREATE UNIQUE INDEX uq_cc_proyecto_folio ON pmo_cusn.control_cambio USING btree (proyecto_id, folio)"
  },
  {
    "table_name": "control_cambio",
    "name": "uq_cc_proyecto_secuencia",
    "definition": "CREATE UNIQUE INDEX uq_cc_proyecto_secuencia ON pmo_cusn.control_cambio USING btree (proyecto_id, secuencia)"
  },
  {
    "table_name": "control_cambio_documento",
    "name": "control_cambio_documento_pkey",
    "definition": "CREATE UNIQUE INDEX control_cambio_documento_pkey ON pmo_cusn.control_cambio_documento USING btree (control_cambio_id, documento_id)"
  },
  {
    "table_name": "control_cambio_documento",
    "name": "ix_cc_documento_documento",
    "definition": "CREATE INDEX ix_cc_documento_documento ON pmo_cusn.control_cambio_documento USING btree (documento_id)"
  },
  {
    "table_name": "control_riesgo",
    "name": "control_riesgo_pkey",
    "definition": "CREATE UNIQUE INDEX control_riesgo_pkey ON pmo_cusn.control_riesgo USING btree (id)"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "delegacion_acceso_pkey",
    "definition": "CREATE UNIQUE INDEX delegacion_acceso_pkey ON pmo_cusn.delegacion_acceso USING btree (id)"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "ex_suplencia_pm_no_superpuesta",
    "definition": "CREATE INDEX ex_suplencia_pm_no_superpuesta ON pmo_cusn.delegacion_acceso USING gist (proyecto_id, tstzrange(inicio, fin, '[)'::text)) WHERE ((tipo = 'SUPLENCIA_PM'::text) AND (estado = ANY (ARRAY['PENDIENTE'::text, 'ACTIVA'::text])))"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "ix_delegacion_delegado_periodo",
    "definition": "CREATE INDEX ix_delegacion_delegado_periodo ON pmo_cusn.delegacion_acceso USING btree (delegado_id, inicio, fin)"
  },
  {
    "table_name": "delegacion_acceso",
    "name": "ix_delegacion_delegante",
    "definition": "CREATE INDEX ix_delegacion_delegante ON pmo_cusn.delegacion_acceso USING btree (delegante_id)"
  },
  {
    "table_name": "delegacion_permiso",
    "name": "delegacion_permiso_pkey",
    "definition": "CREATE UNIQUE INDEX delegacion_permiso_pkey ON pmo_cusn.delegacion_permiso USING btree (delegacion_id, permiso_id)"
  },
  {
    "table_name": "delegacion_permiso",
    "name": "ix_delegacion_permiso_permiso",
    "definition": "CREATE INDEX ix_delegacion_permiso_permiso ON pmo_cusn.delegacion_permiso USING btree (permiso_id)"
  },
  {
    "table_name": "documento",
    "name": "documento_drive_file_id_key",
    "definition": "CREATE UNIQUE INDEX documento_drive_file_id_key ON pmo_cusn.documento USING btree (drive_file_id)"
  },
  {
    "table_name": "documento",
    "name": "documento_pkey",
    "definition": "CREATE UNIQUE INDEX documento_pkey ON pmo_cusn.documento USING btree (id)"
  },
  {
    "table_name": "documento",
    "name": "ix_documento_tipo",
    "definition": "CREATE INDEX ix_documento_tipo ON pmo_cusn.documento USING btree (tipo_documento_id)"
  },
  {
    "table_name": "etapa_compra",
    "name": "etapa_compra_pkey",
    "definition": "CREATE UNIQUE INDEX etapa_compra_pkey ON pmo_cusn.etapa_compra USING btree (id)"
  },
  {
    "table_name": "etapa_compra",
    "name": "ix_etapa_compra_compra",
    "definition": "CREATE INDEX ix_etapa_compra_compra ON pmo_cusn.etapa_compra USING btree (compra_id)"
  },
  {
    "table_name": "etapa_compra",
    "name": "uq_compra_tipo_etapa",
    "definition": "CREATE UNIQUE INDEX uq_compra_tipo_etapa ON pmo_cusn.etapa_compra USING btree (compra_id, tipo_etapa)"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "evaluacion_complejidad_pkey",
    "definition": "CREATE UNIQUE INDEX evaluacion_complejidad_pkey ON pmo_cusn.evaluacion_complejidad USING btree (id)"
  },
  {
    "table_name": "evaluacion_complejidad",
    "name": "ix_complejidad_proyecto_fecha",
    "definition": "CREATE INDEX ix_complejidad_proyecto_fecha ON pmo_cusn.evaluacion_complejidad USING btree (proyecto_id, fecha_evaluacion DESC)"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "evaluacion_riesgo_pkey",
    "definition": "CREATE UNIQUE INDEX evaluacion_riesgo_pkey ON pmo_cusn.evaluacion_riesgo USING btree (id)"
  },
  {
    "table_name": "evaluacion_riesgo",
    "name": "ix_evaluacion_riesgo_fecha",
    "definition": "CREATE INDEX ix_evaluacion_riesgo_fecha ON pmo_cusn.evaluacion_riesgo USING btree (riesgo_proyecto_id, fecha_evaluacion DESC)"
  },
  {
    "table_name": "evento_proyecto",
    "name": "evento_proyecto_pkey",
    "definition": "CREATE UNIQUE INDEX evento_proyecto_pkey ON pmo_cusn.evento_proyecto USING btree (id)"
  },
  {
    "table_name": "evento_proyecto",
    "name": "ix_evento_proyecto_fecha",
    "definition": "CREATE INDEX ix_evento_proyecto_fecha ON pmo_cusn.evento_proyecto USING btree (proyecto_id, fecha_evento DESC)"
  },
  {
    "table_name": "hito_facturacion",
    "name": "hito_facturacion_pkey",
    "definition": "CREATE UNIQUE INDEX hito_facturacion_pkey ON pmo_cusn.hito_facturacion USING btree (id)"
  },
  {
    "table_name": "hito_facturacion",
    "name": "ix_hito_facturacion_proyecto_periodo",
    "definition": "CREATE INDEX ix_hito_facturacion_proyecto_periodo ON pmo_cusn.hito_facturacion USING btree (proyecto_id, periodo)"
  },
  {
    "table_name": "hito_facturacion",
    "name": "ix_hito_facturacion_unidad",
    "definition": "CREATE INDEX ix_hito_facturacion_unidad ON pmo_cusn.hito_facturacion USING btree (unidad_codigo)"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_pkey",
    "definition": "CREATE UNIQUE INDEX invitacion_workspace_pkey ON pmo_cusn.invitacion_workspace USING btree (id)"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "invitacion_workspace_token_hash_key",
    "definition": "CREATE UNIQUE INDEX invitacion_workspace_token_hash_key ON pmo_cusn.invitacion_workspace USING btree (token_hash)"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "ix_invitacion_workspace_estado",
    "definition": "CREATE INDEX ix_invitacion_workspace_estado ON pmo_cusn.invitacion_workspace USING btree (workspace_id, estado)"
  },
  {
    "table_name": "invitacion_workspace",
    "name": "uq_invitacion_ws_email_pendiente",
    "definition": "CREATE UNIQUE INDEX uq_invitacion_ws_email_pendiente ON pmo_cusn.invitacion_workspace USING btree (workspace_id, lower(btrim(email_destinatario))) WHERE (estado = 'PENDIENTE'::text)"
  },
  {
    "table_name": "item_checklist_documento",
    "name": "item_checklist_documento_pkey",
    "definition": "CREATE UNIQUE INDEX item_checklist_documento_pkey ON pmo_cusn.item_checklist_documento USING btree (item_checklist_id, documento_id)"
  },
  {
    "table_name": "item_checklist_documento",
    "name": "ix_checklist_documento_documento",
    "definition": "CREATE INDEX ix_checklist_documento_documento ON pmo_cusn.item_checklist_documento USING btree (documento_id)"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "item_checklist_proyecto_pkey",
    "definition": "CREATE UNIQUE INDEX item_checklist_proyecto_pkey ON pmo_cusn.item_checklist_proyecto USING btree (id)"
  },
  {
    "table_name": "item_checklist_proyecto",
    "name": "ix_checklist_proyecto",
    "definition": "CREATE INDEX ix_checklist_proyecto ON pmo_cusn.item_checklist_proyecto USING btree (proyecto_id)"
  },
  {
    "table_name": "leccion_aprendida",
    "name": "ix_leccion_proyecto",
    "definition": "CREATE INDEX ix_leccion_proyecto ON pmo_cusn.leccion_aprendida USING btree (proyecto_id)"
  },
  {
    "table_name": "leccion_aprendida",
    "name": "leccion_aprendida_pkey",
    "definition": "CREATE UNIQUE INDEX leccion_aprendida_pkey ON pmo_cusn.leccion_aprendida USING btree (id)"
  },
  {
    "table_name": "leccion_documento",
    "name": "ix_leccion_documento_documento",
    "definition": "CREATE INDEX ix_leccion_documento_documento ON pmo_cusn.leccion_documento USING btree (documento_id)"
  },
  {
    "table_name": "leccion_documento",
    "name": "leccion_documento_pkey",
    "definition": "CREATE UNIQUE INDEX leccion_documento_pkey ON pmo_cusn.leccion_documento USING btree (leccion_id, documento_id)"
  },
  {
    "table_name": "lob",
    "name": "lob_nombre_key",
    "definition": "CREATE UNIQUE INDEX lob_nombre_key ON pmo_cusn.lob USING btree (nombre)"
  },
  {
    "table_name": "lob",
    "name": "lob_pkey",
    "definition": "CREATE UNIQUE INDEX lob_pkey ON pmo_cusn.lob USING btree (id)"
  },
  {
    "table_name": "membresia_workspace",
    "name": "ix_membresia_usuario_estado",
    "definition": "CREATE INDEX ix_membresia_usuario_estado ON pmo_cusn.membresia_workspace USING btree (usuario_id, estado)"
  },
  {
    "table_name": "membresia_workspace",
    "name": "ix_membresia_workspace_estado",
    "definition": "CREATE INDEX ix_membresia_workspace_estado ON pmo_cusn.membresia_workspace USING btree (workspace_id, estado)"
  },
  {
    "table_name": "membresia_workspace",
    "name": "membresia_workspace_pkey",
    "definition": "CREATE UNIQUE INDEX membresia_workspace_pkey ON pmo_cusn.membresia_workspace USING btree (id)"
  },
  {
    "table_name": "membresia_workspace",
    "name": "uq_membresia_workspace_usuario",
    "definition": "CREATE UNIQUE INDEX uq_membresia_workspace_usuario ON pmo_cusn.membresia_workspace USING btree (workspace_id, usuario_id)"
  },
  {
    "table_name": "pais",
    "name": "pais_codigo_key",
    "definition": "CREATE UNIQUE INDEX pais_codigo_key ON pmo_cusn.pais USING btree (codigo)"
  },
  {
    "table_name": "pais",
    "name": "pais_pkey",
    "definition": "CREATE UNIQUE INDEX pais_pkey ON pmo_cusn.pais USING btree (id)"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "ex_pm_titular_periodos",
    "definition": "CREATE INDEX ex_pm_titular_periodos ON pmo_cusn.participacion_proyecto USING gist (proyecto_id, tstzrange(fecha_inicio, fecha_fin, '[)'::text)) WHERE (funcion = 'PM_TITULAR'::text)"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "ix_participacion_proyecto",
    "definition": "CREATE INDEX ix_participacion_proyecto ON pmo_cusn.participacion_proyecto USING btree (proyecto_id)"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "ix_participacion_usuario",
    "definition": "CREATE INDEX ix_participacion_usuario ON pmo_cusn.participacion_proyecto USING btree (usuario_id)"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "participacion_proyecto_pkey",
    "definition": "CREATE UNIQUE INDEX participacion_proyecto_pkey ON pmo_cusn.participacion_proyecto USING btree (id)"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "uq_participacion_proyecto_funcion_actual",
    "definition": "CREATE UNIQUE INDEX uq_participacion_proyecto_funcion_actual ON pmo_cusn.participacion_proyecto USING btree (proyecto_id, usuario_id, funcion) WHERE (fecha_fin IS NULL)"
  },
  {
    "table_name": "participacion_proyecto",
    "name": "uq_pm_titular_proyecto_actual",
    "definition": "CREATE UNIQUE INDEX uq_pm_titular_proyecto_actual ON pmo_cusn.participacion_proyecto USING btree (proyecto_id) WHERE ((funcion = 'PM_TITULAR'::text) AND (fecha_fin IS NULL))"
  },
  {
    "table_name": "permiso",
    "name": "permiso_codigo_key",
    "definition": "CREATE UNIQUE INDEX permiso_codigo_key ON pmo_cusn.permiso USING btree (codigo)"
  },
  {
    "table_name": "permiso",
    "name": "permiso_pkey",
    "definition": "CREATE UNIQUE INDEX permiso_pkey ON pmo_cusn.permiso USING btree (id)"
  },
  {
    "table_name": "proveedor",
    "name": "proveedor_pkey",
    "definition": "CREATE UNIQUE INDEX proveedor_pkey ON pmo_cusn.proveedor USING btree (id)"
  },
  {
    "table_name": "proyecto",
    "name": "ix_proyecto_cliente",
    "definition": "CREATE INDEX ix_proyecto_cliente ON pmo_cusn.proyecto USING btree (cliente_id)"
  },
  {
    "table_name": "proyecto",
    "name": "ix_proyecto_creador",
    "definition": "CREATE INDEX ix_proyecto_creador ON pmo_cusn.proyecto USING btree (creado_por_id)"
  },
  {
    "table_name": "proyecto",
    "name": "ix_proyecto_estado",
    "definition": "CREATE INDEX ix_proyecto_estado ON pmo_cusn.proyecto USING btree (estado_actual)"
  },
  {
    "table_name": "proyecto",
    "name": "ix_proyecto_lob",
    "definition": "CREATE INDEX ix_proyecto_lob ON pmo_cusn.proyecto USING btree (lob_id)"
  },
  {
    "table_name": "proyecto",
    "name": "ix_proyecto_pais",
    "definition": "CREATE INDEX ix_proyecto_pais ON pmo_cusn.proyecto USING btree (pais_id)"
  },
  {
    "table_name": "proyecto",
    "name": "ix_proyecto_squad",
    "definition": "CREATE INDEX ix_proyecto_squad ON pmo_cusn.proyecto USING btree (squad_id)"
  },
  {
    "table_name": "proyecto",
    "name": "ix_proyecto_workspace",
    "definition": "CREATE INDEX ix_proyecto_workspace ON pmo_cusn.proyecto USING btree (workspace_id)"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_drive_folder_id_key",
    "definition": "CREATE UNIQUE INDEX proyecto_drive_folder_id_key ON pmo_cusn.proyecto USING btree (drive_folder_id)"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_pkey",
    "definition": "CREATE UNIQUE INDEX proyecto_pkey ON pmo_cusn.proyecto USING btree (id)"
  },
  {
    "table_name": "proyecto",
    "name": "proyecto_tvt_normalizado_key",
    "definition": "CREATE UNIQUE INDEX proyecto_tvt_normalizado_key ON pmo_cusn.proyecto USING btree (tvt_normalizado)"
  },
  {
    "table_name": "proyecto",
    "name": "uq_proyecto_id_cliente",
    "definition": "CREATE UNIQUE INDEX uq_proyecto_id_cliente ON pmo_cusn.proyecto USING btree (id, cliente_id)"
  },
  {
    "table_name": "proyecto",
    "name": "uq_proyecto_id_lob",
    "definition": "CREATE UNIQUE INDEX uq_proyecto_id_lob ON pmo_cusn.proyecto USING btree (id, lob_id)"
  },
  {
    "table_name": "proyecto_contacto",
    "name": "ix_proyecto_contacto_contacto",
    "definition": "CREATE INDEX ix_proyecto_contacto_contacto ON pmo_cusn.proyecto_contacto USING btree (contacto_id)"
  },
  {
    "table_name": "proyecto_contacto",
    "name": "proyecto_contacto_pkey",
    "definition": "CREATE UNIQUE INDEX proyecto_contacto_pkey ON pmo_cusn.proyecto_contacto USING btree (proyecto_id, contacto_id, rol_contacto)"
  },
  {
    "table_name": "proyecto_documento",
    "name": "ix_proyecto_documento_documento",
    "definition": "CREATE INDEX ix_proyecto_documento_documento ON pmo_cusn.proyecto_documento USING btree (documento_id)"
  },
  {
    "table_name": "proyecto_documento",
    "name": "proyecto_documento_pkey",
    "definition": "CREATE UNIQUE INDEX proyecto_documento_pkey ON pmo_cusn.proyecto_documento USING btree (proyecto_id, documento_id)"
  },
  {
    "table_name": "proyecto_servicio_lob",
    "name": "ix_proyecto_servicio_servicio",
    "definition": "CREATE INDEX ix_proyecto_servicio_servicio ON pmo_cusn.proyecto_servicio_lob USING btree (servicio_lob_id)"
  },
  {
    "table_name": "proyecto_servicio_lob",
    "name": "proyecto_servicio_lob_pkey",
    "definition": "CREATE UNIQUE INDEX proyecto_servicio_lob_pkey ON pmo_cusn.proyecto_servicio_lob USING btree (proyecto_id, servicio_lob_id)"
  },
  {
    "table_name": "registro_notificacion",
    "name": "ix_notificacion_proyecto",
    "definition": "CREATE INDEX ix_notificacion_proyecto ON pmo_cusn.registro_notificacion USING btree (proyecto_id)"
  },
  {
    "table_name": "registro_notificacion",
    "name": "ix_notificacion_usuario_fecha",
    "definition": "CREATE INDEX ix_notificacion_usuario_fecha ON pmo_cusn.registro_notificacion USING btree (usuario_destinatario_id, creado_at DESC)"
  },
  {
    "table_name": "registro_notificacion",
    "name": "registro_notificacion_pkey",
    "definition": "CREATE UNIQUE INDEX registro_notificacion_pkey ON pmo_cusn.registro_notificacion USING btree (id)"
  },
  {
    "table_name": "riesgo_control_riesgo",
    "name": "ix_riesgo_control_control",
    "definition": "CREATE INDEX ix_riesgo_control_control ON pmo_cusn.riesgo_control_riesgo USING btree (control_riesgo_id)"
  },
  {
    "table_name": "riesgo_control_riesgo",
    "name": "riesgo_control_riesgo_pkey",
    "definition": "CREATE UNIQUE INDEX riesgo_control_riesgo_pkey ON pmo_cusn.riesgo_control_riesgo USING btree (riesgo_proyecto_id, control_riesgo_id)"
  },
  {
    "table_name": "riesgo_global",
    "name": "riesgo_global_pkey",
    "definition": "CREATE UNIQUE INDEX riesgo_global_pkey ON pmo_cusn.riesgo_global USING btree (id)"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "ix_riesgo_proyecto_global",
    "definition": "CREATE INDEX ix_riesgo_proyecto_global ON pmo_cusn.riesgo_proyecto USING btree (riesgo_global_id)"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "ix_riesgo_proyecto_proyecto",
    "definition": "CREATE INDEX ix_riesgo_proyecto_proyecto ON pmo_cusn.riesgo_proyecto USING btree (proyecto_id)"
  },
  {
    "table_name": "riesgo_proyecto",
    "name": "riesgo_proyecto_pkey",
    "definition": "CREATE UNIQUE INDEX riesgo_proyecto_pkey ON pmo_cusn.riesgo_proyecto USING btree (id)"
  },
  {
    "table_name": "rol",
    "name": "rol_codigo_key",
    "definition": "CREATE UNIQUE INDEX rol_codigo_key ON pmo_cusn.rol USING btree (codigo)"
  },
  {
    "table_name": "rol",
    "name": "rol_pkey",
    "definition": "CREATE UNIQUE INDEX rol_pkey ON pmo_cusn.rol USING btree (id)"
  },
  {
    "table_name": "rol_permiso",
    "name": "ix_rol_permiso_permiso",
    "definition": "CREATE INDEX ix_rol_permiso_permiso ON pmo_cusn.rol_permiso USING btree (permiso_id)"
  },
  {
    "table_name": "rol_permiso",
    "name": "rol_permiso_pkey",
    "definition": "CREATE UNIQUE INDEX rol_permiso_pkey ON pmo_cusn.rol_permiso USING btree (rol_id, permiso_id)"
  },
  {
    "table_name": "seguimiento_proyecto",
    "name": "ix_seguimiento_proyecto_fecha",
    "definition": "CREATE INDEX ix_seguimiento_proyecto_fecha ON pmo_cusn.seguimiento_proyecto USING btree (proyecto_id, fecha_registro DESC)"
  },
  {
    "table_name": "seguimiento_proyecto",
    "name": "seguimiento_proyecto_pkey",
    "definition": "CREATE UNIQUE INDEX seguimiento_proyecto_pkey ON pmo_cusn.seguimiento_proyecto USING btree (id)"
  },
  {
    "table_name": "servicio_lob",
    "name": "ix_servicio_lob_lob",
    "definition": "CREATE INDEX ix_servicio_lob_lob ON pmo_cusn.servicio_lob USING btree (lob_id)"
  },
  {
    "table_name": "servicio_lob",
    "name": "servicio_lob_pkey",
    "definition": "CREATE UNIQUE INDEX servicio_lob_pkey ON pmo_cusn.servicio_lob USING btree (id)"
  },
  {
    "table_name": "servicio_lob",
    "name": "uq_servicio_lob_id_lob",
    "definition": "CREATE UNIQUE INDEX uq_servicio_lob_id_lob ON pmo_cusn.servicio_lob USING btree (id, lob_id)"
  },
  {
    "table_name": "servicio_lob",
    "name": "uq_servicio_lob_nombre",
    "definition": "CREATE UNIQUE INDEX uq_servicio_lob_nombre ON pmo_cusn.servicio_lob USING btree (lob_id, nombre)"
  },
  {
    "table_name": "servicio_operativo",
    "name": "servicio_operativo_pkey",
    "definition": "CREATE UNIQUE INDEX servicio_operativo_pkey ON pmo_cusn.servicio_operativo USING btree (id)"
  },
  {
    "table_name": "servicio_operativo",
    "name": "servicio_operativo_proyecto_id_key",
    "definition": "CREATE UNIQUE INDEX servicio_operativo_proyecto_id_key ON pmo_cusn.servicio_operativo USING btree (proyecto_id)"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "ix_solicitud_estado",
    "definition": "CREATE INDEX ix_solicitud_estado ON pmo_cusn.solicitud_cambio_planificacion USING btree (estado)"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "ix_solicitud_proyecto",
    "definition": "CREATE INDEX ix_solicitud_proyecto ON pmo_cusn.solicitud_cambio_planificacion USING btree (proyecto_id)"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "solicitud_cambio_planificacion_pkey",
    "definition": "CREATE UNIQUE INDEX solicitud_cambio_planificacion_pkey ON pmo_cusn.solicitud_cambio_planificacion USING btree (id)"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "uq_solicitud_campo_pendiente",
    "definition": "CREATE UNIQUE INDEX uq_solicitud_campo_pendiente ON pmo_cusn.solicitud_cambio_planificacion USING btree (proyecto_id, campo) WHERE (estado = 'PENDIENTE'::text)"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "uq_solicitud_cc_aprobado",
    "definition": "CREATE UNIQUE INDEX uq_solicitud_cc_aprobado ON pmo_cusn.solicitud_cambio_planificacion USING btree (control_cambio_id) WHERE ((estado = 'APROBADO'::text) AND (control_cambio_id IS NOT NULL))"
  },
  {
    "table_name": "solicitud_cambio_planificacion",
    "name": "uq_solicitud_cc_pendiente",
    "definition": "CREATE UNIQUE INDEX uq_solicitud_cc_pendiente ON pmo_cusn.solicitud_cambio_planificacion USING btree (control_cambio_id) WHERE ((estado = 'PENDIENTE'::text) AND (control_cambio_id IS NOT NULL))"
  },
  {
    "table_name": "squad",
    "name": "squad_nombre_key",
    "definition": "CREATE UNIQUE INDEX squad_nombre_key ON pmo_cusn.squad USING btree (nombre)"
  },
  {
    "table_name": "squad",
    "name": "squad_pkey",
    "definition": "CREATE UNIQUE INDEX squad_pkey ON pmo_cusn.squad USING btree (id)"
  },
  {
    "table_name": "tipo_documento",
    "name": "tipo_documento_codigo_key",
    "definition": "CREATE UNIQUE INDEX tipo_documento_codigo_key ON pmo_cusn.tipo_documento USING btree (codigo)"
  },
  {
    "table_name": "tipo_documento",
    "name": "tipo_documento_pkey",
    "definition": "CREATE UNIQUE INDEX tipo_documento_pkey ON pmo_cusn.tipo_documento USING btree (id)"
  },
  {
    "table_name": "tipo_entregable",
    "name": "tipo_entregable_nombre_key",
    "definition": "CREATE UNIQUE INDEX tipo_entregable_nombre_key ON pmo_cusn.tipo_entregable USING btree (nombre)"
  },
  {
    "table_name": "tipo_entregable",
    "name": "tipo_entregable_pkey",
    "definition": "CREATE UNIQUE INDEX tipo_entregable_pkey ON pmo_cusn.tipo_entregable USING btree (id)"
  },
  {
    "table_name": "unidad_monetaria",
    "name": "unidad_monetaria_pkey",
    "definition": "CREATE UNIQUE INDEX unidad_monetaria_pkey ON pmo_cusn.unidad_monetaria USING btree (codigo)"
  },
  {
    "table_name": "usuario",
    "name": "uq_usuario_email_normalizado",
    "definition": "CREATE UNIQUE INDEX uq_usuario_email_normalizado ON pmo_cusn.usuario USING btree (lower(btrim(email)))"
  },
  {
    "table_name": "usuario",
    "name": "usuario_pkey",
    "definition": "CREATE UNIQUE INDEX usuario_pkey ON pmo_cusn.usuario USING btree (id)"
  },
  {
    "table_name": "usuario",
    "name": "usuario_recovery_token_hash_key",
    "definition": "CREATE UNIQUE INDEX usuario_recovery_token_hash_key ON pmo_cusn.usuario USING btree (recovery_token_hash)"
  },
  {
    "table_name": "usuario",
    "name": "usuario_refresh_token_hash_key",
    "definition": "CREATE UNIQUE INDEX usuario_refresh_token_hash_key ON pmo_cusn.usuario USING btree (refresh_token_hash)"
  },
  {
    "table_name": "validacion_cierre",
    "name": "ix_validacion_cierre_proyecto_fecha",
    "definition": "CREATE INDEX ix_validacion_cierre_proyecto_fecha ON pmo_cusn.validacion_cierre USING btree (proyecto_id, fecha_validacion DESC)"
  },
  {
    "table_name": "validacion_cierre",
    "name": "validacion_cierre_pkey",
    "definition": "CREATE UNIQUE INDEX validacion_cierre_pkey ON pmo_cusn.validacion_cierre USING btree (id)"
  },
  {
    "table_name": "workspace",
    "name": "ix_workspace_creador",
    "definition": "CREATE INDEX ix_workspace_creador ON pmo_cusn.workspace USING btree (creado_por_id)"
  },
  {
    "table_name": "workspace",
    "name": "workspace_pkey",
    "definition": "CREATE UNIQUE INDEX workspace_pkey ON pmo_cusn.workspace USING btree (id)"
  },
  {
    "table_name": "workspace",
    "name": "workspace_slug_key",
    "definition": "CREATE UNIQUE INDEX workspace_slug_key ON pmo_cusn.workspace USING btree (slug)"
  }
] as const;
