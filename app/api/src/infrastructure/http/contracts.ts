import {z} from 'zod';

// Transport contracts are independent of persistence entities. SQL bigint values stay strings.
export const id=z.string().regex(/^[1-9][0-9]{0,18}$/);
export const cursor=z.string().regex(/^(0|[1-9][0-9]{0,18})$/);
export const role=z.enum(['ADMIN','PM','ESPECIALISTA','VISUALIZADOR']);
const name=z.string().trim().min(1).max(200);
export const inputs={
  login:z.strictObject({identifier:z.string().min(1).max(254),password:z.string().min(1).max(1024)}),
  workspace:z.strictObject({nombre:name}),
  workspaceEdit:z.strictObject({nombre:name,version:id}),
  enable:z.strictObject({habilitado:z.boolean()}),
  invitation:z.strictObject({email:z.email().max(254),rol:z.enum(['PM','ESPECIALISTA','VISUALIZADOR'])}),
  accept:z.strictObject({token:z.string().regex(/^[A-Za-z0-9_-]{43}$/),password:z.string().min(14).max(1024).optional()}),
  role:z.strictObject({rol:role,alcance:z.enum(['GLOBAL','ASIGNADOS'])}),
  reset:z.strictObject({token:z.string().regex(/^[A-Za-z0-9_-]{43}$/),password:z.string().min(14).max(1024)}),
  project:z.strictObject({workspaceId:id,tvt:z.string().trim().min(1).max(80),nombre:name,clienteId:id,paisId:id,lobId:id,pmTitularId:id.optional()}),
  projectEdit:z.strictObject({nombre:name,version:id}),
  transfer:z.strictObject({workspaceId:id,pmTitularId:id,version:id}),
  substitution:z.strictObject({delegateId:id,start:z.iso.datetime({offset:true}),end:z.iso.datetime({offset:true}),reason:z.string().trim().min(1).max(2000),permissions:z.array(z.string().min(1).max(100)).min(1).max(20)}),
  member:z.strictObject({estado:z.enum(['ACTIVA','SUSPENDIDA','RETIRADA'])}),
  participant:z.strictObject({userId:id,funcion:z.enum(['ESPECIALISTA','OBSERVADOR'])}),
  list:z.strictObject({after:cursor.optional(),limit:z.string().regex(/^(?:[1-9]|[1-9][0-9]|100)$/).optional()}),
};
const workspace=z.strictObject({id,nombre:z.string(),slug:z.string(),version:id});
const project=z.strictObject({id,tvt:z.string(),nombre:z.string(),workspaceId:id,version:id});
export const outputs={
  workspace,workspaces:z.array(workspace),project,
  projectDetail:project.extend({estado:z.string()}),projects:z.array(project.extend({estado:z.string()})),
  session:z.strictObject({identifier:z.string(),expiresAt:z.iso.datetime(),role:role.nullable(),permissions:z.array(z.string())}),
  closed:z.strictObject({status:z.literal('closed')}),
  invitation:z.strictObject({id,token:z.string(),expiresAt:z.iso.datetime(),delivery:z.literal('PENDING')}),
  accepted:z.strictObject({workspaceId:id,userId:id}),
  enabled:z.strictObject({id,enabled:z.boolean()}),
  assignment:z.strictObject({userId:id,role,scope:z.enum(['GLOBAL','ASIGNADOS']),assignmentId:id}),
  inactive:z.strictObject({userId:id,status:z.literal('INACTIVE')}),
  recovery:z.strictObject({userId:id,token:z.string(),expiresInSeconds:z.literal(1800),delivery:z.literal('PENDING')}),
  reset:z.strictObject({status:z.literal('PASSWORD_UPDATED')}),
  transferred:z.strictObject({id,tvt:z.string(),workspaceId:id,pmTitularId:id,version:id}),
  substitution:z.strictObject({id,projectId:id,delegateId:id,start:z.iso.datetime(),end:z.iso.datetime(),state:z.literal('ACTIVA')}),
  revoked:z.strictObject({id,state:z.literal('REVOCADA')}),
  member:z.strictObject({id,estado:z.enum(['ACTIVA','SUSPENDIDA','RETIRADA'])}),
  participant:z.strictObject({id,projectId:id,userId:id,funcion:z.enum(['ESPECIALISTA','OBSERVADOR'])}),
  roleRevoked:z.strictObject({userId:id,status:z.literal('ROLE_REVOKED')}),
  health:z.strictObject({status:z.literal('ok'),version:z.literal('2.1.0')}),
  ready:z.strictObject({status:z.literal('ready'),migration:z.string().nullable()}),
};
export const errorSchema=z.strictObject({error:z.strictObject({code:z.string(),message:z.string(),fields:z.record(z.string(),z.string()).optional()}),requestId:z.string()});
