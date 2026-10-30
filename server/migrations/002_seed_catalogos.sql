-- Semilla de catálogos del laboratorio. No contiene datos corporativos.
SET search_path TO pmo, public;

INSERT INTO unidad_monetaria (codigo, clase) VALUES
  ('USD','MONEDA'), ('PEN','MONEDA'), ('CLP','MONEDA'),
  ('COP','MONEDA'), ('ARS','MONEDA'), ('BRL','MONEDA'),
  ('PAB','MONEDA'), ('MXN','MONEDA'), ('UF','UNIDAD_INDEXADA')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO catalogo_valor (tipo, valor, padre_valor, orden, activo) VALUES
  ('LOB', 'Soluciones digitales', 'LOB-DIG', 1, true),
  ('LOB', 'Cloud e infraestructura', 'LOB-CLD', 2, true),
  ('LOB', 'Servicios operativos', 'LOB-OPS', 3, true),
  ('SERVICIO', 'Integración de aplicaciones', 'SVC-INT|LOB-DIG', 4, true),
  ('SERVICIO', 'Plataformas de datos', 'SVC-DAT|LOB-DIG', 5, true),
  ('SERVICIO', 'Migración cloud', 'SVC-MIG|LOB-CLD', 6, true),
  ('SERVICIO', 'Infraestructura regional', 'SVC-INF|LOB-CLD', 7, true),
  ('SERVICIO', 'Transición operativa', 'SVC-TRA|LOB-OPS', 8, true),
  ('SQUAD', 'Integraciones', 'SQ-INT|USR-008', 9, true),
  ('SQUAD', 'Datos y plataformas', 'SQ-DAT|USR-009', 10, true),
  ('SQUAD', 'Continuidad operativa', 'SQ-OPS|USR-008', 11, true),
  ('CATEGORIA_RIESGO', 'Técnico', 'TEC', 12, true),
  ('CATEGORIA_RIESGO', 'Cronograma', 'CRO', 13, true),
  ('CATEGORIA_RIESGO', 'Comercial', 'COM', 14, true),
  ('CATEGORIA_RIESGO', 'Organizacional', 'ORG', 15, true),
  ('COMPLEJIDAD', 'Baja', NULL, 16, true),
  ('COMPLEJIDAD', 'Media', NULL, 17, true),
  ('COMPLEJIDAD', 'Alta', NULL, 18, true),
  ('USUARIO', 'María Torres', 'USR-001|MT|Project Manager|Gestión de proyectos|true', 19, true),
  ('USUARIO', 'Lucía Medina', 'USR-002|LM|Project Manager|Gestión de proyectos|true', 20, true),
  ('USUARIO', 'Sebastián Prado', 'USR-003|SP|Project Manager|Gestión de proyectos|true', 21, true),
  ('USUARIO', 'Camila Ríos', 'USR-004|CR|Project Manager|Gestión de proyectos|true', 22, true),
  ('USUARIO', 'Diego Fuentes', 'USR-005|DF|Project Manager|Gestión de proyectos|true', 23, true),
  ('USUARIO', 'Luis Vega', 'USR-006|LV|Project Manager|Gestión de proyectos|true', 24, true),
  ('USUARIO', 'Valeria Ortiz', 'USR-007|VO|PMO|Gobierno de portafolio|true', 25, true),
  ('USUARIO', 'Andrés Salinas', 'USR-008|AS|Especialista|Integraciones y middleware|true', 26, true),
  ('USUARIO', 'Paula Quispe', 'USR-009|PQ|Especialista|Datos y analítica|true', 27, true),
  ('USUARIO', 'Elena Suárez', 'USR-010|ES|Preventa|Acompañamiento comercial y operativo|true', 28, true),
  ('USUARIO', 'Javier Molina', 'USR-011|JM|TAM|Acompañamiento comercial y operativo|true', 29, true),
  ('USUARIO', 'Renata Silva', 'USR-012|RS|SDM|Acompañamiento comercial y operativo|true', 30, true),
  ('USUARIO', 'Mateo Cárdenas', 'USR-013|MC|Account Manager|Acompañamiento comercial y operativo|true', 31, true),
  ('PAIS', 'Perú', 'PE', 32, true),
  ('PAIS', 'Chile', 'CL', 33, true),
  ('PAIS', 'Colombia', 'CO', 34, true)
ON CONFLICT (tipo, valor) DO NOTHING;
