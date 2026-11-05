import { SQL } from "bun";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export async function verifyDatabase(db:SQL,runtime=false):Promise<void> {
  const [engine]=await db<{version:string}>`SELECT current_setting('server_version_num') AS version`;
  if(engine?.version!=="180006")throw new Error("Se requiere PostgreSQL 18.6.");
  const contract=readFileSync(resolve(import.meta.dirname,"../migrations/005_pmo_cusn_v200.sql"),"utf8");
  const expected=[...contract.matchAll(/^CREATE TABLE (\w+)/gm)].map(m=>m[1]!);
  const tables=await db<{table_name:string}>`SELECT table_name FROM information_schema.tables WHERE table_schema='pmo_cusn' AND table_type='BASE TABLE' ORDER BY table_name`;
  if(expected.length!==49||JSON.stringify(tables.map(r=>r.table_name))!==JSON.stringify([...expected].sort()))throw new Error("Las 49 tablas no coinciden con el DDL.");
  const [objects]=await db<{functions:string;triggers:string;partial:string;invalid:string}>`SELECT
    (SELECT count(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='pmo_cusn') functions,
    (SELECT count(*)::text FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='pmo_cusn' AND NOT t.tgisinternal) triggers,
    (SELECT count(*)::text FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='pmo_cusn' AND i.indpred IS NOT NULL) partial,
    (SELECT count(*)::text FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='pmo_cusn' AND NOT c.convalidated) invalid`;
  if(objects?.functions!=="9"||objects.triggers!=="13"||objects.partial!=="8"||objects.invalid!=="0")throw new Error(`Objetos/restricciones distintos: ${JSON.stringify(objects)}`);
  const units=await db<{codigo:string}>`SELECT codigo FROM pmo_cusn.unidad_monetaria ORDER BY codigo`;
  if(units.map(r=>r.codigo).join(',')!=="ARS,BRL,CLP,COP,MXN,PAB,PEN,UF,USD")throw new Error("Unidades distintas del contrato.");
  const [roles]=await db<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.rol`;
  if(roles?.n!=="4")throw new Error("Se esperaban cuatro roles.");
  const roleCodes=await db<{codigo:string}>`SELECT codigo FROM pmo_cusn.rol ORDER BY codigo`;
  if(roleCodes.map(r=>r.codigo).join(',')!=="ADMIN,ESPECIALISTA,PM,VISUALIZADOR")throw new Error("Catálogo de roles distinto.");
  const [grants]=await db<{n:string}>`SELECT count(*)::text n FROM pmo_cusn.rol_permiso`;
  if(runtime&&grants?.n!=="0")throw new Error("La matriz funcional del entorno no debe recibir asignaciones automáticas.");
  const [references]=await db<{permissions:string;scopes:string}>`SELECT (SELECT count(*)::text FROM pmo_cusn.permiso) permissions,(SELECT count(*)::text FROM pmo_cusn.ambito_cambio) scopes`;
  if(references?.permissions!=="24"||references.scopes!=="6")throw new Error("Catálogos de permisos o ámbitos distintos del contrato.");
  const foreignKeys=await db<{child:string;parent:string;keys:string[];refs:string[]}>`
    SELECT c.conrelid::regclass::text child,c.confrelid::regclass::text parent,
      ARRAY(SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY k(attnum,ord) JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.attnum ORDER BY k.ord) keys,
      ARRAY(SELECT a.attname FROM unnest(c.confkey) WITH ORDINALITY k(attnum,ord) JOIN pg_attribute a ON a.attrelid=c.confrelid AND a.attnum=k.attnum ORDER BY k.ord) refs
    FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='pmo_cusn' AND c.contype='f'`;
  const quote=(s:string)=>'"'+s.replaceAll('"','""')+'"';
  for(const fk of foreignKeys){
    const [row]=await db.unsafe<{n:string}[]>(`SELECT count(*)::text n FROM ${fk.child} c LEFT JOIN ${fk.parent} p ON ${fk.keys.map((k,i)=>`c.${quote(k)}=p.${quote(fk.refs[i]!)}`).join(' AND ')} WHERE ${fk.keys.map(k=>`c.${quote(k)} IS NOT NULL`).join(' AND ')} AND p.${quote(fk.refs[0]!)} IS NULL`);
    if(row?.n!=="0")throw new Error(`FK huérfana en ${fk.child}`);
  }
  const [migration]=await db<{n:string}>`SELECT count(*)::text n FROM pmo_cusn_meta.migracion WHERE version IN ('005_pmo_cusn_v200.sql','006_function_paths.sql','007_business_patch.sql','008_business_guards.sql','009_cc_approval_trace.sql','010_closed_evidence_guard.sql')`;
  if(migration?.n!=="6")throw new Error("Migraciones no registradas.");
  if(runtime){
    const [privileges]=await db<{elevated:boolean;ddl:boolean;read:boolean;insert:boolean;update:boolean;delete:boolean;event_update:boolean;matrix_write:boolean}>`SELECT
      (r.rolsuper OR r.rolcreatedb OR r.rolcreaterole) elevated,
      has_schema_privilege(current_user,'pmo_cusn','CREATE') ddl,
      has_table_privilege(current_user,'pmo_cusn.proyecto','SELECT') read,
      has_table_privilege(current_user,'pmo_cusn.proyecto','INSERT') insert,
      has_table_privilege(current_user,'pmo_cusn.proyecto','UPDATE') update,
      has_table_privilege(current_user,'pmo_cusn.proyecto','DELETE') delete,
      has_table_privilege(current_user,'pmo_cusn.evento_proyecto','UPDATE') event_update,
      has_table_privilege(current_user,'pmo_cusn.rol_permiso','INSERT') matrix_write FROM pg_roles r WHERE rolname=current_user`;
    if(!privileges||privileges.elevated||privileges.ddl||!privileges.read||!privileges.insert||!privileges.update||!privileges.delete||privileges.event_update||privileges.matrix_write)throw new Error(`Privilegios runtime no válidos: ${JSON.stringify(privileges)}`);
    console.log("PASS runtime sin DDL ni privilegios elevados; DML de proyecto, eventos y matriz funcional protegidos.");
  }
  console.log(`PASS 49 tablas, 9 funciones, 13 triggers, 8 índices parciales, ${foreignKeys.length} FKs sin huérfanos, 9 unidades, 4 roles y 6 migraciones.`);
}
if(import.meta.main){
  if(!Bun.env.DATABASE_URL)throw new Error("Falta DATABASE_URL.");
  const db=new SQL({url:Bun.env.DATABASE_URL,max:1});
  try{
    await verifyDatabase(db,true);
    const raw=Bun.env.EXPECT_PROJECTS;
    if(raw!==undefined&&raw.trim()!==""){
      if(!/^\d+$/.test(raw))throw new Error("EXPECT_PROJECTS debe ser entero no negativo.");
      const [n]=await db<{count:string}>`SELECT count(*)::text count FROM pmo_cusn.proyecto`;
      if(n?.count!==String(BigInt(raw)))throw new Error(`Proyectos: ${n?.count}; esperados: ${raw}`);
      console.log(`PASS ${raw} proyectos esperados.`);
    }
  }finally{await db.close();}
}
