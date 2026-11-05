import { SQL } from 'bun';

const url = Bun.env.MIGRATOR_DATABASE_URL;
if (!url) throw new Error('Falta MIGRATOR_DATABASE_URL');
if (Bun.env.NODE_ENV !== 'development' || !process.argv.includes('--apply')) throw new Error('Backfill sólo en desarrollo con --apply');

const db = new SQL({ url, max: 1 });
try {
  await db.begin(async tx => {
    const [version] = await tx<{ n: string }>`SELECT count(*)::text n FROM pmo_cusn_meta.migracion WHERE version='007_business_patch.sql'`;
    if (version?.n !== '1') throw new Error('Primero aplique 007');
    const [before] = await tx<{ source: string; target: string; budget: string; expected: string; actual: string }>`SELECT
      (SELECT count(*)::text FROM pmo.compra) source,
      (SELECT count(*)::text FROM pmo_cusn.compra) target,
      (SELECT count(*)::text FROM pmo_cusn.compra WHERE presupuesto IS NOT NULL) budget,
      (SELECT count(*)::text FROM pmo_cusn.compra WHERE fecha_recepcion_esperada IS NOT NULL) expected,
      (SELECT count(*)::text FROM pmo_cusn.compra WHERE fecha_recepcion_real IS NOT NULL) actual`;
    const [conflicts] = await tx<{ count: string }>`SELECT count(*)::text count FROM pmo.compra s JOIN pmo_cusn.compra t ON t.id=s.id
      WHERE t.proyecto_id<>s.proyecto_id OR (t.presupuesto IS NOT NULL AND t.presupuesto IS DISTINCT FROM s.presupuesto)
      OR (t.fecha_recepcion_esperada IS NOT NULL AND t.fecha_recepcion_esperada IS DISTINCT FROM s.recepcion_esperada)
      OR (t.fecha_recepcion_real IS NOT NULL AND t.fecha_recepcion_real IS DISTINCT FROM s.recepcion_real)`;
    if (conflicts?.count !== '0') throw new Error(`Backfill con ${conflicts?.count} conflictos; no se aplicó`);
    const updated = await tx<{ id: string }>`UPDATE pmo_cusn.compra t SET
      presupuesto=coalesce(t.presupuesto,s.presupuesto),
      fecha_recepcion_esperada=coalesce(t.fecha_recepcion_esperada,s.recepcion_esperada),
      fecha_recepcion_real=coalesce(t.fecha_recepcion_real,s.recepcion_real)
      FROM pmo.compra s WHERE t.id=s.id AND t.proyecto_id=s.proyecto_id
      AND ((t.presupuesto IS NULL AND s.presupuesto IS NOT NULL)
        OR (t.fecha_recepcion_esperada IS NULL AND s.recepcion_esperada IS NOT NULL)
        OR (t.fecha_recepcion_real IS NULL AND s.recepcion_real IS NOT NULL))
      RETURNING t.id::text`;
    const [after] = await tx<{ budget: string; expected: string; actual: string; unmatched: string; marginsource: string }>`SELECT
      (SELECT count(*)::text FROM pmo_cusn.compra WHERE presupuesto IS NOT NULL) budget,
      (SELECT count(*)::text FROM pmo_cusn.compra WHERE fecha_recepcion_esperada IS NOT NULL) expected,
      (SELECT count(*)::text FROM pmo_cusn.compra WHERE fecha_recepcion_real IS NOT NULL) actual,
      (SELECT count(*)::text FROM pmo.compra s LEFT JOIN pmo_cusn.compra t ON t.id=s.id AND t.proyecto_id=s.proyecto_id WHERE t.id IS NULL) unmatched,
      (SELECT count(*)::text FROM pmo.facturacion WHERE margen IS NOT NULL) marginSource`;
    console.log(JSON.stringify({ entity: 'compra', before, after, rowsTouched: updated.length, conflicts: conflicts?.count,
      closureDates: 'sin origen inequívoco', billingMargin: after?.marginsource === '0' ? 'sin valores históricos' : 'requiere mapeo adicional' }));
  });
} finally { await db.close(); }
