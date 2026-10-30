-- Semilla sintética del laboratorio GPL. Derivada de fixtures públicos ficticios.
-- No contiene datos corporativos, CSV ni registros de localStorage.
SET search_path TO pmo, public;

INSERT INTO estado_proyecto (nombre, es_cierre, requiere_documentacion) VALUES
  ('En ejecución', false, false),
  ('En transición', false, false),
  ('Detenido', false, false),
  ('Requiere P1P2', false, false),
  ('Cancelado', true, false),
  ('Terminado', true, true)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cliente (id, nombre, sector_industria, descripcion) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Grupo Prisma', 'Retail y consumo', 'Antiguo'),
  (2, 'Neova Retail', 'Retail', 'Antiguo'),
  (3, 'Vertex Salud', 'Salud', 'Nuevo'),
  (4, 'Delta Servicios', 'Servicios financieros', 'Antiguo'),
  (5, 'Aurora Logística', 'Logística', 'Antiguo'),
  (6, 'Campo Norte', 'Agroindustria', 'Nuevo'),
  (7, 'Solventa', 'Energía', 'Antiguo'),
  (8, 'Círculo Digital', 'Medios digitales', 'Antiguo');

INSERT INTO proyecto (id, tvt, tvt_key_origen, nombre, cliente_id, estado_cliente, pais, lob, servicio_lob, squad, gestor_nombre, preventa, tam, sdm, account_manager, sap, ceco, pep, tcv, tcv_unidad_codigo, fecha_recepcion_p1p2, fecha_termino_baseline, situacion_inicial, lideres_tecnicos, activo, creado_at, actualizado_at, creado_por, actualizado_por) OVERRIDING SYSTEM VALUE VALUES
  (1, 'PRJ-001', 'ATL-26', 'Implementación Atlas', 1, 'Antiguo', 'Perú', 'LOB-DIG', 'SVC-INT', 'SQ-INT', 'María Torres', 'Elena Suárez', 'Javier Molina', 'Renata Silva', 'Mateo Cárdenas', 'EJ-SAP-101', 'EJ-CC-201', 'EJ-PEP-301', 940000, 'PEN', '2026-01-05', '2026-11-14', 'Implementación de una plataforma unificada de conciliación y pagos para la operación retail.', 'Andrés Salinas', true, '2026-01-12T12:00:00Z', '2026-10-18T12:00:00Z', 'seed-lab', 'seed-lab'),
  (2, 'PRJ-002', 'NBL-26', 'Migración Nébula', 2, 'Antiguo', 'Chile', 'LOB-CLD', 'SVC-MIG', 'SQ-DAT', 'María Torres', 'Elena Suárez', 'Javier Molina', 'Renata Silva', 'Mateo Cárdenas', 'EJ-SAP-102', 'EJ-CC-202', 'EJ-PEP-302', 480000000, 'CLP', '2026-02-23', '2026-11-30', 'Migración del núcleo transaccional a una arquitectura cloud con continuidad operativa.', 'Paula Quispe', true, '2026-03-02T12:00:00Z', '2026-10-19T12:00:00Z', 'seed-lab', 'seed-lab'),
  (3, 'PRJ-003', 'HOR-26', 'Plataforma Horizonte', 3, 'Nuevo', 'Perú', 'LOB-DIG', 'SVC-DAT', 'SQ-DAT', 'Lucía Medina', 'Elena Suárez', 'Javier Molina', 'Renata Silva', 'Mateo Cárdenas', 'EJ-SAP-103', 'EJ-CC-203', 'EJ-PEP-303', 430000, 'PEN', '2026-03-30', '2026-12-18', 'Habilitación de una plataforma clínica integrada para la red de centros de atención.', 'Paula Quispe', true, '2026-04-06T12:00:00Z', '2026-10-17T12:00:00Z', 'seed-lab', 'seed-lab'),
  (4, 'PRJ-004', 'ORB-26', 'Modernización Órbita', 4, 'Antiguo', 'Colombia', 'LOB-OPS', 'SVC-TRA', 'SQ-OPS', 'Sebastián Prado', 'Elena Suárez', 'Javier Molina', 'Renata Silva', 'Mateo Cárdenas', 'EJ-SAP-104', 'EJ-CC-204', 'EJ-PEP-304', 890000000, 'COP', '2025-10-27', '2026-11-09', 'Modernización del sistema de originación y cierre de transición operativa.', 'Andrés Salinas', true, '2025-11-03T12:00:00Z', '2026-10-16T12:00:00Z', 'seed-lab', 'seed-lab'),
  (5, 'PRJ-005', 'SOL-26', 'Integración Solaris', 5, 'Antiguo', 'Chile', 'LOB-DIG', 'SVC-INT', 'SQ-INT', 'Camila Ríos', 'Elena Suárez', 'Javier Molina', 'Renata Silva', 'Mateo Cárdenas', 'EJ-SAP-105', 'EJ-CC-205', 'EJ-PEP-305', 360000000, 'CLP', '2026-05-11', '2026-12-22', 'Integración de interfaces logísticas y certificación de intercambio con socios de transporte.', 'Andrés Salinas', true, '2026-05-18T12:00:00Z', '2026-10-18T12:00:00Z', 'seed-lab', 'seed-lab'),
  (6, 'PRJ-006', 'LUM-26', 'Despliegue Lumen', 6, 'Nuevo', 'Perú', 'LOB-OPS', 'SVC-TRA', 'SQ-OPS', 'Diego Fuentes', 'Elena Suárez', 'Javier Molina', 'Renata Silva', 'Mateo Cárdenas', 'EJ-SAP-106', 'EJ-CC-206', 'EJ-PEP-306', 250000, 'PEN', '2026-02-09', '2026-11-15', 'Despliegue de la nueva cadena de suministro digital en las operaciones de campo.', 'Andrés Salinas', true, '2026-02-16T12:00:00Z', '2026-10-15T12:00:00Z', 'seed-lab', 'seed-lab'),
  (7, 'PRJ-007', 'BOR-26', 'Infraestructura Boreal', 7, 'Antiguo', 'Colombia', 'LOB-CLD', 'SVC-INF', 'SQ-OPS', 'Luis Vega', 'Elena Suárez', 'Javier Molina', 'Renata Silva', 'Mateo Cárdenas', 'EJ-SAP-107', 'EJ-CC-207', 'EJ-PEP-307', 650000000, 'COP', NULL, '2027-01-20', 'Habilitación de infraestructura regional de cómputo y respaldo para la operación energética.', 'Andrés Salinas', true, '2026-10-05T12:00:00Z', '2026-10-14T12:00:00Z', 'seed-lab', 'seed-lab'),
  (8, 'PRJ-008', 'AND-26', 'Programa Andrómeda', 8, 'Antiguo', 'Perú', 'LOB-DIG', 'SVC-DAT', 'SQ-DAT', 'Camila Ríos', 'Elena Suárez', 'Javier Molina', 'Renata Silva', 'Mateo Cárdenas', 'EJ-SAP-108', 'EJ-CC-208', 'EJ-PEP-308', 540000, 'PEN', '2026-01-19', '2026-11-04', 'Programa de evolución de la experiencia digital y entrega de releases incrementales.', 'Paula Quispe', true, '2026-01-26T12:00:00Z', '2026-10-19T12:00:00Z', 'seed-lab', 'seed-lab');

SELECT setval(pg_get_serial_sequence('pmo.cliente','id'), (SELECT max(id) FROM pmo.cliente), true);
SELECT setval(pg_get_serial_sequence('pmo.proyecto','id'), (SELECT max(id) FROM pmo.proyecto), true);

INSERT INTO proyecto_estado_actual (proyecto_id, estado_proyecto_id, fecha_registro_avance, avance_planificado_pct, avance_real_pct, spi_pct, fecha_inicio_proyecto, fecha_termino_proyecto, plazo_meses, operacion_no_aplica, meses_servicio, fecha_inicio_operacion, fecha_termino_operacion, margen_pct, estado_facturacion, facturacion_unidad_codigo, actividades, proximos_pasos, lecciones_resumen, checklist_entregables, terminado_fecha, terminado_mes, termino_real_base, actualizado_at, actualizado_por)
SELECT p.id, e.id, v.fecha_registro::date, v.plan, v.real,
       CASE WHEN v.plan > 0 THEN round(v.real::numeric / v.plan::numeric * 100, 4) ELSE NULL END,
       v.inicio::date, v.termino::date,
       round((v.termino::date - v.inicio::date) / 30.4375, 2),
       true, NULL, NULL, NULL, NULL, NULL, v.unidad, v.actividades, v.proximos, NULL, NULL, NULL, NULL, NULL, v.actualizado::timestamptz, 'seed-lab'
FROM (VALUES
  ('PRJ-001', 'En ejecución', '2026-10-18', 78, 68, '2026-01-12', '2026-11-14', 'PEN', 'Fase 2 en ejecución; la validación de alcance sigue pendiente y una revisión de riesgo está vencida.', 'Validación de alcance de Fase 2 · 2026-10-16', '2026-10-18T12:00:00Z'),
  ('PRJ-002', 'En ejecución', '2026-10-19', 82, 79, '2026-03-02', '2026-11-30', 'CLP', 'Migración de datos maestros en curso con ventana de producción anticipada bajo evaluación.', 'Migración de datos maestros · 2026-10-22', '2026-10-19T12:00:00Z'),
  ('PRJ-003', 'En ejecución', '2026-10-17', 62, 47, '2026-04-06', '2026-12-18', 'PEN', 'Habilitación del módulo clínico con capacidad de especialistas críticos bajo seguimiento.', 'Habilitación del módulo clínico · 2026-10-30', '2026-10-17T12:00:00Z'),
  ('PRJ-004', 'En transición', '2026-10-16', 100, 100, '2025-11-03', '2026-11-09', 'COP', 'Transición operativa en curso con cierre documental planificado.', 'Cierre de transición operativa · 2026-11-09', '2026-10-16T12:00:00Z'),
  ('PRJ-005', 'En ejecución', '2026-10-18', 55, 51, '2026-05-18', '2026-12-22', 'CLP', 'Certificación de interfaz logística en preparación para la ventana de diciembre.', 'Certificación de interfaz logística · 2026-10-25', '2026-10-18T12:00:00Z'),
  ('PRJ-006', 'Detenido', '2026-10-15', 60, 40, '2026-02-16', '2026-11-15', 'PEN', 'Despliegue suspendido por decisión del comité; el plan de reanudación está en revisión.', 'Reanudación del despliegue piloto · 2026-10-10', '2026-10-15T12:00:00Z'),
  ('PRJ-007', 'Requiere P1P2', '2026-10-14', 0, 0, '2026-10-05', '2027-01-20', 'COP', 'Pendiente de aprobación P1P2 para iniciar la movilización del equipo.', 'Aprobación P1P2 · 2026-10-28', '2026-10-14T12:00:00Z'),
  ('PRJ-008', 'En ejecución', '2026-10-19', 88, 89, '2026-01-26', '2026-11-04', 'PEN', 'Release 3 en preparación con entrega prevista para inicios de noviembre.', 'Entrega de release 3 · 2026-11-04', '2026-10-19T12:00:00Z')
) AS v(tvt, estado, fecha_registro, plan, real, inicio, termino, unidad, actividades, proximos, actualizado)
JOIN pmo.proyecto p ON p.tvt = v.tvt
JOIN pmo.estado_proyecto e ON e.nombre = v.estado;

INSERT INTO proyecto_evento (proyecto_id, tvt_key_origen, tvt_origen, registrado_at, tipo_evento, contenido, usuario_email) VALUES
  (1, 'ATL-26', 'PRJ-001', '2026-09-15T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":20,"avanceRealPct":18,"nota":"Corte quincenal de avance de la Fase 1.","reportadoPor":"USR-001"}'::jsonb, 'USR-001'),
  (1, 'ATL-26', 'PRJ-001', '2026-09-22T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":35,"avanceRealPct":30,"nota":"Avance de la Fase 1 con desvío acumulado.","reportadoPor":"USR-001"}'::jsonb, 'USR-001'),
  (1, 'ATL-26', 'PRJ-001', '2026-10-01T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":48,"avanceRealPct":41,"nota":"Cierre parcial de conciliación de pagos.","reportadoPor":"USR-001"}'::jsonb, 'USR-001'),
  (1, 'ATL-26', 'PRJ-001', '2026-10-11T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":63,"avanceRealPct":54,"nota":"Avance con dependencia de proveedor aún abierta.","reportadoPor":"USR-001"}'::jsonb, 'USR-001'),
  (1, 'ATL-26', 'PRJ-001', '2026-10-18T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":78,"avanceRealPct":68,"nota":"Corte previo a la validación de alcance de la Fase 2.","reportadoPor":"USR-001"}'::jsonb, 'USR-001'),
  (2, 'NBL-26', 'PRJ-002', '2026-10-11T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":78,"avanceRealPct":75,"nota":"Preparación de la migración de datos maestros.","reportadoPor":"USR-001"}'::jsonb, 'USR-001'),
  (2, 'NBL-26', 'PRJ-002', '2026-10-19T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":82,"avanceRealPct":79,"nota":"Último corte antes de la ventana de producción.","reportadoPor":"USR-001"}'::jsonb, 'USR-001'),
  (3, 'HOR-26', 'PRJ-003', '2026-10-09T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":58,"avanceRealPct":44,"nota":"Avance condicionado por disponibilidad de especialistas.","reportadoPor":"USR-002"}'::jsonb, 'USR-002'),
  (3, 'HOR-26', 'PRJ-003', '2026-10-17T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":62,"avanceRealPct":47,"nota":"Habilitación clínica con desvío acumulado.","reportadoPor":"USR-002"}'::jsonb, 'USR-002'),
  (4, 'ORB-26', 'PRJ-004', '2026-10-16T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":100,"avanceRealPct":100,"nota":"Entrega completa y transición operativa en curso.","reportadoPor":"USR-003"}'::jsonb, 'USR-003'),
  (5, 'SOL-26', 'PRJ-005', '2026-10-08T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":50,"avanceRealPct":45,"nota":"Preparación de interfaces logísticas.","reportadoPor":"USR-004"}'::jsonb, 'USR-004'),
  (5, 'SOL-26', 'PRJ-005', '2026-10-18T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":55,"avanceRealPct":51,"nota":"Certificación de interfaz en curso.","reportadoPor":"USR-004"}'::jsonb, 'USR-004'),
  (6, 'LUM-26', 'PRJ-006', '2026-10-05T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":55,"avanceRealPct":40,"nota":"Corte previo a la suspensión del despliegue.","reportadoPor":"USR-005"}'::jsonb, 'USR-005'),
  (6, 'LUM-26', 'PRJ-006', '2026-10-15T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":60,"avanceRealPct":40,"nota":"Sin avance real desde la suspensión.","reportadoPor":"USR-005"}'::jsonb, 'USR-005'),
  (7, 'BOR-26', 'PRJ-007', '2026-10-14T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":0,"avanceRealPct":0,"nota":"Proyecto sin movilización; pendiente de aprobación P1P2.","reportadoPor":"USR-006"}'::jsonb, 'USR-006'),
  (8, 'AND-26', 'PRJ-008', '2026-10-09T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":83,"avanceRealPct":85,"nota":"Release 2 entregado con anticipación.","reportadoPor":"USR-004"}'::jsonb, 'USR-004'),
  (8, 'AND-26', 'PRJ-008', '2026-10-19T12:00:00Z', 'STATUS', '{"avancePlanificadoPct":88,"avanceRealPct":89,"nota":"Release 3 en preparación.","reportadoPor":"USR-004"}'::jsonb, 'USR-004');

INSERT INTO proyecto_complejidad (proyecto_id, indice_complejidad, tipificacion, actualizado_at, actualizado_por) VALUES
  (1, NULL, 'Alta', '2026-10-18T12:00:00Z', 'seed-lab'),
  (2, NULL, 'Alta', '2026-10-19T12:00:00Z', 'seed-lab'),
  (3, NULL, 'Alta', '2026-10-17T12:00:00Z', 'seed-lab'),
  (4, NULL, 'Media', '2026-10-16T12:00:00Z', 'seed-lab'),
  (5, NULL, 'Media', '2026-10-18T12:00:00Z', 'seed-lab'),
  (6, NULL, 'Media', '2026-10-15T12:00:00Z', 'seed-lab'),
  (7, NULL, 'Alta', '2026-10-14T12:00:00Z', 'seed-lab'),
  (8, NULL, 'Baja', '2026-10-19T12:00:00Z', 'seed-lab');

INSERT INTO riesgo_global (risk_id_origen, nombre, causa_potencial, control_actual, estado, categoria, probabilidad, impacto, severidad, estrategia, plan_mitigacion, plan_contingencia, responsable_nombre, creado_at, actualizado_at, creado_por, actualizado_por) VALUES
  ('TRS-005', 'Variación de plazos de proveedores', 'Los cambios de plazo de proveedores compartidos afectan compromisos de costo y entrega en más de un proyecto del portafolio.', NULL, 'Activo', 'COM', 4, 4, 16, 'Escalar', 'Escalar la variación al comité de portafolio y consolidar las fechas comprometidas por proveedor.', NULL, 'Camila Ríos', '2026-08-30T12:00:00Z', '2026-08-30T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('TRS-006', 'Consolidación de capacidad técnica compartida', 'La consolidación de una reserva técnica compartida puede mejorar la calidad de las entregas y reducir la dependencia de especialistas aislados.', NULL, 'Activa', 'ORG', 3, 3, 9, 'Compartir', 'Compartir la reserva técnica entre proyectos y documentar las prácticas de transferencia de conocimiento.', NULL, 'Diego Fuentes', '2026-09-05T12:00:00Z', '2026-09-05T12:00:00Z', 'seed-lab', 'seed-lab');

INSERT INTO riesgo_proyecto (risk_id_origen, nombre, causa_potencial, control_actual, estado, categoria, probabilidad, impacto, severidad, estrategia, plan_mitigacion, plan_contingencia, responsable_nombre, creado_at, actualizado_at, creado_por, actualizado_por, proyecto_id, riesgo_global_id, transversal) VALUES
  ('RSK-041', 'Dependencia de proveedor internacional', 'La integración de pagos depende de un proveedor externo cuya ventana de soporte no cubre el calendario completo de la Fase 2.', NULL, 'Activo', 'COM', 4, 3, 12, 'Mitigar', 'Precalificar un proveedor alterno, reservar una ventana de contingencia y revisar la cláusula de continuidad con Compras.', 'Contingencia preparada en el seguimiento sintético del laboratorio.', 'María Torres', '2026-04-12T12:00:00Z', '2026-10-18T12:00:00Z', 'seed-lab', 'seed-lab', 1, NULL, false),
  ('RSK-078', 'Indisponibilidad del servicio de identidad federada', 'Una interrupción del servicio de identidad federada impide el acceso de usuarios al módulo de conciliación durante la operación.', NULL, 'Materializado', 'TEC', 4, 4, 16, 'Mitigar', 'Activar la ruta alterna de autenticación y mantener el monitoreo reforzado hasta estabilizar el servicio.', 'Contingencia preparada en el seguimiento sintético del laboratorio.', 'María Torres', '2026-06-03T12:00:00Z', '2026-10-18T12:00:00Z', 'seed-lab', 'seed-lab', 1, NULL, false),
  ('RSK-079', 'Aceleración por reutilización de componentes', 'La reutilización de componentes de la Fase 1 puede reducir el esfuerzo de configuración de la Fase 2 y liberar capacidad del equipo.', NULL, 'Activa', 'TEC', 3, 4, 12, 'Potenciar', 'Reservar capacidad del equipo de datos y documentar los componentes reutilizables para la Fase 2.', NULL, 'Paula Quispe', '2026-08-21T12:00:00Z', '2026-10-18T12:00:00Z', 'seed-lab', 'seed-lab', 1, NULL, false),
  ('RSK-033', 'Ventana anticipada de puesta en producción', 'La disponibilidad anticipada de la ventana de producción permite adelantar la validación operativa y reducir el riesgo de cierre.', NULL, 'Potenciada', 'CRO', 4, 4, 16, 'Potenciar', 'Coordinar la ventana con Operaciones y preparar el plan de validación anticipada.', NULL, 'Camila Ríos', '2026-07-14T12:00:00Z', '2026-10-19T12:00:00Z', 'seed-lab', 'seed-lab', 2, NULL, false),
  ('RSK-026', 'Disponibilidad de especialistas críticos', 'La asignación simultánea de especialistas críticos a otros cierres puede retrasar la habilitación del módulo clínico.', NULL, 'Activo', 'ORG', 3, 4, 12, 'Mitigar', 'Escalar la demanda de capacidad al PMO y acordar una reserva de especialistas para la puesta en marcha.', NULL, 'Lucía Medina', '2026-07-28T12:00:00Z', '2026-10-17T12:00:00Z', 'seed-lab', 'seed-lab', 3, NULL, false),
  ('RSK-052', 'Retrasos en aprobación de alcance', 'La aprobación tardía de cambios de alcance puede desplazar la aceptación formal del cierre de transición.', NULL, 'Controlado', 'COM', 2, 3, 6, 'Mitigar', 'Formalizar cada aprobación en acta y mantener una revisión semanal con el cliente.', NULL, 'Sebastián Prado', '2026-05-20T12:00:00Z', '2026-10-16T12:00:00Z', 'seed-lab', 'seed-lab', 4, NULL, false);

INSERT INTO facturacion (id_origen, proyecto_id, periodo_mes, tipo, cuota, unidad_codigo, showprice, importe_planificado, importe_real, margen, estado, origen, origen_ref, comentario, actualizado_at, actualizado_por) VALUES
  ('BIL-001', 1, '2026-09-01', 'Hito 3 · Validación Fase 1', 'BIL-001', 'PEN', 180000, 175000, 175000, NULL, 'Facturado', 'Registro real ficticio', 'EJ-FAC-BIL-001', 'Showpricing original ficticio', '2026-10-18T12:00:00Z', 'seed-lab'),
  ('BIL-002', 1, '2026-11-01', 'Hito 4 · Cierre Fase 2', 'BIL-002', 'PEN', 220000, 210000, NULL, NULL, 'Pendiente', NULL, NULL, 'Showpricing original ficticio', '2026-10-18T12:00:00Z', 'seed-lab'),
  ('BIL-003', 2, '2026-10-01', 'Hito 2 · Migración de datos maestros', 'BIL-003', 'CLP', 92000000, 90000000, NULL, NULL, 'Pendiente', NULL, NULL, 'Showpricing original ficticio', '2026-10-19T12:00:00Z', 'seed-lab'),
  ('BIL-004', 3, '2026-09-01', 'Hito 1 · Descubrimiento', 'BIL-004', 'PEN', 65000, 60000, 60000, NULL, 'Facturado', 'Registro real ficticio', 'EJ-FAC-BIL-004', 'Showpricing original ficticio', '2026-10-17T12:00:00Z', 'seed-lab'),
  ('BIL-005', 6, '2026-10-01', 'Hito 2 · Despliegue piloto', 'BIL-005', 'PEN', 95000, 90000, NULL, NULL, 'Pendiente', NULL, NULL, 'Showpricing original ficticio', '2026-10-15T12:00:00Z', 'seed-lab'),
  ('BIL-006', 1, '2026-08-01', 'Configuración inicial', 'BIL-006', 'PEN', 135000, 132000, 130000, NULL, 'Real registrado', 'Registro real ficticio', NULL, 'Showpricing original ficticio', '2026-10-18T12:00:00Z', 'seed-lab'),
  ('BIL-007', 1, '2026-10-01', 'Integración del módulo', 'BIL-007', 'PEN', 160000, 158000, 152000, NULL, 'Real registrado', 'Registro real ficticio', NULL, 'Showpricing original ficticio', '2026-10-18T12:00:00Z', 'seed-lab'),
  ('BIL-008', 3, '2026-08-01', 'Diseño de disponibilidad', 'BIL-008', 'PEN', 48000, 47000, 46000, NULL, 'Real registrado', 'Registro real ficticio', NULL, 'Showpricing original ficticio', '2026-10-17T12:00:00Z', 'seed-lab'),
  ('BIL-009', 3, '2026-10-01', 'Habilitación clínica', 'BIL-009', 'PEN', 76000, 75000, NULL, NULL, 'Pendiente', NULL, NULL, 'Showpricing original ficticio', '2026-10-17T12:00:00Z', 'seed-lab'),
  ('BIL-010', 2, '2026-08-01', 'Preparación de migración', 'BIL-010', 'CLP', 58000000, 56000000, 54000000, NULL, 'Real registrado', 'Registro real ficticio', NULL, 'Showpricing original ficticio', '2026-10-19T12:00:00Z', 'seed-lab'),
  ('BIL-011', 2, '2026-09-01', 'Carga de prueba', 'BIL-011', 'CLP', 65000000, 62000000, 61000000, NULL, 'Real registrado', 'Registro real ficticio', NULL, 'Showpricing original ficticio', '2026-10-19T12:00:00Z', 'seed-lab'),
  ('BIL-012', 4, '2026-08-01', 'Transición inicial', 'BIL-012', 'COP', 120000000, 118000000, 116000000, NULL, 'Real registrado', 'Registro real ficticio', NULL, 'Showpricing original ficticio', '2026-10-16T12:00:00Z', 'seed-lab'),
  ('BIL-013', 4, '2026-09-01', 'Documentación operativa', 'BIL-013', 'COP', 130000000, 128000000, 127000000, NULL, 'Real registrado', 'Registro real ficticio', NULL, 'Showpricing original ficticio', '2026-10-16T12:00:00Z', 'seed-lab'),
  ('BIL-014', 4, '2026-10-01', 'Transferencia de operación', 'BIL-014', 'COP', 110000000, 108000000, 105000000, NULL, 'Real registrado', 'Registro real ficticio', NULL, 'Showpricing original ficticio', '2026-10-16T12:00:00Z', 'seed-lab'),
  ('BIL-015', 8, '2026-10-01', 'Ajuste comercial sin cargo', 'BIL-015', 'PEN', 12000, 0, 0, NULL, 'Real registrado', 'Registro real ficticio', NULL, 'Showpricing original ficticio', '2026-10-19T12:00:00Z', 'seed-lab');

INSERT INTO compra (id_origen, proyecto_id, proveedor_nombre_origen, fecha_compra, gestor_compra, estado_compra, concepto, unidad_codigo, total, presupuesto, monto_adjudicado, ahorro, recepcion_esperada, recepcion_real, creado_at, actualizado_at, creado_por, actualizado_por) VALUES
  ('PUR-001', 1, 'Andes Software', '2026-10-08', 'Andrés Salinas', 'Aprobada', 'Licencias de middleware para integración', 'PEN', 48000, 48000, NULL, NULL, '2026-10-24', NULL, '2026-10-08T12:00:00Z', '2026-10-08T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('PUR-002', 3, 'Costa Digital', NULL, 'Lucía Medina', 'Pendiente', 'Equipos de monitoreo clínico', 'PEN', 12500, 12500, NULL, NULL, '2026-10-29', NULL, NULL, NULL, 'seed-lab', 'seed-lab'),
  ('PUR-003', 2, 'Sur Data', '2026-09-15', 'Camila Ríos', 'Recibida', 'Servicio de migración de datos', 'CLP', 85000000, 85000000, 84000000, NULL, '2026-10-05', '2026-10-04', '2026-09-15T12:00:00Z', '2026-10-04T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('PUR-004', 1, 'Norte Labs', '2026-08-01', 'Andrés Salinas', 'Recibida', 'Ambiente de pruebas de integración', 'PEN', 12000, 12000, 12400, NULL, '2026-08-15', '2026-08-17', '2026-08-01T12:00:00Z', '2026-08-17T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('PUR-005', 3, 'Costa Digital', '2026-09-01', 'Lucía Medina', 'Recibida', 'Equipamiento de pruebas', 'PEN', 19000, 19000, 18500, NULL, '2026-09-15', '2026-09-16', '2026-09-01T12:00:00Z', '2026-09-16T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('PUR-006', 4, 'Sierra Operaciones', '2026-10-01', 'Sebastián Prado', 'Recibida', 'Habilitación operativa', 'COP', 16000000, 16000000, 15500000, NULL, '2026-10-12', '2026-10-12', '2026-10-01T12:00:00Z', '2026-10-12T12:00:00Z', 'seed-lab', 'seed-lab');

INSERT INTO cambio_planificacion (id_origen, proyecto_id, solicitud_cambio_id, campo, valor_anterior, valor_propuesto, solicitante, estado, motivo, comentario, creado_at, resuelto_at, resuelto_por) VALUES
  ('PCR-001', 1, NULL, 'fecha_termino', '2026-11-14', '2026-12-12', 'María Torres', 'Pendiente', NULL, 'Solicitud de cambio de fecha de término', '2026-10-17T12:00:00Z', NULL, NULL),
  ('PCR-002', 2, NULL, 'fecha_termino', '2026-11-30', '2026-12-04', 'María Torres', 'Aprobado', 'Aprobado para cubrir la validación posterior a la ventana anticipada.', 'Ajuste de fecha de cierre de migración', '2026-09-20T12:00:00Z', '2026-09-28T12:00:00Z', 'Valeria Ortiz'),
  ('PCR-003', 6, NULL, 'fecha_termino', '2026-11-15', '2026-12-15', 'Diego Fuentes', 'Descartado', 'Descartado hasta contar con el plan de reanudación aprobado.', 'Reprogramación de reanudación a noviembre', '2026-10-03T12:00:00Z', '2026-10-08T12:00:00Z', 'Valeria Ortiz');

INSERT INTO solicitud_cambio (id_origen, proyecto_id, folio, secuencia, fecha_elaboracion, descripcion, justificacion, firmado, urgencia, responsable_cambio, responsable_cliente_nombre, responsable_cliente_correo, responsable_tivit_nombre, responsable_cuenta, costo, costo_unidad_codigo, costo_tipo, costo_fecha_facturacion, documento_url, documento_id_origen, documento_creado_at, aprobacion, creado_at, actualizado_at, creado_por, actualizado_por) VALUES
  ('CHG-001', 3, 'CHG-001', 1, '2026-09-10', 'Se incorpora la integración con la agenda de especialistas al alcance del módulo clínico.', 'Ajuste de alcance del módulo de agenda', NULL, NULL, 'Lucía Medina', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Aprobado', '2026-09-10T12:00:00Z', '2026-09-18T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('CHG-002', 1, 'CHG-002', 2, '2026-10-09', 'El cliente solicita una validación adicional sobre la conciliación de pagos internacionales.', 'Incorporación de validación adicional de conciliación', NULL, NULL, 'María Torres', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Pendiente', '2026-10-09T12:00:00Z', NULL, 'seed-lab', 'seed-lab'),
  ('CHG-003', 6, 'CHG-003', 3, '2026-09-29', 'Se propone reducir el alcance del piloto para habilitar una reanudación parcial del despliegue.', 'Reducción temporal del alcance del piloto', NULL, NULL, 'Diego Fuentes', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Rechazado', '2026-09-29T12:00:00Z', '2026-10-06T12:00:00Z', 'seed-lab', 'seed-lab');

INSERT INTO registro_horas (id_origen, proyecto_id, especialista_id, especialista_nombre_origen, especialista_lob_origen, especialista_pais_origen, fecha, horas, tipo, modalidad_repase, comentario, email_formulario_origen, registrado_at) VALUES
  ('TE-001', 1, NULL, 'María Torres', 'Gestión de proyectos', 'Perú', '2026-10-16', 6.5, 'Facturable', NULL, 'Seguimiento de la validación de alcance de Fase 2', NULL, '2026-10-16T12:00:00Z'),
  ('TE-002', 1, NULL, 'Andrés Salinas', 'Integraciones y middleware', 'Perú', '2026-10-17', 8, 'Facturable', NULL, 'Preparación del proveedor alterno de integración', NULL, '2026-10-17T12:00:00Z'),
  ('TE-003', 2, NULL, 'Camila Ríos', 'Gestión de proyectos', 'Chile', '2026-10-19', 4, 'Facturable', NULL, 'Coordinación de la migración de datos maestros', NULL, '2026-10-19T12:00:00Z'),
  ('TE-004', 3, NULL, 'Lucía Medina', 'Gestión de proyectos', 'Perú', '2026-10-17', 7.5, 'No facturable', NULL, 'Gestión de capacidad de especialistas clínicos', NULL, '2026-10-17T12:00:00Z'),
  ('TE-005', 6, NULL, 'Diego Fuentes', 'Gestión de proyectos', 'Perú', '2026-10-15', 3, 'No facturable', NULL, 'Revisión del plan de reanudación del despliegue', NULL, '2026-10-15T12:00:00Z');

INSERT INTO compromiso (id_origen, titulo, descripcion, responsable, pais, completado, creado_at, actualizado_at, creado_por, actualizado_por) VALUES
  ('COM-001', 'Entrega del módulo de conciliación', 'Compromiso de entrega funcional del módulo de conciliación para la Fase 2.', 'María Torres', NULL, false, '2026-09-01T12:00:00Z', '2026-09-01T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('COM-002', 'Reporte quincenal al comité ejecutivo', 'Compromiso gerencial de reporte de avance, riesgos y solicitudes de cambio.', 'Valeria Ortiz', NULL, false, '2026-09-15T12:00:00Z', '2026-09-15T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('COM-003', 'Migración de datos maestros sin ventana extendida', 'Compromiso de migración dentro de la ventana acordada con Operaciones.', 'Camila Ríos', NULL, false, '2026-09-18T12:00:00Z', '2026-09-18T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('COM-004', 'Escalamiento de capacidad técnica al PMO', 'Compromiso gerencial de escalar la necesidad de especialistas críticos.', 'Lucía Medina', NULL, false, '2026-09-29T12:00:00Z', '2026-09-29T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('COM-005', 'Plan de reanudación aprobado', 'Compromiso de contar con un plan de reanudación antes de reprogramar el despliegue.', 'Diego Fuentes', NULL, false, '2026-10-02T12:00:00Z', '2026-10-02T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('COM-006', 'Cierre documental de transición', 'Compromiso de completar el cierre documental de la transición operativa.', 'Sebastián Prado', NULL, false, '2026-09-01T12:00:00Z', '2026-10-16T12:00:00Z', 'seed-lab', 'seed-lab');

INSERT INTO leccion_aprendida (id_origen, proyecto_id, area, fecha, titulo, situacion, impacto, acciones_correctivas, leccion, correo_texto, creado_at, actualizado_at, creado_por, actualizado_por) VALUES
  ('LL-001', 4, NULL, '2026-09-20', 'Documentar criterios de aceptación antes de la transición', 'La transición operativa requirió una revisión adicional de criterios no formalizados.', NULL, 'Acordar y firmar los criterios de aceptación antes de iniciar el cierre de transición.', 'Acordar y firmar los criterios de aceptación antes de iniciar el cierre de transición.', NULL, '2026-09-20T12:00:00Z', '2026-09-20T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('LL-002', 2, NULL, '2026-10-05', 'Confirmar ventanas operativas con anticipación', 'La disponibilidad de una ventana anticipada exigió coordinar equipos de Operaciones.', NULL, 'Incluir la confirmación de ventanas operativas en el plan base y revisarlas con dos semanas de anticipación.', 'Incluir la confirmación de ventanas operativas en el plan base y revisarlas con dos semanas de anticipación.', NULL, '2026-10-05T12:00:00Z', '2026-10-05T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('LL-003', 6, NULL, '2026-10-10', 'Definir criterios de reanudación explícitos', 'La suspensión del despliegue no contaba con criterios documentados de reanudación.', NULL, 'Definir criterios verificables de pausa y reanudación al inicio de cada despliegue.', 'Definir criterios verificables de pausa y reanudación al inicio de cada despliegue.', NULL, '2026-10-10T12:00:00Z', '2026-10-10T12:00:00Z', 'seed-lab', 'seed-lab'),
  ('LL-004', 1, NULL, '2026-10-09', 'Revisar dependencias de proveedores en el plan base', 'La dependencia de un proveedor internacional afectó el calendario de la Fase 2.', NULL, 'Incorporar una revisión formal de dependencias de proveedores en la planificación de cada fase.', 'Incorporar una revisión formal de dependencias de proveedores en la planificación de cada fase.', NULL, '2026-10-09T12:00:00Z', '2026-10-09T12:00:00Z', 'seed-lab', 'seed-lab');

INSERT INTO documento_proyecto (proyecto_id, tipo_documento, url, relacionado_con_cierre, validado, validado_at, validado_por, registrado_at) VALUES
  (1, 'SOW', 'https://example.test/lab/DOC-001', false, NULL, NULL, NULL, '2026-10-16T12:00:00Z'),
  (1, 'Acta', 'https://example.test/lab/DOC-002', false, NULL, NULL, NULL, '2026-10-18T12:00:00Z'),
  (2, 'Entregable', 'https://example.test/lab/DOC-003', false, NULL, NULL, NULL, '2026-10-02T12:00:00Z'),
  (3, 'Entregable', 'https://example.test/lab/DOC-004', false, NULL, NULL, NULL, '2026-10-17T12:00:00Z'),
  (6, 'Acta', 'https://example.test/lab/DOC-005', false, NULL, NULL, NULL, '2026-10-01T12:00:00Z');

INSERT INTO refresh_ejecucion (iniciado_at, finalizado_at, duracion_segundos, filas_snapshot, filas_fact, estado, error_detalle)
VALUES (now(), now(), 0, 17, 15, 'seed-lab', NULL);
