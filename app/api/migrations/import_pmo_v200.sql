-- Copia explícita de sintéticos: nunca UPDATE/DELETE/TRUNCATE sobre pmo.
INSERT INTO pmo_cusn.pais(codigo,nombre)
SELECT v.codigo,v.nombre FROM (VALUES ('CL','Chile'),('CO','Colombia'),('PE','Perú'),('AR','Argentina'),('BR','Brasil'),('PY','Paraguay'),('MX','México'),('PA','Panama')) v(codigo,nombre)
WHERE EXISTS(SELECT 1 FROM pmo.catalogo_valor c WHERE upper(c.tipo)='PAIS' AND c.valor=v.nombre)
   OR EXISTS(SELECT 1 FROM pmo.proyecto p WHERE p.pais=v.nombre);
INSERT INTO pmo_cusn.lob(nombre)
SELECT lob FROM pmo.proyecto WHERE lob IS NOT NULL UNION SELECT valor FROM pmo.catalogo_valor WHERE upper(tipo)='LOB';
INSERT INTO pmo_cusn.squad(nombre)
SELECT squad FROM pmo.proyecto WHERE squad IS NOT NULL UNION SELECT valor FROM pmo.catalogo_valor WHERE upper(tipo)='SQUAD';
INSERT INTO pmo_cusn.servicio_lob(lob_id,nombre)
SELECT DISTINCT l.id,p.servicio_lob FROM pmo.proyecto p JOIN pmo_cusn.lob l ON l.nombre=p.lob WHERE nullif(btrim(p.servicio_lob),'') IS NOT NULL;
INSERT INTO pmo_cusn.cliente(id,nombre,sector,descripcion) OVERRIDING SYSTEM VALUE
SELECT id,nombre,sector_industria,descripcion FROM pmo.cliente;
INSERT INTO pmo_cusn.proveedor(id,nombre) OVERRIDING SYSTEM VALUE SELECT id,nombre FROM pmo.proveedor;
INSERT INTO pmo_cusn.usuario(id,email,nombre) OVERRIDING SYSTEM VALUE
SELECT id,email_corporativo,nombre FROM pmo.especialista WHERE email_corporativo IS NOT NULL;
INSERT INTO pmo_cusn.proyecto(id,tvt,cliente_id,pais_id,lob_id,squad_id,nombre,situacion_inicial,estado_actual,fecha_recepcion_p1p2,fecha_inicio,fecha_termino_baseline,fecha_termino_actual,referencia_sap,referencia_ceco,referencia_pep,activo,created_at,updated_at) OVERRIDING SYSTEM VALUE
SELECT p.id,p.tvt,p.cliente_id,pa.id,l.id,sq.id,p.nombre,p.situacion_inicial,
  CASE e.nombre WHEN 'En ejecucion' THEN 'En ejecución' WHEN 'En Transición' THEN 'En transición' ELSE e.nombre END,
  p.fecha_recepcion_p1p2,s.fecha_inicio_proyecto,CASE WHEN p.fecha_termino_baseline<s.fecha_inicio_proyecto THEN NULL ELSE p.fecha_termino_baseline END,s.fecha_termino_proyecto,p.sap,p.ceco,p.pep,p.activo,coalesce(p.creado_at,now()),coalesce(p.actualizado_at,now())
FROM pmo.proyecto p JOIN pmo_cusn.pais pa ON pa.nombre=p.pais JOIN pmo_cusn.lob l ON l.nombre=p.lob
LEFT JOIN pmo_cusn.squad sq ON sq.nombre=p.squad JOIN pmo.proyecto_estado_actual s ON s.proyecto_id=p.id JOIN pmo.estado_proyecto e ON e.id=s.estado_proyecto_id;
INSERT INTO pmo_cusn.proyecto_servicio_lob(proyecto_id,servicio_lob_id,lob_id)
SELECT p.id,s.id,l.id FROM pmo.proyecto p JOIN pmo_cusn.lob l ON l.nombre=p.lob JOIN pmo_cusn.servicio_lob s ON s.lob_id=l.id AND s.nombre=p.servicio_lob;
INSERT INTO pmo_cusn.contacto_cliente(cliente_id,nombre,email,telefono)
SELECT DISTINCT cliente_id,contraparte_cliente,correo_cliente,telefono_cliente FROM pmo.proyecto WHERE nullif(btrim(contraparte_cliente),'') IS NOT NULL;
INSERT INTO pmo_cusn.proyecto_contacto(proyecto_id,contacto_id,cliente_id,rol_contacto)
SELECT p.id,c.id,c.cliente_id,'Contraparte' FROM pmo.proyecto p JOIN pmo_cusn.contacto_cliente c ON c.cliente_id=p.cliente_id AND c.nombre=p.contraparte_cliente AND c.email IS NOT DISTINCT FROM p.correo_cliente AND c.telefono IS NOT DISTINCT FROM p.telefono_cliente;
INSERT INTO pmo_cusn.participacion_proyecto(proyecto_id,usuario_id,funcion)
SELECT p.id,u.id,'PM' FROM pmo.proyecto p JOIN pmo_cusn.usuario u ON u.nombre=p.gestor_nombre
WHERE (SELECT count(*) FROM pmo_cusn.usuario x WHERE x.nombre=p.gestor_nombre)=1;
INSERT INTO pmo_cusn.seguimiento_proyecto(proyecto_id,fecha_registro,avance_planificado,avance_real,actividades,proximos_pasos,created_at)
SELECT proyecto_id,coalesce(fecha_registro_avance,actualizado_at::date),avance_planificado_pct,avance_real_pct,actividades,proximos_pasos,coalesce(actualizado_at,now()) FROM pmo.proyecto_estado_actual
WHERE avance_planificado_pct BETWEEN 0 AND 100 AND avance_real_pct BETWEEN 0 AND 100 AND coalesce(fecha_registro_avance,actualizado_at::date) IS NOT NULL;
INSERT INTO pmo_cusn.servicio_operativo(proyecto_id,fecha_inicio,fecha_termino,meses_servicio)
SELECT proyecto_id,fecha_inicio_operacion,fecha_termino_operacion,meses_servicio::integer FROM pmo.proyecto_estado_actual
WHERE operacion_no_aplica IS FALSE AND (meses_servicio IS NULL OR (meses_servicio>0 AND meses_servicio=trunc(meses_servicio)));
INSERT INTO pmo_cusn.condicion_comercial(proyecto_id,tcv_tipo,tcv_valor,unidad_codigo)
SELECT id,'DEFINIDO',tcv,tcv_unidad_codigo FROM pmo.proyecto WHERE tcv>=0 AND tcv_unidad_codigo IS NOT NULL;
INSERT INTO pmo_cusn.hito_facturacion(id,proyecto_id,periodo,tipo_hito,tipo_cuota,unidad_codigo,showprice,planificado,real_reportado,estado,comentario,origen,origen_ref,updated_at) OVERRIDING SYSTEM VALUE
SELECT id,proyecto_id,periodo_mes,tipo,cuota,unidad_codigo,showprice,importe_planificado,importe_real,estado,comentario,origen,origen_ref,coalesce(actualizado_at,now()) FROM pmo.facturacion;
INSERT INTO pmo_cusn.compra(id,proyecto_id,proveedor_id,concepto,descripcion,tipo_gasto,unidad_codigo,fecha_solicitud,monto_adjudicado,valor_setup,valor_recurrente,meses_recurrentes,observaciones,created_at) OVERRIDING SYSTEM VALUE
SELECT id,proyecto_id,proveedor_id,concepto,descripcion,upper(clasificacion_capex_opex),unidad_codigo,fecha_compra,monto_adjudicado,valor_setup,valor_recurrente,meses_recurrente,observaciones,coalesce(creado_at,now()) FROM pmo.compra;
INSERT INTO pmo_cusn.etapa_compra(compra_id,tipo_etapa,referencia_documento,estado,fecha_registro)
SELECT c.id,v.tipo,v.ref,v.estado,v.fecha FROM pmo.compra c CROSS JOIN LATERAL (VALUES
  ('BORP',c.borp,NULL::text,c.fecha_borp),('SOLPED',c.solped,c.estatus_solped,c.fecha_solped),('OC',c.orden_compra,c.estatus_oc,c.fecha_orden_compra),('CONFORMIDAD',c.conformidad,NULL::text,c.fecha_conformidad)
) v(tipo,ref,estado,fecha) WHERE v.ref IS NOT NULL OR v.fecha IS NOT NULL;
INSERT INTO pmo_cusn.riesgo_global(id,nombre,descripcion,categoria,probabilidad_sugerida,impacto_sugerido,created_at) OVERRIDING SYSTEM VALUE
SELECT id,nombre,causa_potencial,categoria,probabilidad,impacto,coalesce(creado_at,now()) FROM pmo.riesgo_global;
INSERT INTO pmo_cusn.riesgo_proyecto(id,proyecto_id,riesgo_global_id,responsable_id,nombre,descripcion,categoria,estado,estrategia,plan_mitigacion,plan_contingencia,created_at,updated_at) OVERRIDING SYSTEM VALUE
SELECT r.id,r.proyecto_id,r.riesgo_global_id,(SELECT min(u.id) FROM pmo_cusn.usuario u WHERE u.nombre=r.responsable_nombre HAVING count(*)=1),r.nombre,r.causa_potencial,r.categoria,r.estado,r.estrategia,r.plan_mitigacion,r.plan_contingencia,coalesce(r.creado_at,now()),coalesce(r.actualizado_at,now()) FROM pmo.riesgo_proyecto r;
INSERT INTO pmo_cusn.evaluacion_riesgo(riesgo_proyecto_id,fecha_evaluacion,tipo_evaluacion,probabilidad,impacto)
SELECT id,coalesce(actualizado_at,creado_at,now()),'INICIAL',probabilidad,impacto FROM pmo.riesgo_proyecto WHERE probabilidad IS NOT NULL AND impacto IS NOT NULL;
INSERT INTO pmo_cusn.control_riesgo(nombre,descripcion) SELECT DISTINCT control_actual,control_actual FROM pmo.riesgo_proyecto WHERE nullif(btrim(control_actual),'') IS NOT NULL;
INSERT INTO pmo_cusn.riesgo_control_riesgo(riesgo_proyecto_id,control_riesgo_id)
SELECT r.id,c.id FROM pmo.riesgo_proyecto r JOIN pmo_cusn.control_riesgo c ON c.nombre=r.control_actual;
INSERT INTO pmo_cusn.control_cambio(id,proyecto_id,secuencia,folio,fecha_elaboracion,descripcion,justificacion,urgencia,estado_firma,estado_aprobacion,impacto_monetario,tipo_impacto,unidad_codigo,created_at) OVERRIDING SYSTEM VALUE
SELECT id,proyecto_id,secuencia,folio,fecha_elaboracion,descripcion,justificacion,upper(urgencia),CASE firmado WHEN 'Sí' THEN 'FIRMADO' WHEN 'Notificado' THEN 'NOTIFICADO' ELSE 'PENDIENTE' END,upper(aprobacion),costo,CASE costo_tipo WHEN 'Beneficio' THEN 'BENEFICIO' WHEN 'Costo TIVIT' THEN 'COSTO_TIVIT' END,costo_unidad_codigo,coalesce(creado_at,now()) FROM pmo.solicitud_cambio;
INSERT INTO pmo_cusn.cambio_ambito(control_cambio_id,ambito_id)
SELECT s.solicitud_cambio_id,a.id FROM pmo.solicitud_cambio_ambito s JOIN pmo_cusn.ambito_cambio a ON a.nombre=s.ambito;
INSERT INTO pmo_cusn.evaluacion_complejidad(proyecto_id,riesgo,facturacion,plazo,alcance,nota_riesgo,nota_facturacion,nota_plazo,nota_alcance,indice_complejidad,tipificacion,override_estrategico,motivo_override,fecha_evaluacion)
SELECT proyecto_id,factor_riesgo::smallint,factor_facturacion::smallint,factor_plazo::smallint,factor_alcance::smallint,nota_riesgo,nota_facturacion,nota_plazo,nota_alcance,indice_complejidad,translate(upper(tipificacion),'É','E'),coalesce(override_estrategico,false),nota_override,coalesce(actualizado_at,now()) FROM pmo.proyecto_complejidad
WHERE indice_complejidad=round(factor_riesgo::numeric*0.35+factor_facturacion::numeric*0.20+factor_plazo::numeric*0.15+factor_alcance::numeric*0.30,1)
AND (NOT coalesce(override_estrategico,false) OR nullif(btrim(nota_override),'') IS NOT NULL);
INSERT INTO pmo_cusn.compromiso(id,pais_id,responsable_texto,titulo,descripcion,alcance,completado,created_at) OVERRIDING SYSTEM VALUE
SELECT c.id,p.id,c.responsable,c.titulo,c.descripcion,CASE WHEN c.pais IS NULL THEN 'GLOBAL' ELSE 'PAIS' END,c.completado,coalesce(c.creado_at,now()) FROM pmo.compromiso c LEFT JOIN pmo_cusn.pais p ON p.nombre=c.pais;
INSERT INTO pmo_cusn.evento_proyecto(id,proyecto_id,tipo_evento,detalle,fecha_evento) OVERRIDING SYSTEM VALUE
SELECT id,proyecto_id,tipo_evento,jsonb_build_object('origen','pmo.proyecto_evento','contenido',contenido,'usuarioEmailOrigen',usuario_email),coalesce(registrado_at,now()) FROM pmo.proyecto_evento;
INSERT INTO pmo_cusn.validacion_cierre(proyecto_id,resultado,observaciones)
SELECT id,'SIN_EVIDENCIA_HISTORICA','Estado histórico migrado; sin validación de evidencia' FROM pmo_cusn.proyecto WHERE estado_actual IN ('Cerrado exitoso','Cerrado con observaciones');
-- Identidades conservadas; posicionar cada secuencia propia sin tocar las de pmo.
DO $$ DECLARE t record; seq text; m bigint; BEGIN
  FOR t IN SELECT table_name FROM information_schema.columns WHERE table_schema='pmo_cusn' AND column_name='id' AND is_identity='YES' LOOP
    seq:=pg_get_serial_sequence('pmo_cusn.'||quote_ident(t.table_name),'id');
    EXECUTE format('SELECT max(id) FROM pmo_cusn.%I',t.table_name) INTO m;
    PERFORM setval(seq,coalesce(m,1),m IS NOT NULL);
  END LOOP;
END $$;
