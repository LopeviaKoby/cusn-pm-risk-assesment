-- Unidades monetarias base requeridas por las claves foráneas del esquema.
-- Se aplica también en modo schema; los catálogos de demostración están en 002.
SET search_path TO pmo, public;

INSERT INTO unidad_monetaria (codigo, clase) VALUES
  ('USD','MONEDA'), ('PEN','MONEDA'), ('CLP','MONEDA'),
  ('COP','MONEDA'), ('ARS','MONEDA'), ('BRL','MONEDA'),
  ('PAB','MONEDA'), ('MXN','MONEDA'), ('UF','UNIDAD_INDEXADA')
ON CONFLICT (codigo) DO NOTHING;