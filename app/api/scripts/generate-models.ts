import { SQL } from "bun";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {assertCatalog} from './catalog';

const db=new SQL({url:Bun.env.MIGRATOR_DATABASE_URL??Bun.env.DATABASE_URL,max:1});
try {
  await db.begin(tx=>assertCatalog(tx));
  const columns=await db<{table_name:string;column_name:string;udt_name:string;is_nullable:string;is_identity:string;is_generated:string;column_default:string|null;generation_expression:string|null;character_maximum_length:number|null;numeric_precision:number|null;numeric_scale:number|null}>`
    SELECT table_name,column_name,udt_name,is_nullable,is_identity,is_generated,column_default,generation_expression,
      character_maximum_length,numeric_precision,numeric_scale FROM information_schema.columns WHERE table_schema='pmo_cusn' ORDER BY table_name,ordinal_position`;
  const constraints=await db<{table_name:string;name:string;kind:string;definition:string}>`
    SELECT c.relname AS table_name,r.conname AS name,r.contype::text AS kind,pg_get_constraintdef(r.oid) AS definition FROM pg_constraint r
    JOIN pg_class c ON c.oid=r.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='pmo_cusn' ORDER BY c.relname,r.conname`;
  const indexes=await db<{table_name:string;name:string;definition:string}>`SELECT tablename AS table_name,indexname AS name,indexdef AS definition FROM pg_indexes WHERE schemaname='pmo_cusn' ORDER BY tablename,indexname`;
  const names=[...new Set(columns.map(c=>c.table_name))];
  if(names.length!==55)throw new Error(`Se esperaban 55 tablas, se obtuvo ${names.length}.`);
  const pascal=(s:string)=>s.split('_').map(v=>v[0]!.toUpperCase()+v.slice(1)).join('');
  const output=["// Generado por db:models desde el catálogo PostgreSQL del DDL v2.1.0. No editar a mano.",
    "// bigint y numeric se reciben como string; date/timestamptz como Date en Bun SQL.",
    "export type BigintId = string;\nexport type Decimal = string;\nexport type Json = null | boolean | number | string | Json[] | { [key: string]: Json };\n"];
  for(const name of names){
    const cols=columns.filter(c=>c.table_name===name);
    output.push(`export interface ${pascal(name)}Row {`);
    for(const c of cols){
      let type=c.udt_name==='int8'?'BigintId':c.udt_name==='numeric'?'Decimal':['int2','int4'].includes(c.udt_name)?'number':c.udt_name==='bool'?'boolean':['date','timestamptz','timestamp'].includes(c.udt_name)?'Date':c.udt_name==='jsonb'?'Json':'string';
      // CHECK IN simples se reflejan como literales sin sustituir la validación SQL.
      const check=constraints.filter(k=>k.table_name===name&&k.kind==='c').map(k=>k.definition).find(d=>d.includes(`(${c.column_name})::text = ANY`)||d.includes(`(${c.column_name} = ANY`));
      if(check){const values=[...check.matchAll(/'([^']+)'::(?:text|character varying)/g)].map(m=>m[1]);if(values.length)type=[...new Set(values)].map(v=>JSON.stringify(v)).join(' | ');}
      output.push(`  ${c.is_generated!=='NEVER'?'readonly ':''}${c.column_name}: ${type}${c.is_nullable==='YES'?' | null':''};`);
    }
    output.push('}');
    const required=cols.filter(c=>c.is_identity==='NO'&&c.is_generated==='NEVER'&&c.is_nullable==='NO'&&c.column_default===null).map(c=>JSON.stringify(c.column_name));
    const writable=cols.filter(c=>c.is_identity==='NO'&&c.is_generated==='NEVER').map(c=>JSON.stringify(c.column_name));
    output.push(`export type ${pascal(name)}Insert = Pick<${pascal(name)}Row, ${required.join(' | ')||'never'}> & Partial<Pick<${pascal(name)}Row, ${writable.join(' | ')||'never'}>>;\n`);
  }
  output.push(`export const databaseConstraints = ${JSON.stringify(constraints,null,2)} as const;`);
  output.push(`export const databaseIndexes = ${JSON.stringify(indexes,null,2)} as const;`);
  const target=resolve(import.meta.dirname,'../src/models.ts');
  const generated=output.join('\n')+'\n';
  const projection=["// Generado desde el baseline verificado; integridad avanzada en SQL versionado.",
    "import {sql} from 'drizzle-orm';",
    "import {pgSchema,bigint,integer,smallint,numeric,text,varchar,char,boolean,date,timestamp,jsonb} from 'drizzle-orm/pg-core';",
    "const pmo=pgSchema('pmo_cusn');"];
  for(const name of names){
    projection.push(`export const ${name}=pmo.table(${JSON.stringify(name)},{`);
    for(const c of columns.filter(c=>c.table_name===name)){
      const col=JSON.stringify(c.column_name);
      let expr=c.udt_name==='int8'?`bigint(${col},{mode:'bigint'})`:c.udt_name==='int4'?`integer(${col})`:c.udt_name==='int2'?`smallint(${col})`:
        c.udt_name==='numeric'?`numeric(${col},{precision:${c.numeric_precision},scale:${c.numeric_scale}})`:
        c.udt_name==='bool'?`boolean(${col})`:c.udt_name==='date'?`date(${col},{mode:'string'})`:
        ['timestamptz','timestamp'].includes(c.udt_name)?`timestamp(${col},{withTimezone:${c.udt_name==='timestamptz'},mode:'date'})`:
        c.udt_name==='jsonb'?`jsonb(${col})`:c.udt_name==='varchar'?`varchar(${col}${c.character_maximum_length?`,{length:${c.character_maximum_length}}`:''})`:
        c.udt_name==='bpchar'?`char(${col},{length:${c.character_maximum_length}})`:`text(${col})`;
      if(c.is_identity==='YES')expr+='.generatedAlwaysAsIdentity()';
      if(c.is_generated!=='NEVER')expr+=`.generatedAlwaysAs(sql.raw(${JSON.stringify(c.generation_expression)}))`;
      else if(c.column_default!==null)expr+=`.default(sql.raw(${JSON.stringify(c.column_default)}))`;
      if(c.is_nullable==='NO')expr+='.notNull()';
      if(constraints.some(k=>k.table_name===name&&k.kind==='p'&&k.definition===`PRIMARY KEY (${c.column_name})`))expr+='.primaryKey()';
      projection.push(`  ${c.column_name}:${expr},`);
    }
    projection.push('});');
  }
  const schemaTarget=resolve(import.meta.dirname,'../src/infrastructure/database/schema.ts');
  const constructors=['pgSchema','bigint','integer','smallint','numeric','text','varchar','char','boolean','date','timestamp','jsonb']
    .filter(fn=>projection.some((line,index)=>index>2&&new RegExp('\\b'+fn+'\\(').test(line)));
  projection[2]=`import {${constructors.join(',')}} from 'drizzle-orm/pg-core';`;
  const schemaOutput=projection.join('\n')+'\n';
  if(process.argv.includes('--check')) {
    if(readFileSync(target,'utf8')!==generated)throw new Error('Modelos divergentes de las migraciones aplicadas. Ejecuta db:models en una BD aislada.');
    if(readFileSync(schemaTarget,'utf8')!==schemaOutput)throw new Error('Proyección Drizzle divergente.');
    console.log('55 modelos coinciden con las migraciones aplicadas.');
  } else {
    writeFileSync(target,generated);
    writeFileSync(schemaTarget,schemaOutput);
    console.log('55 modelos generados, con claves, relaciones, checks e índices del catálogo.');
  }
}finally{await db.close();}
