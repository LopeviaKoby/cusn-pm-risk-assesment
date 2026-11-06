import { createHash, randomBytes } from "node:crypto";
import { sql } from "../../db";
import { activeActor } from "../../authorization";
import { ApiError } from "../../errors";

const digest=(token:string)=>createHash("sha256").update(token).digest("hex");
type Role="PM"|"ESPECIALISTA"|"VISUALIZADOR";

export async function inviteToWorkspace(actorId:string,workspaceId:string,emailInput:string,role:Role){
  const email=emailInput.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw new ApiError(422,"INVALID_EMAIL","Correo no válido.");
  return sql.begin(async tx=>{
    const actor=await activeActor(actorId,tx);
    if(!actor||!["ADMIN","PM"].includes(actor.role))throw new ApiError(403,"FORBIDDEN","No puedes invitar miembros.");
    const [workspace]=await tx<{id:string;creatorId:string}>`SELECT id::text,creado_por_id::text AS "creatorId" FROM pmo_cusn.workspace
      WHERE id=${workspaceId} AND estado='ACTIVO' FOR SHARE`;
    if(!workspace)throw new ApiError(404,"NOT_FOUND","Workspace no encontrado.");
    if(actor.role==='PM'){
      const [member]=await tx<{id:string}>`SELECT id::text FROM pmo_cusn.membresia_workspace WHERE workspace_id=${workspaceId}
        AND usuario_id=${actorId} AND estado='ACTIVA' AND (puede_crear_proyectos OR ${workspace.creatorId}=${actorId}) FOR SHARE`;
      if(!member)throw new ApiError(403,"FORBIDDEN","No puedes invitar a este workspace.");
    }
    const [existing]=await tx<{id:string;role:string|null}>`SELECT u.id::text,r.codigo AS role FROM pmo_cusn.usuario u
      LEFT JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
      LEFT JOIN pmo_cusn.rol r ON r.id=a.rol_id WHERE lower(btrim(u.email))=${email}`;
    if(actor.role==='PM'&&role==='PM'&&existing?.role!=='PM')throw new ApiError(403,"FORBIDDEN","PM solo invita a otro PM ya existente como observador.");
    if(existing?.role && existing.role!==role)throw new ApiError(409,"ROLE_CONFLICT","La cuenta ya tiene otro rol; Head debe gestionarlo por separado.");
    const token=randomBytes(32).toString("base64url");
    await tx`UPDATE pmo_cusn.invitacion_workspace SET estado='EXPIRADA' WHERE workspace_id=${workspaceId}
      AND lower(btrim(email_destinatario))=${email} AND estado='PENDIENTE' AND expires_at<=now()`;
    const [invitation]=await tx<{id:string;expiresAt:Date}>`INSERT INTO pmo_cusn.invitacion_workspace
      (workspace_id,email_destinatario,invitado_por_id,rol_solicitado_id,token_hash,expires_at)
      SELECT ${workspaceId},${email},${actorId},r.id,${digest(token)},now()+interval '7 days'
      FROM pmo_cusn.rol r WHERE r.codigo=${role} RETURNING id::text,expires_at AS "expiresAt"`;
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${workspaceId},'workspaces.miembros.invitar','invitacion_workspace',${invitation!.id},'PERMITIDO')`;
    // Delivery is intentionally delegated to the authorized caller. No notification is claimed.
    return {id:invitation!.id,token,expiresAt:invitation!.expiresAt.toISOString(),delivery:'PENDING'};
  });
}

export async function acceptWorkspaceInvitation(token:string,actorId:string|null,newPassword?:string){
  if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw new ApiError(404,"INVITATION_NOT_FOUND","Invitación no disponible.");
  return sql.begin(async tx=>{
    const [invitation]=await tx<{id:string;workspaceId:string;email:string;role:string;inviterId:string;expiresAt:Date;status:string}>`
      SELECT i.id::text,i.workspace_id::text AS "workspaceId",i.email_destinatario AS email,r.codigo AS role,
        i.invitado_por_id::text AS "inviterId",i.expires_at AS "expiresAt",i.estado AS status
      FROM pmo_cusn.invitacion_workspace i JOIN pmo_cusn.rol r ON r.id=i.rol_solicitado_id
      WHERE i.token_hash=${digest(token)} FOR UPDATE OF i`;
    if(!invitation||invitation.status!=='PENDIENTE'||invitation.expiresAt<=new Date())throw new ApiError(410,"INVITATION_EXPIRED","Invitación no vigente.");
    const inviter=await activeActor(invitation.inviterId,tx);
    if(!inviter||!["ADMIN","PM"].includes(inviter.role))throw new ApiError(403,"INVITER_INACTIVE","El invitador ya no está autorizado.");
    if(inviter.role==='PM'){
      const [member]=await tx`SELECT id FROM pmo_cusn.membresia_workspace WHERE workspace_id=${invitation.workspaceId}
        AND usuario_id=${invitation.inviterId} AND estado='ACTIVA' AND (puede_crear_proyectos OR EXISTS(
          SELECT 1 FROM pmo_cusn.workspace WHERE id=${invitation.workspaceId} AND creado_por_id=${invitation.inviterId})) FOR SHARE`;
      if(!member)throw new ApiError(403,"INVITER_INACTIVE","El invitador ya no pertenece al workspace.");
    }
    const [existing]=await tx<{id:string;role:string|null}>`SELECT u.id::text,r.codigo AS role FROM pmo_cusn.usuario u
      LEFT JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
      LEFT JOIN pmo_cusn.rol r ON r.id=a.rol_id WHERE lower(btrim(u.email))=lower(btrim(${invitation.email})) FOR UPDATE OF u`;
    let userId=existing?.id;
    if(existing){
      if(actorId!==userId)throw new ApiError(403,"IDENTITY_REQUIRED","Inicia sesión con la cuenta invitada.");
      if(existing.role!==invitation.role)throw new ApiError(409,"ROLE_CONFLICT","El rol vigente no coincide con la invitación.");
    }else{
      if(actorId||!newPassword||newPassword.length<14||newPassword.length>1024)throw new ApiError(422,"PASSWORD_REQUIRED","Define una contraseña de 14 a 1024 caracteres.");
      if(inviter.role==='PM'&&!['ESPECIALISTA','VISUALIZADOR'].includes(invitation.role))throw new ApiError(403,"FORBIDDEN","El PM no puede crear esta cuenta.");
      const [created]=await tx<{id:string}>`INSERT INTO pmo_cusn.usuario(email,nombre,password_hash)
        VALUES (${invitation.email},${invitation.email},${await Bun.password.hash(newPassword,{algorithm:'argon2id'})}) RETURNING id::text`;
      userId=created!.id;
      await tx`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura,asignado_por_id)
        SELECT ${userId},id,'ASIGNADOS',${invitation.inviterId} FROM pmo_cusn.rol WHERE codigo=${invitation.role}`;
    }
    await tx`INSERT INTO pmo_cusn.membresia_workspace(workspace_id,usuario_id,incorporado_por_id)
      VALUES (${invitation.workspaceId},${userId},${invitation.inviterId})
      ON CONFLICT (workspace_id,usuario_id) DO UPDATE SET estado='ACTIVA',updated_at=now()`;
    await tx`UPDATE pmo_cusn.invitacion_workspace SET estado='ACEPTADA',accepted_at=now() WHERE id=${invitation.id}`;
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${userId},${invitation.workspaceId},'workspaces.miembros.aceptar','invitacion_workspace',${invitation.id},'PERMITIDO')`;
    return {workspaceId:invitation.workspaceId,userId};
  });
}

export async function revokeInvitation(actorId:string,workspaceId:string,invitationId:string){
  return sql.begin(async tx=>{
    const actor=await activeActor(actorId,tx);
    const [invitation]=await tx<{id:string;inviterId:string}>`SELECT id::text,invitado_por_id::text AS "inviterId"
      FROM pmo_cusn.invitacion_workspace WHERE id=${invitationId} AND workspace_id=${workspaceId} AND estado='PENDIENTE' FOR UPDATE`;
    if(!actor||!['ADMIN','PM'].includes(actor.role))throw new ApiError(403,'FORBIDDEN','No puedes revocar invitaciones.');
    if(!invitation)throw new ApiError(404,'NOT_FOUND','Invitación no encontrada.');
    if(actor.role!=='ADMIN'){
      const [member]=await tx`SELECT m.id FROM pmo_cusn.membresia_workspace m JOIN pmo_cusn.workspace w ON w.id=m.workspace_id
        WHERE w.id=${workspaceId} AND m.usuario_id=${actorId} AND m.estado='ACTIVA'
          AND (m.puede_crear_proyectos OR w.creado_por_id=${actorId}) FOR SHARE OF m,w`;
      if(!member||invitation.inviterId!==actorId)throw new ApiError(403,'FORBIDDEN','No puedes revocar esta invitación.');
    }
    await tx`UPDATE pmo_cusn.invitacion_workspace SET estado='REVOCADA' WHERE id=${invitationId}`;
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${workspaceId},'workspaces.invitaciones.revocar','invitacion_workspace',${invitationId},'PERMITIDO')`;
    return {id:invitationId,state:'REVOCADA'};
  });
}
