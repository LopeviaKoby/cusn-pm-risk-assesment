import { SQL } from "bun";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const url=Bun.env.MIGRATOR_DATABASE_URL;
if(!url)throw new Error("Falta MIGRATOR_DATABASE_URL.");
const apply=process.argv.includes("--apply");
if(apply && Bun.env.NODE_ENV!=="development")throw new Error("La copia sintética exige NODE_ENV=development.");
const sql=new SQL({url,max:1});
type Counts=Record<string,string>;
async function counts(schema:string):Promise<Counts> {
  const tables=await sql<{table_name:string}>`SELECT table_name FROM information_schema.tables WHERE table_schema=${schema} AND table_type='BASE TABLE' ORDER BY table_name`;
  const result:Counts={};
  for(const t of tables){const [r]=await sql.unsafe<{n:string}[]>(`SELECT count(*)::text AS n FROM ${schema}."${t.table_name}"`);result[t.table_name]=r!.n;}
  return result;
}
try {
  const before=await counts("pmo");
  if(!before.proyecto)throw new Error("No existe la fuente pmo.proyecto. No se ejecutan seeds antiguos.");
  const conflicts=await sql`SELECT 'proyecto' entidad,p.id::text id,'Falta cliente, país, LOB o estado equivalente' motivo
    FROM pmo.proyecto p LEFT JOIN pmo.proyecto_estado_actual s ON s.proyecto_id=p.id
    LEFT JOIN pmo.estado_proyecto e ON e.id=s.estado_proyecto_id
    WHERE p.cliente_id IS NULL OR p.lob IS NULL OR btrim(p.lob)='' OR p.pais NOT IN ('Chile','Colombia','Perú','Argentina','Brasil','Paraguay','México','Panama')
      OR e.nombre NOT IN ('Cancelado','Cerrado con observaciones','Cerrado exitoso','Detenido','En Transición','En ejecucion','Requiere P1P2')
    UNION ALL SELECT 'riesgo_proyecto',id::text,'Estado, estrategia o escala incompatible' FROM pmo.riesgo_proyecto
      WHERE estado NOT IN ('Pendiente','Contingencia','Controlado','Mitigado') OR estrategia NOT IN ('Mitigar','Aceptar','Transferir','Evitar','Reducir') OR probabilidad NOT BETWEEN 1 AND 4 OR impacto NOT BETWEEN 1 AND 4`;
  const omissions=await sql`SELECT 'proyecto' entidad,p.id::text id,'Baseline anterior al inicio: baseline destino NULL; valor original preservado en pmo' motivo FROM pmo.proyecto p JOIN pmo.proyecto_estado_actual s ON s.proyecto_id=p.id WHERE p.fecha_termino_baseline<s.fecha_inicio_proyecto
    UNION ALL SELECT 'cambio_planificacion',id::text,'Sin CC enlazado ni actores con identidad comprobable; no convertir en excepción' FROM pmo.cambio_planificacion WHERE solicitud_cambio_id IS NULL
    UNION ALL SELECT 'documento_proyecto',id::text,'URL sin identificador Google Drive verificable' FROM pmo.documento_proyecto
    UNION ALL SELECT 'proyecto_complejidad',proyecto_id::text,'Fórmula V1 incompatible u override sin justificación: evaluación no copiada' FROM pmo.proyecto_complejidad
      WHERE indice_complejidad IS DISTINCT FROM round(factor_riesgo::numeric*0.35+factor_facturacion::numeric*0.20+factor_plazo::numeric*0.15+factor_alcance::numeric*0.30,1)
        OR (override_estrategico AND nullif(btrim(nota_override),'') IS NULL)
    UNION ALL SELECT 'especialista',id::text,'Email ausente: no se inventa identidad' FROM pmo.especialista WHERE email_corporativo IS NULL
    UNION ALL SELECT 'catalogo_valor',id::text,'Servicio de catálogo sin LOB comprobable; solo se copian pares de proyecto existentes' FROM pmo.catalogo_valor WHERE upper(tipo)='SERVICIO_LOB' AND padre_valor IS NULL
    UNION ALL SELECT 'proyecto',id::text,'Responsables textuales sin email: no crear usuario ni participación; originales permanecen en pmo' FROM pmo.proyecto WHERE gestor_nombre IS NOT NULL
    UNION ALL SELECT 'riesgo_proyecto',id::text,'Responsable textual sin usuario comprobable; FK queda nula' FROM pmo.riesgo_proyecto WHERE responsable_nombre IS NOT NULL AND NOT EXISTS(SELECT 1 FROM pmo.especialista e WHERE e.nombre=responsable_nombre AND e.email_corporativo IS NOT NULL)`;
  const report={before,conflicts,omissions,excluded:["registro_horas","repase_asignacion","repase_consumo","refresh_ejecucion"],fieldsNotMapped:{
    proyecto:["tvt_key_origen","estado_cliente (puede variar por proyecto del mismo cliente)","gestor_nombre/preventa/tam/sdm/account_manager/lideres_tecnicos sin identidad","ultimo_recordatorio_at"],
    riesgo_global:["estado","control_actual","estrategia","plan_mitigacion","plan_contingencia","responsable_nombre","actualizado_at"],
    compra:["gestor_compra sin identidad","estado_compra (se informa la etapa explícita)","aprobadores sin identidad","presupuesto","ahorro","recepcion_esperada","recepcion_real"],
    solicitud_cambio:["responsable_cambio ambiguo","responsables sin identidad","costo_fecha_facturacion","documentos no Drive"],
    proyecto_estado_actual:["margen_pct","estado_facturacion","lecciones_resumen (no convertir resumen en lección)","checklist_entregables sin evidencia verificable"],
  },notes:[
    "La fuente pmo solo se lee. No se descarta ni elimina ningún registro de la fuente.",
    "Identidades: solo especialistas con email existente; no roles, permisos ni usuarios de login automáticos.",
    "Catálogos país/LOB/squad de valores existentes; servicios de pares LOB/servicio observados en proyectos.",
    "TCV definido cuando existe valor y moneda; sin datos no se supone ILIMITADO.",
    "Cierres antiguos se conservan como estado histórico con validación SIN_EVIDENCIA_HISTORICA.",
    "Campos sin destino (presupuesto/ahorro, textos de responsables, trazas de origen) permanecen en pmo; no se reinterpretan como datos nuevos.",
  ]};
  console.log(JSON.stringify(report,null,2));
  if(conflicts.length)throw new Error("Conflictos de preflight; no se copia nada.");
  if(!apply){console.log("Solo preflight. Para copiar: NODE_ENV=development y --apply.");}
  else {
    await sql.begin(async tx=>{
      await tx`SELECT pg_advisory_xact_lock(81420261102)`;
      await tx`CREATE TABLE IF NOT EXISTS pmo_cusn_meta.importacion (version text PRIMARY KEY, reporte jsonb NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`;
      const done=await tx`SELECT 1 FROM pmo_cusn_meta.importacion WHERE version='pmo-v200'`;
      if(done.length){console.log("= pmo-v200 ya importada; no se modifica destino");return;}
      const [target]=await tx<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.proyecto`;
      if(target?.n!=="0")throw new Error("Destino no vacío sin registro de importación. No se fusiona ni trunca.");
      await tx.unsafe(readFileSync(resolve(import.meta.dirname,"../migrations/import_pmo_v200.sql"),"utf8"));
      const tables=await tx<{table_name:string}>`SELECT table_name FROM information_schema.tables WHERE table_schema='pmo_cusn' AND table_type='BASE TABLE' ORDER BY table_name`;
      const after:Counts={};
      for(const t of tables){const [r]=await tx.unsafe<{n:string}[]>(`SELECT count(*)::text n FROM pmo_cusn."${t.table_name}"`);after[t.table_name]=r!.n;}
      await tx`INSERT INTO pmo_cusn_meta.importacion(version,reporte) VALUES ('pmo-v200',${JSON.stringify({...report,after})}::jsonb)`;
    });
    const after=await counts("pmo_cusn");
    mkdirSync(resolve(".tools"),{recursive:true});
    writeFileSync(resolve(".tools/pmo-v200-import.json"),JSON.stringify({...report,after},null,2));
    console.log("DESPUÉS",JSON.stringify(after));
  }
} finally {await sql.close();}
