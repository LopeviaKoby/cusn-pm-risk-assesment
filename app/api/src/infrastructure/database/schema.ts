// Generado desde el baseline verificado; integridad avanzada en SQL versionado.
import {sql} from 'drizzle-orm';
import {pgSchema,bigint,integer,smallint,numeric,text,varchar,boolean,date,timestamp,jsonb} from 'drizzle-orm/pg-core';
const pmo=pgSchema('pmo_cusn');
export const accion_riesgo=pmo.table("accion_riesgo",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  riesgo_proyecto_id:bigint("riesgo_proyecto_id",{mode:'bigint'}).notNull(),
  responsable_id:bigint("responsable_id",{mode:'bigint'}),
  descripcion:text("descripcion").notNull(),
  estado:text("estado").default(sql.raw("'PENDIENTE'::text")).notNull(),
  fecha_compromiso:date("fecha_compromiso",{mode:'string'}),
  fecha_cumplimiento:date("fecha_cumplimiento",{mode:'string'}),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const ambito_cambio=pmo.table("ambito_cambio",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  nombre:text("nombre").notNull(),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
});
export const asignacion_rol=pmo.table("asignacion_rol",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  usuario_id:bigint("usuario_id",{mode:'bigint'}).notNull(),
  rol_id:bigint("rol_id",{mode:'bigint'}).notNull(),
  alcance_lectura:text("alcance_lectura").notNull(),
  asignado_por_id:bigint("asignado_por_id",{mode:'bigint'}),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  revocado_at:timestamp("revocado_at",{withTimezone:true,mode:'date'}),
});
export const auditoria_seguridad=pmo.table("auditoria_seguridad",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  actor_id:bigint("actor_id",{mode:'bigint'}),
  delegacion_id:bigint("delegacion_id",{mode:'bigint'}),
  workspace_id:bigint("workspace_id",{mode:'bigint'}),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}),
  operacion:text("operacion").notNull(),
  recurso_tipo:text("recurso_tipo").notNull(),
  recurso_id:text("recurso_id"),
  resultado:text("resultado").notNull(),
  detalle:jsonb("detalle").default(sql.raw("'{}'::jsonb")).notNull(),
  fecha_evento:timestamp("fecha_evento",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const cambio_ambito=pmo.table("cambio_ambito",{
  control_cambio_id:bigint("control_cambio_id",{mode:'bigint'}).notNull(),
  ambito_id:bigint("ambito_id",{mode:'bigint'}).notNull(),
});
export const cliente=pmo.table("cliente",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  nombre:text("nombre").notNull(),
  sector:text("sector"),
  descripcion:text("descripcion"),
  estado_cliente:text("estado_cliente"),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  updated_at:timestamp("updated_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const compra=pmo.table("compra",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  proveedor_id:bigint("proveedor_id",{mode:'bigint'}).notNull(),
  gestor_compra_id:bigint("gestor_compra_id",{mode:'bigint'}),
  concepto:text("concepto"),
  descripcion:text("descripcion"),
  tipo_gasto:text("tipo_gasto"),
  unidad_codigo:varchar("unidad_codigo",{length:3}),
  fecha_solicitud:date("fecha_solicitud",{mode:'string'}),
  monto_adjudicado:numeric("monto_adjudicado",{precision:20,scale:4}),
  valor_setup:numeric("valor_setup",{precision:20,scale:4}),
  valor_recurrente:numeric("valor_recurrente",{precision:20,scale:4}),
  meses_recurrentes:integer("meses_recurrentes"),
  observaciones:text("observaciones"),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const compromiso=pmo.table("compromiso",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}),
  pais_id:bigint("pais_id",{mode:'bigint'}),
  responsable_id:bigint("responsable_id",{mode:'bigint'}),
  responsable_texto:text("responsable_texto"),
  titulo:text("titulo").notNull(),
  descripcion:text("descripcion"),
  alcance:text("alcance").notNull(),
  fecha_compromiso:date("fecha_compromiso",{mode:'string'}),
  fecha_limite:date("fecha_limite",{mode:'string'}),
  completado:boolean("completado").default(sql.raw("false")).notNull(),
  completado_at:timestamp("completado_at",{withTimezone:true,mode:'date'}),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const condicion_comercial=pmo.table("condicion_comercial",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  tcv_tipo:text("tcv_tipo").notNull(),
  tcv_valor:numeric("tcv_valor",{precision:20,scale:4}),
  unidad_codigo:varchar("unidad_codigo",{length:3}),
  updated_at:timestamp("updated_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const contacto_cliente=pmo.table("contacto_cliente",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  cliente_id:bigint("cliente_id",{mode:'bigint'}).notNull(),
  nombre:text("nombre").notNull(),
  email:text("email"),
  telefono:text("telefono"),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
});
export const control_cambio=pmo.table("control_cambio",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  secuencia:integer("secuencia").notNull(),
  folio:text("folio").notNull(),
  fecha_elaboracion:date("fecha_elaboracion",{mode:'string'}).notNull(),
  descripcion:text("descripcion").notNull(),
  justificacion:text("justificacion"),
  urgencia:text("urgencia").notNull(),
  estado_firma:text("estado_firma").default(sql.raw("'PENDIENTE'::text")).notNull(),
  estado_aprobacion:text("estado_aprobacion"),
  responsabilidad:text("responsabilidad"),
  responsable_cliente_id:bigint("responsable_cliente_id",{mode:'bigint'}),
  responsable_interno_id:bigint("responsable_interno_id",{mode:'bigint'}),
  account_responsable_id:bigint("account_responsable_id",{mode:'bigint'}),
  impacto_monetario:numeric("impacto_monetario",{precision:20,scale:4}),
  tipo_impacto:text("tipo_impacto"),
  unidad_codigo:varchar("unidad_codigo",{length:3}),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const control_cambio_documento=pmo.table("control_cambio_documento",{
  control_cambio_id:bigint("control_cambio_id",{mode:'bigint'}).notNull(),
  documento_id:bigint("documento_id",{mode:'bigint'}).notNull(),
  vinculado_at:timestamp("vinculado_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const control_riesgo=pmo.table("control_riesgo",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  nombre:text("nombre").notNull(),
  descripcion:text("descripcion").notNull(),
  tipo_control:text("tipo_control"),
  responsable_id:bigint("responsable_id",{mode:'bigint'}),
  frecuencia:text("frecuencia"),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const delegacion_acceso=pmo.table("delegacion_acceso",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  tipo:text("tipo").default(sql.raw("'SUPLENCIA_PM'::text")).notNull(),
  delegante_id:bigint("delegante_id",{mode:'bigint'}).notNull(),
  delegado_id:bigint("delegado_id",{mode:'bigint'}).notNull(),
  autorizado_por_id:bigint("autorizado_por_id",{mode:'bigint'}),
  alcance:text("alcance").default(sql.raw("'PROYECTO'::text")).notNull(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  inicio:timestamp("inicio",{withTimezone:true,mode:'date'}).notNull(),
  fin:timestamp("fin",{withTimezone:true,mode:'date'}).notNull(),
  motivo:text("motivo").notNull(),
  estado:text("estado").default(sql.raw("'PENDIENTE'::text")).notNull(),
  revocado_at:timestamp("revocado_at",{withTimezone:true,mode:'date'}),
  revocado_por_id:bigint("revocado_por_id",{mode:'bigint'}),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const delegacion_permiso=pmo.table("delegacion_permiso",{
  delegacion_id:bigint("delegacion_id",{mode:'bigint'}).notNull(),
  permiso_id:bigint("permiso_id",{mode:'bigint'}).notNull(),
});
export const documento=pmo.table("documento",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  tipo_documento_id:bigint("tipo_documento_id",{mode:'bigint'}),
  drive_file_id:text("drive_file_id").notNull(),
  nombre:text("nombre").notNull(),
  mime_type:text("mime_type").notNull(),
  drive_version:bigint("drive_version",{mode:'bigint'}),
  drive_modified_at:timestamp("drive_modified_at",{withTimezone:true,mode:'date'}),
  ultimo_sync_at:timestamp("ultimo_sync_at",{withTimezone:true,mode:'date'}),
  estado_registro:text("estado_registro").default(sql.raw("'VIGENTE'::text")).notNull(),
  created_by:bigint("created_by",{mode:'bigint'}),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const etapa_compra=pmo.table("etapa_compra",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  compra_id:bigint("compra_id",{mode:'bigint'}).notNull(),
  tipo_etapa:text("tipo_etapa").notNull(),
  referencia_documento:text("referencia_documento"),
  estado:text("estado"),
  fecha_registro:timestamp("fecha_registro",{withTimezone:true,mode:'date'}),
});
export const evaluacion_complejidad=pmo.table("evaluacion_complejidad",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  evaluador_id:bigint("evaluador_id",{mode:'bigint'}),
  riesgo:smallint("riesgo").notNull(),
  facturacion:smallint("facturacion").notNull(),
  plazo:smallint("plazo").notNull(),
  alcance:smallint("alcance").notNull(),
  nota_riesgo:text("nota_riesgo"),
  nota_facturacion:text("nota_facturacion"),
  nota_plazo:text("nota_plazo"),
  nota_alcance:text("nota_alcance"),
  indice_complejidad:numeric("indice_complejidad",{precision:2,scale:1}).notNull(),
  tipificacion:text("tipificacion").notNull(),
  override_estrategico:boolean("override_estrategico").default(sql.raw("false")).notNull(),
  motivo_override:text("motivo_override"),
  version_modelo:text("version_modelo").default(sql.raw("'V1'::text")).notNull(),
  fecha_evaluacion:timestamp("fecha_evaluacion",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const evaluacion_riesgo=pmo.table("evaluacion_riesgo",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  riesgo_proyecto_id:bigint("riesgo_proyecto_id",{mode:'bigint'}).notNull(),
  evaluador_id:bigint("evaluador_id",{mode:'bigint'}),
  fecha_evaluacion:timestamp("fecha_evaluacion",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  tipo_evaluacion:text("tipo_evaluacion").notNull(),
  probabilidad:smallint("probabilidad").notNull(),
  impacto:smallint("impacto").notNull(),
  severidad:smallint("severidad").generatedAlwaysAs(sql.raw("(probabilidad * impacto)")),
  justificacion:text("justificacion"),
});
export const evento_proyecto=pmo.table("evento_proyecto",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  actor_id:bigint("actor_id",{mode:'bigint'}),
  tipo_evento:text("tipo_evento").notNull(),
  estado_anterior:text("estado_anterior"),
  estado_nuevo:text("estado_nuevo"),
  motivo:text("motivo"),
  detalle:jsonb("detalle").default(sql.raw("'{}'::jsonb")).notNull(),
  fecha_evento:timestamp("fecha_evento",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const hito_facturacion=pmo.table("hito_facturacion",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  periodo:date("periodo",{mode:'string'}).notNull(),
  tipo_hito:text("tipo_hito"),
  tipo_cuota:text("tipo_cuota"),
  unidad_codigo:varchar("unidad_codigo",{length:3}),
  showprice:numeric("showprice",{precision:20,scale:4}),
  planificado:numeric("planificado",{precision:20,scale:4}),
  real_reportado:numeric("real_reportado",{precision:20,scale:4}),
  estado:text("estado"),
  comentario:text("comentario"),
  origen:text("origen"),
  origen_ref:text("origen_ref"),
  updated_at:timestamp("updated_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const invitacion_workspace=pmo.table("invitacion_workspace",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  workspace_id:bigint("workspace_id",{mode:'bigint'}).notNull(),
  email_destinatario:text("email_destinatario").notNull(),
  invitado_por_id:bigint("invitado_por_id",{mode:'bigint'}).notNull(),
  rol_solicitado_id:bigint("rol_solicitado_id",{mode:'bigint'}),
  puede_crear_proyectos:boolean("puede_crear_proyectos").default(sql.raw("false")).notNull(),
  token_hash:text("token_hash").notNull(),
  estado:text("estado").default(sql.raw("'PENDIENTE'::text")).notNull(),
  expires_at:timestamp("expires_at",{withTimezone:true,mode:'date'}).notNull(),
  accepted_at:timestamp("accepted_at",{withTimezone:true,mode:'date'}),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const item_checklist_documento=pmo.table("item_checklist_documento",{
  item_checklist_id:bigint("item_checklist_id",{mode:'bigint'}).notNull(),
  documento_id:bigint("documento_id",{mode:'bigint'}).notNull(),
  vinculado_at:timestamp("vinculado_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  vinculado_por:bigint("vinculado_por",{mode:'bigint'}),
});
export const item_checklist_proyecto=pmo.table("item_checklist_proyecto",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  tipo_entregable_id:bigint("tipo_entregable_id",{mode:'bigint'}),
  nombre:text("nombre").notNull(),
  orden:integer("orden"),
  obligatorio:boolean("obligatorio").default(sql.raw("true")).notNull(),
  requiere_documento:boolean("requiere_documento").default(sql.raw("false")).notNull(),
  completado:boolean("completado").default(sql.raw("false")).notNull(),
  comentario:text("comentario"),
  completado_por:bigint("completado_por",{mode:'bigint'}),
  completado_at:timestamp("completado_at",{withTimezone:true,mode:'date'}),
});
export const leccion_aprendida=pmo.table("leccion_aprendida",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}),
  autor_id:bigint("autor_id",{mode:'bigint'}),
  fecha:date("fecha",{mode:'string'}),
  titulo:text("titulo").notNull(),
  area:text("area"),
  situacion:text("situacion"),
  impacto:text("impacto"),
  acciones_correctivas:text("acciones_correctivas"),
  leccion:text("leccion").notNull(),
  correo_texto:text("correo_texto"),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  updated_at:timestamp("updated_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const leccion_documento=pmo.table("leccion_documento",{
  leccion_id:bigint("leccion_id",{mode:'bigint'}).notNull(),
  documento_id:bigint("documento_id",{mode:'bigint'}).notNull(),
  vinculado_at:timestamp("vinculado_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const lob=pmo.table("lob",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  nombre:text("nombre").notNull(),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
});
export const membresia_workspace=pmo.table("membresia_workspace",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  workspace_id:bigint("workspace_id",{mode:'bigint'}).notNull(),
  usuario_id:bigint("usuario_id",{mode:'bigint'}).notNull(),
  puede_crear_proyectos:boolean("puede_crear_proyectos").default(sql.raw("false")).notNull(),
  estado:text("estado").default(sql.raw("'ACTIVA'::text")).notNull(),
  incorporado_por_id:bigint("incorporado_por_id",{mode:'bigint'}),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  updated_at:timestamp("updated_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const pais=pmo.table("pais",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  codigo:varchar("codigo",{length:3}).notNull(),
  nombre:text("nombre").notNull(),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
});
export const participacion_proyecto=pmo.table("participacion_proyecto",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  usuario_id:bigint("usuario_id",{mode:'bigint'}).notNull(),
  funcion:text("funcion").notNull(),
  fecha_inicio:timestamp("fecha_inicio",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  fecha_fin:timestamp("fecha_fin",{withTimezone:true,mode:'date'}),
});
export const permiso=pmo.table("permiso",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  codigo:text("codigo").notNull(),
  descripcion:text("descripcion").notNull(),
  delegable:boolean("delegable").default(sql.raw("false")).notNull(),
});
export const proveedor=pmo.table("proveedor",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  nombre:text("nombre").notNull(),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  updated_at:timestamp("updated_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const proyecto=pmo.table("proyecto",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  tvt:text("tvt").notNull(),
  tvt_normalizado:text("tvt_normalizado").generatedAlwaysAs(sql.raw("upper(regexp_replace(btrim(tvt), '[[:space:]]+'::text, ''::text, 'g'::text))")),
  workspace_id:bigint("workspace_id",{mode:'bigint'}).notNull(),
  creado_por_id:bigint("creado_por_id",{mode:'bigint'}).notNull(),
  version:bigint("version",{mode:'bigint'}).default(sql.raw("1")).notNull(),
  cliente_id:bigint("cliente_id",{mode:'bigint'}).notNull(),
  pais_id:bigint("pais_id",{mode:'bigint'}).notNull(),
  lob_id:bigint("lob_id",{mode:'bigint'}).notNull(),
  squad_id:bigint("squad_id",{mode:'bigint'}),
  nombre:text("nombre").notNull(),
  descripcion:text("descripcion"),
  situacion_inicial:text("situacion_inicial"),
  estado_actual:text("estado_actual").default(sql.raw("'Requiere P1P2'::text")).notNull(),
  fecha_recepcion_p1p2:date("fecha_recepcion_p1p2",{mode:'string'}),
  fecha_inicio:date("fecha_inicio",{mode:'string'}),
  fecha_termino_baseline:date("fecha_termino_baseline",{mode:'string'}),
  fecha_termino_actual:date("fecha_termino_actual",{mode:'string'}),
  drive_folder_id:text("drive_folder_id"),
  referencia_sap:text("referencia_sap"),
  referencia_ceco:text("referencia_ceco"),
  referencia_pep:text("referencia_pep"),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  updated_at:timestamp("updated_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const proyecto_contacto=pmo.table("proyecto_contacto",{
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  contacto_id:bigint("contacto_id",{mode:'bigint'}).notNull(),
  cliente_id:bigint("cliente_id",{mode:'bigint'}).notNull(),
  rol_contacto:text("rol_contacto").notNull(),
});
export const proyecto_documento=pmo.table("proyecto_documento",{
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  documento_id:bigint("documento_id",{mode:'bigint'}).notNull(),
  vinculado_at:timestamp("vinculado_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  vinculado_por:bigint("vinculado_por",{mode:'bigint'}),
});
export const proyecto_servicio_lob=pmo.table("proyecto_servicio_lob",{
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  servicio_lob_id:bigint("servicio_lob_id",{mode:'bigint'}).notNull(),
  lob_id:bigint("lob_id",{mode:'bigint'}).notNull(),
});
export const registro_notificacion=pmo.table("registro_notificacion",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  usuario_destinatario_id:bigint("usuario_destinatario_id",{mode:'bigint'}),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}),
  destinatario_email:text("destinatario_email").notNull(),
  tipo:text("tipo").notNull(),
  canal:text("canal").default(sql.raw("'EMAIL'::text")).notNull(),
  asunto:text("asunto").notNull(),
  estado_envio:text("estado_envio").default(sql.raw("'PENDIENTE'::text")).notNull(),
  creado_at:timestamp("creado_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  enviado_at:timestamp("enviado_at",{withTimezone:true,mode:'date'}),
  error_detalle:text("error_detalle"),
});
export const riesgo_control_riesgo=pmo.table("riesgo_control_riesgo",{
  riesgo_proyecto_id:bigint("riesgo_proyecto_id",{mode:'bigint'}).notNull(),
  control_riesgo_id:bigint("control_riesgo_id",{mode:'bigint'}).notNull(),
  observaciones:text("observaciones"),
});
export const riesgo_global=pmo.table("riesgo_global",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  nombre:text("nombre").notNull(),
  descripcion:text("descripcion"),
  categoria:text("categoria"),
  probabilidad_sugerida:smallint("probabilidad_sugerida"),
  impacto_sugerido:smallint("impacto_sugerido"),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const riesgo_proyecto=pmo.table("riesgo_proyecto",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  riesgo_global_id:bigint("riesgo_global_id",{mode:'bigint'}),
  responsable_id:bigint("responsable_id",{mode:'bigint'}),
  nombre:text("nombre").notNull(),
  descripcion:text("descripcion"),
  categoria:text("categoria"),
  estado:text("estado").default(sql.raw("'Pendiente'::text")).notNull(),
  estrategia:text("estrategia"),
  plan_mitigacion:text("plan_mitigacion"),
  plan_contingencia:text("plan_contingencia"),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  updated_at:timestamp("updated_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const rol=pmo.table("rol",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  codigo:varchar("codigo",{length:30}).notNull(),
  nombre:text("nombre").notNull(),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
});
export const rol_permiso=pmo.table("rol_permiso",{
  rol_id:bigint("rol_id",{mode:'bigint'}).notNull(),
  permiso_id:bigint("permiso_id",{mode:'bigint'}).notNull(),
});
export const seguimiento_proyecto=pmo.table("seguimiento_proyecto",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  registrado_por:bigint("registrado_por",{mode:'bigint'}),
  fecha_registro:date("fecha_registro",{mode:'string'}).notNull(),
  avance_planificado:numeric("avance_planificado",{precision:5,scale:2}).notNull(),
  avance_real:numeric("avance_real",{precision:5,scale:2}).notNull(),
  actividades:text("actividades"),
  proximos_pasos:text("proximos_pasos"),
  observaciones:text("observaciones"),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const servicio_lob=pmo.table("servicio_lob",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  lob_id:bigint("lob_id",{mode:'bigint'}).notNull(),
  nombre:text("nombre").notNull(),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
});
export const servicio_operativo=pmo.table("servicio_operativo",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  fecha_inicio:date("fecha_inicio",{mode:'string'}),
  fecha_termino:date("fecha_termino",{mode:'string'}),
  meses_servicio:integer("meses_servicio"),
  observaciones:text("observaciones"),
});
export const solicitud_cambio_planificacion=pmo.table("solicitud_cambio_planificacion",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  control_cambio_id:bigint("control_cambio_id",{mode:'bigint'}),
  solicitante_id:bigint("solicitante_id",{mode:'bigint'}).notNull(),
  aprobador_id:bigint("aprobador_id",{mode:'bigint'}),
  campo:text("campo").notNull(),
  valor_anterior:date("valor_anterior",{mode:'string'}).notNull(),
  valor_propuesto:date("valor_propuesto",{mode:'string'}).notNull(),
  es_excepcion:boolean("es_excepcion").default(sql.raw("false")).notNull(),
  justificacion:text("justificacion"),
  estado:text("estado").default(sql.raw("'PENDIENTE'::text")).notNull(),
  fecha_solicitud:timestamp("fecha_solicitud",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  fecha_resolucion:timestamp("fecha_resolucion",{withTimezone:true,mode:'date'}),
});
export const squad=pmo.table("squad",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  nombre:text("nombre").notNull(),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
});
export const tipo_documento=pmo.table("tipo_documento",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  codigo:text("codigo").notNull(),
  nombre:text("nombre").notNull(),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
});
export const tipo_entregable=pmo.table("tipo_entregable",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  nombre:text("nombre").notNull(),
  descripcion:text("descripcion"),
  orden:integer("orden"),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
});
export const unidad_monetaria=pmo.table("unidad_monetaria",{
  codigo:varchar("codigo",{length:3}).notNull().primaryKey(),
  clase:text("clase").notNull(),
});
export const usuario=pmo.table("usuario",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  email:text("email").notNull(),
  nombre:text("nombre").notNull(),
  password_hash:text("password_hash"),
  refresh_token_hash:text("refresh_token_hash"),
  refresh_expires_at:timestamp("refresh_expires_at",{withTimezone:true,mode:'date'}),
  recovery_token_hash:text("recovery_token_hash"),
  recovery_expires_at:timestamp("recovery_expires_at",{withTimezone:true,mode:'date'}),
  failed_login_count:integer("failed_login_count").default(sql.raw("0")).notNull(),
  locked_until:timestamp("locked_until",{withTimezone:true,mode:'date'}),
  session_version:bigint("session_version",{mode:'bigint'}).default(sql.raw("1")).notNull(),
  tipo_usuario:text("tipo_usuario").default(sql.raw("'INTERNO'::text")).notNull(),
  contacto_cliente_id:bigint("contacto_cliente_id",{mode:'bigint'}),
  activo:boolean("activo").default(sql.raw("true")).notNull(),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  updated_at:timestamp("updated_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
export const validacion_cierre=pmo.table("validacion_cierre",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  proyecto_id:bigint("proyecto_id",{mode:'bigint'}).notNull(),
  validador_id:bigint("validador_id",{mode:'bigint'}),
  fecha_validacion:timestamp("fecha_validacion",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  checklist_ok:boolean("checklist_ok"),
  documentos_ok:boolean("documentos_ok"),
  riesgos_ok:boolean("riesgos_ok"),
  lecciones_ok:boolean("lecciones_ok"),
  resultado:text("resultado").notNull(),
  observaciones:text("observaciones"),
});
export const workspace=pmo.table("workspace",{
  id:bigint("id",{mode:'bigint'}).generatedAlwaysAsIdentity().notNull().primaryKey(),
  nombre:text("nombre").notNull(),
  slug:text("slug").notNull(),
  creado_por_id:bigint("creado_por_id",{mode:'bigint'}).notNull(),
  estado:text("estado").default(sql.raw("'ACTIVO'::text")).notNull(),
  version:bigint("version",{mode:'bigint'}).default(sql.raw("1")).notNull(),
  created_at:timestamp("created_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
  updated_at:timestamp("updated_at",{withTimezone:true,mode:'date'}).default(sql.raw("now()")).notNull(),
});
