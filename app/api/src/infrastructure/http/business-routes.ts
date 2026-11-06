import {driveStatus} from '../../application/drive/status';
import {driveStatusOutput} from './contracts';
import {queryBilling,queryIndicators,writeBilling} from '../../application/billing';
import {billingContracts} from './contracts';
import {Hono, type Context} from 'hono';
import {z} from 'zod';
import {ApiError,respond,respondError} from '../../errors';
import {sql,readiness} from '../../db';
import {assertOrigin,requireSession,sessionFrom,login,logout,renew,publicSession,sessionCookie,refreshCookie,expiredCookie,expiredRefreshCookie} from '../../session';
import {activeActor,hasGrant} from '../../authorization';
import {createWorkspace} from '../../application/workspaces/create';
import {
  enableProjectCreation,
  updateWorkspaceName,
  changeMembership,
  listWorkspaces,
  getWorkspaceDetail,
  listWorkspaceMembers,
  listWorkspaceInvitations,
  listWorkspaceEligibleUsers,
} from '../../application/workspaces/manage';
import {acceptWorkspaceInvitation,inviteToWorkspace,revokeInvitation} from '../../application/workspaces/invitation';
import {changeCorporateRole,deactivateUser,revokeCorporateRole} from '../../application/users/manage';
import {issueRecovery,resetPassword} from '../../application/users/recovery';
import {startExecution} from '../../application/projects/start';
import {createProject} from '../../application/projects/create';
import {editProjectName} from '../../application/projects/edit';
import {transferProject} from '../../application/projects/transfer';
import {designateSubstitution,revokeSubstitution} from '../../application/projects/substitution';
import {addParticipant} from '../../application/projects/participation';
import {
  queryPortfolio,
  getProjectPresentation,
  getProjectAssignments,
} from '../../application/projects/portfolio';
import {id,inputs,outputs,errorSchema} from './contracts';
import {searchClients,createClient,listCountries,listLobs} from '../../application/clients';

type RouteContext={actor:string;request:Request;param:(name:string)=>string;query:Record<string,string>};
type Options={auth?:'none'|'optional'|'required';status?:number;query?:z.ZodType;policy:string};
const grants:Record<string,string>={
  'GET /api/v1/proyectos/:id/drive/carpetas':'proyectos.consultar',
  'GET /api/v1/proyectos/:id/facturacion':'proyectos.consultar',
  'GET /api/v1/proyectos/:id/facturacion/indicadores':'proyectos.consultar',
  'POST /api/v1/proyectos/:id/facturacion/hitos':'facturacion.reportar',
  'PATCH /api/v1/proyectos/:id/facturacion/hitos/:hitoId':'facturacion.reportar',
  'GET /api/v1/workspaces':'workspaces.consultar','POST /api/v1/workspaces':'workspaces.crear',
  'GET /api/v1/workspaces/:id':'workspaces.consultar',
  'PATCH /api/v1/workspaces/:id':'workspaces.configurar',
  'GET /api/v1/workspaces/:id/miembros':'workspaces.consultar',
  'POST /api/v1/workspaces/:id/miembros/:userId/habilitacion-creacion':'workspaces.creacion_habilitar',
  'PATCH /api/v1/workspaces/:id/miembros/:userId':'workspaces.miembros.gestionar',
  'GET /api/v1/workspaces/:id/invitaciones':'workspaces.miembros.invitar',
  'POST /api/v1/workspaces/:id/invitaciones':'workspaces.miembros.invitar',
  'POST /api/v1/workspaces/:id/invitaciones/:invitationId/revocacion':'workspaces.miembros.invitar',
  'GET /api/v1/workspaces/:id/elegibles':'workspaces.consultar',
  'GET /api/v1/workspaces/:id/proyectos':'proyectos.consultar',
  'POST /api/v1/usuarios/:id/rol':'usuarios.administrar','DELETE /api/v1/usuarios/:id/rol':'usuarios.administrar',
  'POST /api/v1/usuarios/:id/desactivacion':'usuarios.administrar','POST /api/v1/usuarios/:id/recuperacion':'usuarios.administrar',
  'GET /api/v1/clientes':'proyectos.consultar','POST /api/v1/clientes':'clientes.crear',
  'GET /api/v1/paises':'proyectos.consultar','GET /api/v1/lobs':'proyectos.consultar',
  'GET /api/v1/portafolio':'proyectos.consultar',
  'POST /api/v1/proyectos/:id/inicio':'proyectos.editar','POST /api/v1/proyectos':'proyectos.crear','GET /api/v1/proyectos':'proyectos.consultar',
  'GET /api/v1/proyectos/:id':'proyectos.consultar','PATCH /api/v1/proyectos/:id':'proyectos.editar',
  'GET /api/v1/proyectos/:id/asignaciones':'proyectos.consultar',
  'POST /api/v1/proyectos/:id/transferencia':'proyectos.transferir',
  'POST /api/v1/proyectos/:id/participantes':'proyectos.miembros.gestionar',
  'POST /api/v1/proyectos/:id/suplencias':'suplencias.designar',
  'POST /api/v1/proyectos/:id/suplencias/:delegationId/revocacion':'suplencias.revocar',
};
export function createBusinessApi(){
  const app=new Hono<{Variables:{requestId:string}}>();
  const paths:Record<string,Record<string,unknown>>={};
  const jsonSchema=(schema:z.ZodType)=>z.toJSONSchema(schema,{target:'draft-2020-12'});
  app.use('*',async(c,next)=>{c.set('requestId',crypto.randomUUID());await next();});
  app.onError(async(error,c)=>{
    if(error instanceof ApiError&&error.status===403){
      const actor=await sessionFrom(c.req.raw);
      await sql`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,operacion,recurso_tipo,resultado,detalle)
        VALUES (${actor?.userId??null},'http.denegado','solicitud','DENEGADO',
          ${{method:c.req.method,path:new URL(c.req.url).pathname,code:error.code,requestId:c.get('requestId')}}::jsonb)`;
    }
    return respondError(error,c.get('requestId'));
  });
  const parse=<T>(schema:z.ZodType<T>,value:unknown):T=>{
    const result=schema.safeParse(value);
    if(!result.success)throw new ApiError(422,'INVALID_FIELD','Datos de entrada no válidos.',
      Object.fromEntries(result.error.issues.map(issue=>[issue.path.join('.'),issue.message])));
    return result.data;
  };
  function route<T>(method:string,path:string,input:z.ZodType<T>|null,output:z.ZodType,options:Options,
    handler:(context:RouteContext,input:T,c:Context)=>Promise<unknown>){
    const specPath=path.replace(/:([A-Za-z]+)/g,'{$1}');
    const parameters:Array<Record<string,unknown>>=[...path.matchAll(/:([A-Za-z]+)/g)].map(match=>({name:match[1],in:'path',required:true,schema:jsonSchema(id)}));
    if(!['GET','HEAD'].includes(method))parameters.push({name:'Origin',in:'header',required:true,schema:{type:'string',format:'uri'},description:'Origen exacto autorizado por APP_ORIGINS; defensa CSRF.'});
    if(options.query)for(const [name,schema] of Object.entries((jsonSchema(options.query) as {properties:Record<string,unknown>}).properties))
      parameters.push({name,in:'query',required:false,schema});
    const responses:Record<string,unknown>={};
    for(const status of [400,401,403,404,409,410,413,415,422,429,500,503])responses[status]={description:'Error controlado; no contiene SQL ni secretos',content:{'application/json':{schema:{$ref:'#/components/schemas/ApiError'}}}};
    responses[options.status??200]={description:'Éxito',content:{'application/json':{schema:jsonSchema(z.strictObject({data:output}))}}};
    paths[specPath]??={};
    paths[specPath]![method.toLowerCase()]={operationId:method.toLowerCase()+specPath.replace(/[^A-Za-z0-9]/g,'_'),
      description:options.policy,'x-permission':grants[method+' '+path],security:path==='/api/v1/sesion/renovar'?[{refreshCookie:[]}]:options.auth==='optional'?[{},{accessCookie:[]}]:options.auth==='none'?[]:[{accessCookie:[]}],
      parameters,...(input?{requestBody:{required:true,content:{'application/json':{schema:jsonSchema(input)}}}}:{}),responses};
    app.on(method,path,async c=>{
      assertOrigin(c.req.raw);
      const identity=options.auth==='none'||options.auth==='optional'?null:await requireSession(c.req.raw);
      const grant=grants[method+' '+path];
      if(identity&&grant&&!await hasGrant(identity.userId,grant))throw new ApiError(403,'FORBIDDEN','No tienes permiso para esta operación.');
      for(const parameter of path.matchAll(/:([A-Za-z]+)/g))parse(id,c.req.param(parameter[1]!));
      const query=Object.fromEntries(new URL(c.req.url).searchParams);
      if(options.query)parse(options.query,query);
      else if(Object.keys(query).length)throw new ApiError(422,'INVALID_QUERY','Esta operación no admite filtros.');
      let value:unknown=undefined;
      if(input){
        if(!c.req.header('content-type')?.toLowerCase().startsWith('application/json'))throw new ApiError(415,'JSON_REQUIRED','Se requiere application/json.');
        const raw=await c.req.text();
        if(raw.length>8192)throw new ApiError(413,'BODY_TOO_LARGE','El cuerpo es demasiado grande.');
        try{value=JSON.parse(raw);}catch{throw new ApiError(400,'INVALID_JSON','El cuerpo debe ser JSON válido.');}
        value=parse(input,value);
      }else if(!['GET','HEAD'].includes(method)&&await c.req.text())
        throw new ApiError(422,'UNEXPECTED_BODY','Esta operación no admite cuerpo.');
      const result=await handler({actor:identity?.userId??'',request:c.req.raw,param:name=>parse(id,c.req.param(name)),query},value as T,c);
      const checked=output.safeParse(result);
      if(!checked.success){console.error('Respuesta fuera de contrato',method,path);throw new Error('RESPONSE_CONTRACT');}
      const response=respond(checked.data,c.get('requestId'),options.status??200);
      // Hono prepared headers carry the HttpOnly cookies set by auth handlers.
      const cookies=c.res.headers.getSetCookie();
      for(const cookie of cookies)response.headers.append('set-cookie',cookie);
      return response;
    });
  }
  const setCookies=(c:Context,s:{accessToken?:string;refreshToken?:string})=>{
    c.header('set-cookie',sessionCookie(s.accessToken!),{append:true});
    c.header('set-cookie',refreshCookie(s.refreshToken!),{append:true});
  };
  route('GET','/api/v1/salud',null,outputs.health,{auth:'none',policy:'Salud del proceso, sin datos internos.'},async()=>({status:'ok',version:'2.1.0'}));
  route('GET','/api/v1/listo',null,outputs.ready,{auth:'none',policy:'Disponibilidad de PostgreSQL y migración.'},async()=>{const state=await readiness();return {status:'ready',migration:state.migration};});
  route('POST','/api/v1/sesion',inputs.login,outputs.session,{auth:'none',policy:'Correo/contraseña. Bloqueo tras cinco fallos; cookies HttpOnly.'},async(_,input,c)=>{
    const session=await login(input.identifier,input.password);
    if(!session)throw new ApiError(401,'INVALID_CREDENTIALS','Identificación o contraseña incorrectas.');
    setCookies(c,session);return publicSession(session);
  });
  route('GET','/api/v1/sesion',null,outputs.session,{policy:'Restauración; usuario activo y rol vigente.'},async ctx=>publicSession(await requireSession(ctx.request)));
  route('POST','/api/v1/sesion/renovar',null,outputs.session,{auth:'none',policy:'Cookie refresh opaca de uso único; rotación atómica.'},async(ctx,_,c)=>{const s=await renew(ctx.request);setCookies(c,s);return publicSession(s);});
  route('DELETE','/api/v1/sesion',null,outputs.closed,{auth:'none',policy:'Revoca refresh y versión de acceso, cierre idempotente.'},async(ctx,_,c)=>{await logout(ctx.request);c.header('set-cookie',expiredCookie(),{append:true});c.header('set-cookie',expiredRefreshCookie(),{append:true});return {status:'closed'};});
  route('POST','/api/v1/workspaces',inputs.workspace,outputs.workspace,{status:201,policy:'ADMIN o PM; PM creador obtiene membresía habilitada atómicamente.'},async(ctx,v)=>createWorkspace(ctx.actor,v.nombre));
  route('GET','/api/v1/workspaces',null,outputs.workspaces,{query:inputs.workspaceList,policy:'Head global; demás solo membresía activa, cursor after, búsqueda q y limit 1–100.'},async ctx=>listWorkspaces(ctx.actor,ctx.query));
  route('GET','/api/v1/workspaces/:id',null,outputs.workspaceDetail,{policy:'Detalle de workspace autorizado; permisos contextuales y conteos reales. 403 sin revelar existencia a no miembros.'},async ctx=>getWorkspaceDetail(ctx.actor,ctx.param('id')));
  route('PATCH','/api/v1/workspaces/:id',inputs.workspaceEdit,outputs.workspace,{policy:'Head global; PM creador o habilitado. Slug inmutable; versión optimista.'},async(ctx,v)=>updateWorkspaceName(ctx.actor,ctx.param('id'),v.nombre,v.version));
  route('GET','/api/v1/workspaces/:id/miembros',null,outputs.workspaceMembers,{query:inputs.workspaceMembersQuery,policy:'Miembros del workspace autorizado con estado, rol corporativo y elegibilidad de titular; oculta correos internos a externos.'},async ctx=>listWorkspaceMembers(ctx.actor,ctx.param('id'),ctx.query));
  route('POST','/api/v1/workspaces/:id/miembros/:userId/habilitacion-creacion',inputs.enable,outputs.enabled,{policy:'Solo Head; miembro PM interno activo.'},async(ctx,v)=>enableProjectCreation(ctx.actor,ctx.param('id'),ctx.param('userId'),v.habilitado));
  route('PATCH','/api/v1/workspaces/:id/miembros/:userId',inputs.member,outputs.member,{policy:'Head gestiona membresía; restricción diferida protege al titular.'},async(ctx,v)=>changeMembership(ctx.actor,ctx.param('id'),ctx.param('userId'),v.estado));
  route('GET','/api/v1/workspaces/:id/invitaciones',null,outputs.workspaceInvitations,{query:inputs.workspaceInvitationsQuery,policy:'Solo Head o PM creador/habilitado del workspace. Nunca expone token ni hash.'},async ctx=>listWorkspaceInvitations(ctx.actor,ctx.param('id'),ctx.query));
  route('POST','/api/v1/workspaces/:id/invitaciones',inputs.invitation,outputs.invitation,{status:201,policy:'Head o PM creador/habilitado. Token solo en entrega administrativa controlada; PM no promueve.'},async(ctx,v)=>inviteToWorkspace(ctx.actor,ctx.param('id'),v.email,v.rol));
  route('POST','/api/v1/workspaces/:id/invitaciones/:invitationId/revocacion',null,outputs.revoked,{policy:'Head o invitador todavía autorizado; no borra historia.'},async ctx=>revokeInvitation(ctx.actor,ctx.param('id'),ctx.param('invitationId')));
  route('POST','/api/v1/invitaciones/aceptar',inputs.accept,outputs.accepted,{auth:'optional',policy:'Token de un solo uso; cuenta existente autenticada coincidente; nueva cuenta sin elección de rol.'},async(ctx,v)=>acceptWorkspaceInvitation(v.token,(await sessionFrom(ctx.request))?.userId??null,v.password));
  route('GET','/api/v1/workspaces/:id/elegibles',null,outputs.workspaceEligible,{query:inputs.workspaceEligibleQuery,policy:'Solo Head o PM miembro activo del workspace; candidatos elegibles para titular, suplente, especialista u observador.'},async ctx=>listWorkspaceEligibleUsers(ctx.actor,ctx.param('id'),ctx.query));
  route('GET','/api/v1/workspaces/:id/proyectos',null,outputs.portfolio,{query:inputs.workspacePortfolioQuery,policy:'Portafolio acotado al workspace autorizado con búsqueda, filtros, ordenamiento, paginación y conteo por estado.'},async ctx=>queryPortfolio(ctx.actor,ctx.query,ctx.param('id')));
  route('POST','/api/v1/usuarios/:id/rol',inputs.role,outputs.assignment,{policy:'Solo Head; sin autopromoción; externo solo VISUALIZADOR ASIGNADOS.'},async(ctx,v)=>changeCorporateRole(ctx.actor,ctx.param('id'),v.rol,v.alcance));
  route('DELETE','/api/v1/usuarios/:id/rol',null,outputs.roleRevoked,{policy:'Solo Head; revoca rol y sesiones; titular requiere reemplazo previo.'},async ctx=>revokeCorporateRole(ctx.actor,ctx.param('id')));
  route('POST','/api/v1/usuarios/:id/desactivacion',null,outputs.inactive,{policy:'Solo Head, sin autodesactivación; invalida sesiones.'},async ctx=>deactivateUser(ctx.actor,ctx.param('id')));
  route('POST','/api/v1/usuarios/:id/recuperacion',null,outputs.recovery,{status:201,policy:'Solo Head tras verificación administrativa. Token en entrega controlada, no notificación simulada.'},async ctx=>issueRecovery(ctx.actor,ctx.param('id')));
  route('POST','/api/v1/credenciales/restablecer',inputs.reset,outputs.reset,{auth:'none',policy:'Token de recuperación hash, plazo 30 minutos y uso único; revoca sesiones.'},async(_,v)=>resetPassword(v.token,v.password));
  route('GET','/api/v1/clientes',null,outputs.clients,{query:inputs.clientsQuery,policy:'ADMIN/PM internos activos con consulta de proyectos. Clientes activos; q literal parcial sin distinción de mayúsculas; orden id ASC; cursor after, limit 1–100 (defecto 50). Total del filtro completo, nextCursor solo si hasMore.'},async ctx=>searchClients(ctx.actor,ctx.query));
  route('POST','/api/v1/clientes',inputs.client,outputs.client,{status:201,policy:'Propuesta G1 del propietario para desarrollo: ADMIN/PM internos activos y permiso independiente clientes.crear. Producción requiere ratificación. Nombres repetidos permitidos; inserción y auditoría atómicas.'},async(ctx,v)=>createClient(ctx.actor,v.nombre,v.estadoCliente));
  route('GET','/api/v1/paises',null,outputs.countries,{policy:'Lectura G1 de países activos preestablecidos para actores internos con proyectos.consultar. Lista completa, sin truncamiento; sin administración.'},async ctx=>listCountries(ctx.actor));
  route('GET','/api/v1/lobs',null,outputs.lobs,{policy:'Lectura G1 de LOB activas preestablecidas para actores internos con proyectos.consultar. Lista completa, sin truncamiento; sin administración.'},async ctx=>listLobs(ctx.actor));
  route('GET','/api/v1/portafolio',null,outputs.portfolio,{query:inputs.portfolioQuery,policy:'Portafolio denso con visibilidad por perfil (Head/PM/Visualizador global; Especialista/Visualizador asignado/Externo solo asignados), búsqueda, filtros, ordenamiento, paginación y resumen por estado.'},async ctx=>queryPortfolio(ctx.actor,ctx.query));
  route('POST','/api/v1/proyectos',inputs.project,outputs.projectDetail,{status:201,policy:'Head elige titular elegible; PM habilitado se asigna a sí mismo. TVT único global; atributos base y primera línea base opcionales.'},async(ctx,v)=>{const created=await createProject(ctx.actor,v);return getProjectPresentation(ctx.actor,created.id)});
  route('GET','/api/v1/proyectos',null,outputs.projects,{query:inputs.list,policy:'Head/PM global; Especialista asignado; Visualizador interno global/asignado; externo solo asignado. Cursor after y limit 1–100.'},async ctx=>{
    const actor=await activeActor(ctx.actor);
    if(!actor||!await hasGrant(ctx.actor,'proyectos.consultar'))throw new ApiError(403,'FORBIDDEN','Acceso no autorizado.');
    const limit=Number(ctx.query.limit??50),after=ctx.query.after??'0';
    const global=actor.role==='ADMIN'||actor.role==='PM'||(actor.role==='VISUALIZADOR'&&actor.kind==='INTERNO'&&actor.readScope==='GLOBAL');
    return global?sql`SELECT id::text,tvt,nombre,workspace_id::text AS "workspaceId",version::text,estado_actual AS estado FROM pmo_cusn.proyecto WHERE activo AND id>${after}::bigint ORDER BY id LIMIT ${limit}`:
      sql`SELECT p.id::text,p.tvt,p.nombre,p.workspace_id::text AS "workspaceId",p.version::text,p.estado_actual AS estado FROM pmo_cusn.proyecto p WHERE p.activo AND p.id>${after}::bigint AND EXISTS(SELECT 1 FROM pmo_cusn.participacion_proyecto pp WHERE pp.proyecto_id=p.id AND pp.usuario_id=${ctx.actor} AND pp.fecha_inicio<=now() AND (pp.fecha_fin IS NULL OR pp.fecha_fin>now())) ORDER BY p.id LIMIT ${limit}`;
  });
  route('GET','/api/v1/proyectos/:id/drive/carpetas',null,driveStatusOutput,{policy:'Referencias documentales internas: Head o titular/suplente con consulta y edición contextual. Sin contenido ni garantía de ACL del usuario; NO_SOLICITADO es ausencia de intención durable. No concede permisos Drive.'},async ctx=>driveStatus(ctx.actor,ctx.param('id')));
  route('GET','/api/v1/proyectos/:id/facturacion',null,billingContracts.summary,{query:billingContracts.query,policy:'Finanzas internas del proyecto: consulta y facturacion.reportar contextual (Head/titular/suplente). Ventana hasta 60 meses; defecto año UTC actual; hitos cursor ID, totales ventana completa; máximo 10000 filas, exceso 422. Real reportado no conciliado ERP.'},async ctx=>queryBilling(ctx.actor,ctx.param('id'),ctx.query));
  route('GET','/api/v1/proyectos/:id/facturacion/indicadores',null,billingContracts.indicators,{query:billingContracts.cutoff,policy:'CPI interno por moneda, corte mensual inclusivo requerido. Sin exigibles null; base cero pendiente de política. Mismo alcance financiero interno.'},async ctx=>queryIndicators(ctx.actor,ctx.param('id'),ctx.query.corte!));
  route('POST','/api/v1/proyectos/:id/facturacion/hitos',billingContracts.create,billingContracts.line,{status:201,policy:'Hito MANUAL, titular/suplente con facturacion.reportar o Head. claveRegistro UUID única por proyecto: reintento idéntico retorna mismo hito; contenido distinto 409. No modifica contrato.'},async(ctx,v)=>writeBilling(ctx.actor,ctx.param('id'),v));
  route('PATCH','/api/v1/proyectos/:id/facturacion/hitos/:hitoId',billingContracts.edit,billingContracts.line,{policy:'Reemplaza campos editables del hito MANUAL del proyecto; version y claveRegistro requeridas. Clave/proyecto/origen inmutables; conflicto versión 409.'},async(ctx,v)=>writeBilling(ctx.actor,ctx.param('id'),v,ctx.param('hitoId'),v.version));
  route('GET','/api/v1/proyectos/:id',null,outputs.projectDetail,{policy:'Ficha de presentación del proyecto con identidad, gobierno, planificación, permisos contextuales y confidencialidad para externos; 403 no revela existencia.'},async ctx=>getProjectPresentation(ctx.actor,ctx.param('id')));
  route('GET','/api/v1/proyectos/:id/asignaciones',null,outputs.projectAssignments,{policy:'Asignaciones del proyecto separando rol corporativo, membresía de workspace, titular PM, participaciones y suplencias vigentes.'},async ctx=>getProjectAssignments(ctx.actor,ctx.param('id')));
  route('POST','/api/v1/proyectos/:id/inicio',inputs.start,outputs.project,{policy:'Head o PM titular/suplente con proyectos.editar; version requerida; arranque unico Requiere P1P2 a En ejecución, fecha civil America/Santiago sellada por servidor; repeticion 409.'},async(ctx,v)=>startExecution(ctx.actor,ctx.param('id'),v.version));
  route('PATCH','/api/v1/proyectos/:id',inputs.projectEdit,outputs.project,{policy:'Head o titular/suplente vigente con permiso; edita atributos base y fija primera línea base inmutable; lock y versión, 409 al conflicto.'},async(ctx,v)=>editProjectName(ctx.actor,ctx.param('id'),v.version,v));
  route('POST','/api/v1/proyectos/:id/transferencia',inputs.transfer,outputs.transferred,{policy:'Solo Head; transferencia o reasignación, continuidad de titular y versión.'},async(ctx,v)=>transferProject(ctx.actor,ctx.param('id'),v));
  route('POST','/api/v1/proyectos/:id/participantes',inputs.participant,outputs.participant,{status:201,policy:'Head o titular; Especialista/observador sin edición implícita; membresía activa.'},async(ctx,v)=>addParticipant(ctx.actor,ctx.param('id'),v.userId,v.funcion));
  route('POST','/api/v1/proyectos/:id/suplencias',inputs.substitution,outputs.substitution,{status:201,policy:'Head o PM titular vigente. PM suplente interno activo, UTC [inicio,fin), sin solapes.'},async(ctx,v)=>designateSubstitution(ctx.actor,ctx.param('id'),v));
  route('POST','/api/v1/proyectos/:id/suplencias/:delegationId/revocacion',null,outputs.revoked,{policy:'Head o PM titular vigente autorizado; historia conservada.'},async ctx=>revokeSubstitution(ctx.actor,ctx.param('id'),ctx.param('delegationId')));
  app.get('/api/v1/openapi.json',c=>c.json({openapi:'3.1.0',info:{title:'PMO gobierno y acceso',version:'2.1.0'},components:{schemas:{ApiError:jsonSchema(errorSchema)},securitySchemes:{accessCookie:{type:'apiKey',in:'cookie',name:'pmo_access'},refreshCookie:{type:'apiKey',in:'cookie',name:'pmo_refresh'}}},paths}));
  app.notFound(c=>respondError(new ApiError(404,'NOT_FOUND','Ruta no encontrada.'),c.get('requestId')));
  return app;
}
