import {and,eq,sql as expression} from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/bun-sql';
import type {SQL} from 'bun';
import {sql} from '../db';
import {proyecto} from '../infrastructure/database/schema';

const projection={id:expression<string>`${proyecto.id}::text`,tvt:proyecto.tvt,nombre:proyecto.nombre,
  workspaceId:expression<string>`${proyecto.workspace_id}::text`,version:expression<string>`${proyecto.version}::text`};

export async function findProject(projectId:string){
  const [row]=await drizzle(sql).select({...projection,estado:proyecto.estado_actual}).from(proyecto)
    .where(and(eq(proyecto.id,BigInt(projectId)),eq(proyecto.activo,true))).limit(1);
  return row;
}
export async function renameProject(db:SQL,projectId:string,version:string,name:string){
  const [row]=await drizzle(db).update(proyecto).set({nombre:name,version:expression`${proyecto.version}+1`,updated_at:expression`now()`})
    .where(and(eq(proyecto.id,BigInt(projectId)),eq(proyecto.version,BigInt(version)),eq(proyecto.activo,true))).returning(projection);
  return row;
}
