import { sql } from "../../db";
import { activeActor, hasGrant } from "../../authorization";
import { ApiError } from "../../errors";

const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

async function assertWorkspaceReader(actorId: string, workspaceId: string) {
  const actor = await activeActor(actorId);
  if (!actor || !(await hasGrant(actorId, "workspaces.consultar"))) {
    throw new ApiError(403, "FORBIDDEN", "Acceso no autorizado.");
  }
  const [workspace] = await sql<{
    id: string;
    nombre: string;
    slug: string;
    estado: "ACTIVO" | "ARCHIVADO";
    version: string;
    creadoPorId: string;
    createdAt: Date;
    updatedAt: Date;
  }>`SELECT id::text,nombre,slug,estado,version::text,creado_por_id::text AS "creadoPorId",
      created_at AS "createdAt",updated_at AS "updatedAt"
    FROM pmo_cusn.workspace WHERE id=${workspaceId} AND estado='ACTIVO'`;
  if (!workspace) {
    if (actor.role === "ADMIN") throw new ApiError(404, "NOT_FOUND", "Workspace no encontrado.");
    throw new ApiError(403, "FORBIDDEN", "Acceso no autorizado.");
  }
  const [membership] = await sql<{
    id: string;
    estado: "ACTIVA" | "SUSPENDIDA" | "RETIRADA";
    puedeCrearProyectos: boolean;
  }>`SELECT id::text,estado,puede_crear_proyectos AS "puedeCrearProyectos"
    FROM pmo_cusn.membresia_workspace WHERE workspace_id=${workspaceId} AND usuario_id=${actorId}`;
  if (actor.role !== "ADMIN" && membership?.estado !== "ACTIVA") {
    throw new ApiError(403, "FORBIDDEN", "Acceso no autorizado.");
  }
  return { actor, workspace, membership: membership ?? null };
}

export async function listWorkspaces(
  actorId: string,
  query: { after?: string; limit?: string; q?: string } = {},
) {
  const actor = await activeActor(actorId);
  if (!actor || !(await hasGrant(actorId, "workspaces.consultar"))) {
    throw new ApiError(403, "FORBIDDEN", "Acceso no autorizado.");
  }
  const limit = Number(query.limit ?? 50);
  const after = query.after ?? "0";
  const search = query.q?.trim();
  const pattern = search ? `%${escapeLike(search)}%` : null;

  if (actor.role === "ADMIN") {
    return pattern
      ? sql`SELECT id::text,nombre,slug,version::text FROM pmo_cusn.workspace
          WHERE estado='ACTIVO' AND id>${after}::bigint
            AND (nombre ILIKE ${pattern} ESCAPE '\\' OR slug ILIKE ${pattern} ESCAPE '\\')
          ORDER BY id LIMIT ${limit}`
      : sql`SELECT id::text,nombre,slug,version::text FROM pmo_cusn.workspace
          WHERE estado='ACTIVO' AND id>${after}::bigint ORDER BY id LIMIT ${limit}`;
  }
  return pattern
    ? sql`SELECT w.id::text,w.nombre,w.slug,w.version::text
        FROM pmo_cusn.workspace w JOIN pmo_cusn.membresia_workspace m ON m.workspace_id=w.id
        WHERE m.usuario_id=${actorId} AND m.estado='ACTIVA' AND w.estado='ACTIVO'
          AND w.id>${after}::bigint
          AND (w.nombre ILIKE ${pattern} ESCAPE '\\' OR w.slug ILIKE ${pattern} ESCAPE '\\')
        ORDER BY w.id LIMIT ${limit}`
    : sql`SELECT w.id::text,w.nombre,w.slug,w.version::text
        FROM pmo_cusn.workspace w JOIN pmo_cusn.membresia_workspace m ON m.workspace_id=w.id
        WHERE m.usuario_id=${actorId} AND m.estado='ACTIVA' AND w.estado='ACTIVO'
          AND w.id>${after}::bigint
        ORDER BY w.id LIMIT ${limit}`;
}

export async function getWorkspaceDetail(actorId: string, workspaceId: string) {
  const { actor, workspace, membership } = await assertWorkspaceReader(actorId, workspaceId);
  const pmAuthorized =
    actor.role === "PM" &&
    membership?.estado === "ACTIVA" &&
    (membership.puedeCrearProyectos || workspace.creadoPorId === actorId);
  const permisos = {
    puedeConfigurar: actor.role === "ADMIN" || pmAuthorized,
    puedeCrearProyectos:
      actor.role === "ADMIN" ||
      (actor.role === "PM" && membership?.estado === "ACTIVA" && membership.puedeCrearProyectos),
    puedeInvitar: actor.role === "ADMIN" || pmAuthorized,
    puedeGestionarMiembros: actor.role === "ADMIN",
  };
  const globalProjects =
    actor.role === "ADMIN" ||
    actor.role === "PM" ||
    (actor.role === "VISUALIZADOR" && actor.kind === "INTERNO" && actor.readScope === "GLOBAL");
  const [counts] = await sql<{
    miembrosActivos: string;
    proyectosActivos: string;
    invitacionesPendientes: string;
  }>`SELECT
      (SELECT count(*)::text FROM pmo_cusn.membresia_workspace
        WHERE workspace_id=${workspaceId} AND estado='ACTIVA') AS "miembrosActivos",
      ${
        globalProjects
          ? sql`(SELECT count(*)::text FROM pmo_cusn.proyecto WHERE workspace_id=${workspaceId} AND activo)`
          : sql`(SELECT count(*)::text FROM pmo_cusn.proyecto p
              WHERE p.workspace_id=${workspaceId} AND p.activo
                AND EXISTS(SELECT 1 FROM pmo_cusn.participacion_proyecto pp
                  WHERE pp.proyecto_id=p.id AND pp.usuario_id=${actorId}
                    AND pp.fecha_inicio<=now() AND (pp.fecha_fin IS NULL OR pp.fecha_fin>now())))`
      } AS "proyectosActivos",
      ${
        permisos.puedeInvitar
          ? sql`(SELECT count(*)::text FROM pmo_cusn.invitacion_workspace
              WHERE workspace_id=${workspaceId} AND estado='PENDIENTE' AND expires_at>now())`
          : sql`'0'::text`
      } AS "invitacionesPendientes"`;

  return {
    id: workspace.id,
    nombre: workspace.nombre,
    slug: workspace.slug,
    estado: workspace.estado,
    version: workspace.version,
    creadoPorId: workspace.creadoPorId,
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
    miMembresia: membership
      ? {
          id: membership.id,
          estado: membership.estado,
          puedeCrearProyectos: membership.puedeCrearProyectos,
          rol: actor.role,
        }
      : null,
    permisos,
    resumen: {
      miembrosActivos: Number(counts?.miembrosActivos ?? 0),
      proyectosActivos: Number(counts?.proyectosActivos ?? 0),
      invitacionesPendientes: Number(counts?.invitacionesPendientes ?? 0),
    },
  };
}

export async function listWorkspaceMembers(
  actorId: string,
  workspaceId: string,
  query: {
    after?: string;
    limit?: string;
    estado?: "ACTIVA" | "SUSPENDIDA" | "RETIRADA";
    rol?: "ADMIN" | "PM" | "ESPECIALISTA" | "VISUALIZADOR";
    q?: string;
  } = {},
) {
  const { actor } = await assertWorkspaceReader(actorId, workspaceId);
  const limit = Number(query.limit ?? 50);
  const after = query.after ?? "0";
  const estado = query.estado ?? null;
  const rol = query.rol ?? null;
  const search = query.q?.trim();
  const pattern = search ? `%${escapeLike(search)}%` : null;
  const hideEmail = actor.kind === "EXTERNO";

  const [totalRow] = await sql<{ total: string }>`
    SELECT count(*)::text AS total
    FROM pmo_cusn.membresia_workspace m
    JOIN pmo_cusn.usuario u ON u.id=m.usuario_id
    LEFT JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
    LEFT JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.activo
    WHERE m.workspace_id=${workspaceId}
      AND (${estado}::text IS NULL OR m.estado=${estado})
      AND (${rol}::text IS NULL OR r.codigo=${rol})
      AND (${pattern}::text IS NULL OR u.nombre ILIKE ${pattern} ESCAPE '\\'
        OR (NOT ${hideEmail} AND u.email ILIKE ${pattern} ESCAPE '\\'))`;

  const rows = await sql<{
    id: string;
    usuarioId: string;
    nombre: string;
    email: string;
    tipoUsuario: "INTERNO" | "EXTERNO";
    usuarioActivo: boolean;
    rol: "ADMIN" | "PM" | "ESPECIALISTA" | "VISUALIZADOR" | null;
    estado: "ACTIVA" | "SUSPENDIDA" | "RETIRADA";
    puedeCrearProyectos: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>`
    SELECT m.id::text,u.id::text AS "usuarioId",u.nombre,u.email,
      u.tipo_usuario AS "tipoUsuario",u.activo AS "usuarioActivo",
      r.codigo AS rol,m.estado,m.puede_crear_proyectos AS "puedeCrearProyectos",
      m.created_at AS "createdAt",m.updated_at AS "updatedAt"
    FROM pmo_cusn.membresia_workspace m
    JOIN pmo_cusn.usuario u ON u.id=m.usuario_id
    LEFT JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
    LEFT JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.activo
    WHERE m.workspace_id=${workspaceId}
      AND m.id>${after}::bigint
      AND (${estado}::text IS NULL OR m.estado=${estado})
      AND (${rol}::text IS NULL OR r.codigo=${rol})
      AND (${pattern}::text IS NULL OR u.nombre ILIKE ${pattern} ESCAPE '\\'
        OR (NOT ${hideEmail} AND u.email ILIKE ${pattern} ESCAPE '\\'))
    ORDER BY m.id LIMIT ${limit}`;

  const items = rows.map(row => ({
    id: row.id,
    usuarioId: row.usuarioId,
    nombre: row.nombre,
    email: hideEmail ? null : row.email,
    tipoUsuario: row.tipoUsuario,
    usuarioActivo: row.usuarioActivo,
    rol: row.rol,
    estado: row.estado,
    puedeCrearProyectos: row.puedeCrearProyectos,
    esElegibleTitular:
      row.usuarioActivo &&
      row.tipoUsuario === "INTERNO" &&
      row.rol === "PM" &&
      row.estado === "ACTIVA",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  return {
    items,
    nextCursor: items.length === limit ? items[items.length - 1]!.id : null,
    total: Number(totalRow?.total ?? 0),
  };
}

export async function listWorkspaceInvitations(
  actorId: string,
  workspaceId: string,
  query: {
    after?: string;
    limit?: string;
    estado?: "PENDIENTE" | "ACEPTADA" | "REVOCADA" | "EXPIRADA";
  } = {},
) {
  const { actor, workspace, membership } = await assertWorkspaceReader(actorId, workspaceId);
  const canInvite =
    actor.role === "ADMIN" ||
    (actor.role === "PM" &&
      membership?.estado === "ACTIVA" &&
      (membership.puedeCrearProyectos || workspace.creadoPorId === actorId));
  if (!canInvite) {
    throw new ApiError(403, "FORBIDDEN", "No tienes permiso para consultar invitaciones de este workspace.");
  }
  const limit = Number(query.limit ?? 50);
  const after = query.after ?? "0";
  const estado = query.estado ?? null;

  const [totalRow] = await sql<{ total: string }>`
    SELECT count(*)::text AS total
    FROM pmo_cusn.invitacion_workspace i
    WHERE i.workspace_id=${workspaceId}
      AND (${estado}::text IS NULL OR (
        CASE WHEN i.estado='PENDIENTE' AND i.expires_at<=now() THEN 'EXPIRADA' ELSE i.estado END
      )=${estado})`;

  const rows = await sql<{
    id: string;
    workspaceId: string;
    emailDestinatario: string;
    rolSolicitado: "PM" | "ESPECIALISTA" | "VISUALIZADOR";
    puedeCrearProyectos: boolean;
    estado: "PENDIENTE" | "ACEPTADA" | "REVOCADA" | "EXPIRADA";
    invitadoPorId: string;
    expiresAt: Date;
    acceptedAt: Date | null;
    createdAt: Date;
  }>`
    SELECT i.id::text,i.workspace_id::text AS "workspaceId",
      i.email_destinatario AS "emailDestinatario",
      r.codigo AS "rolSolicitado",
      i.puede_crear_proyectos AS "puedeCrearProyectos",
      (CASE WHEN i.estado='PENDIENTE' AND i.expires_at<=now() THEN 'EXPIRADA' ELSE i.estado END) AS estado,
      i.invitado_por_id::text AS "invitadoPorId",
      i.expires_at AS "expiresAt",i.accepted_at AS "acceptedAt",i.created_at AS "createdAt"
    FROM pmo_cusn.invitacion_workspace i
    JOIN pmo_cusn.rol r ON r.id=i.rol_solicitado_id
    WHERE i.workspace_id=${workspaceId}
      AND i.id>${after}::bigint
      AND (${estado}::text IS NULL OR (
        CASE WHEN i.estado='PENDIENTE' AND i.expires_at<=now() THEN 'EXPIRADA' ELSE i.estado END
      )=${estado})
    ORDER BY i.id DESC LIMIT ${limit}`;

  const items = rows.map(row => ({
    id: row.id,
    workspaceId: row.workspaceId,
    emailDestinatario: row.emailDestinatario,
    rolSolicitado: row.rolSolicitado,
    puedeCrearProyectos: row.puedeCrearProyectos,
    estado: row.estado,
    invitadoPorId: row.invitadoPorId,
    expiresAt: row.expiresAt.toISOString(),
    acceptedAt: row.acceptedAt ? row.acceptedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    items,
    nextCursor: items.length === limit ? items[items.length - 1]!.id : null,
    total: Number(totalRow?.total ?? 0),
  };
}

export async function listWorkspaceEligibleUsers(
  actorId: string,
  workspaceId: string,
  query: {
    para?: "PM_TITULAR" | "SUPLENTE_PM" | "ESPECIALISTA" | "OBSERVADOR";
    q?: string;
    limit?: string;
  } = {},
) {
  const { actor } = await assertWorkspaceReader(actorId, workspaceId);
  if (!["ADMIN", "PM"].includes(actor.role)) {
    throw new ApiError(403, "FORBIDDEN", "Solo Head o PM consultan candidatos de asignación.");
  }
  const para = query.para ?? "PM_TITULAR";
  const limit = Number(query.limit ?? 50);
  const search = query.q?.trim();
  const pattern = search ? `%${escapeLike(search)}%` : null;

  if (para === "SUPLENTE_PM") {
    const rows = await sql<{
      usuarioId: string;
      nombre: string;
      email: string;
      tipoUsuario: "INTERNO" | "EXTERNO";
      rol: "PM";
      miembroActivo: boolean;
      puedeCrearProyectos: boolean;
    }>`
      SELECT u.id::text AS "usuarioId",u.nombre,u.email,u.tipo_usuario AS "tipoUsuario",
        r.codigo AS rol,
        coalesce(m.estado='ACTIVA',false) AS "miembroActivo",
        coalesce(m.puede_crear_proyectos,false) AS "puedeCrearProyectos"
      FROM pmo_cusn.usuario u
      JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
      JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.codigo='PM' AND r.activo
      LEFT JOIN pmo_cusn.membresia_workspace m ON m.usuario_id=u.id AND m.workspace_id=${workspaceId}
      WHERE u.activo AND u.tipo_usuario='INTERNO'
        AND (${pattern}::text IS NULL OR u.nombre ILIKE ${pattern} ESCAPE '\\' OR u.email ILIKE ${pattern} ESCAPE '\\')
      ORDER BY u.id LIMIT ${limit}`;
    return { items: rows };
  }

  const rows = await sql<{
    usuarioId: string;
    nombre: string;
    email: string;
    tipoUsuario: "INTERNO" | "EXTERNO";
    rol: "ADMIN" | "PM" | "ESPECIALISTA" | "VISUALIZADOR";
    miembroActivo: boolean;
    puedeCrearProyectos: boolean;
  }>`
    SELECT u.id::text AS "usuarioId",u.nombre,u.email,u.tipo_usuario AS "tipoUsuario",
      r.codigo AS rol,true AS "miembroActivo",m.puede_crear_proyectos AS "puedeCrearProyectos"
    FROM pmo_cusn.membresia_workspace m
    JOIN pmo_cusn.usuario u ON u.id=m.usuario_id AND u.activo
    JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
    JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.activo
    WHERE m.workspace_id=${workspaceId} AND m.estado='ACTIVA'
      AND (
        (${para}='PM_TITULAR' AND u.tipo_usuario='INTERNO' AND r.codigo='PM') OR
        (${para}='ESPECIALISTA' AND r.codigo='ESPECIALISTA') OR
        (${para}='OBSERVADOR' AND r.codigo IN ('PM','VISUALIZADOR'))
      )
      AND (${pattern}::text IS NULL OR u.nombre ILIKE ${pattern} ESCAPE '\\' OR u.email ILIKE ${pattern} ESCAPE '\\')
    ORDER BY u.id LIMIT ${limit}`;

  return { items: rows };
}

export async function updateWorkspaceName(actorId: string, workspaceId: string, name: string, version: string) {
  return sql.begin(async tx => {
    const actor = await activeActor(actorId,tx);
    const [workspace] = await tx<{creatorId:string}>`SELECT creado_por_id::text AS "creatorId" FROM pmo_cusn.workspace
      WHERE id=${workspaceId} AND estado='ACTIVO' FOR UPDATE`;
    if (!workspace) throw new ApiError(404,'NOT_FOUND','Workspace no encontrado.');
    if (actor?.role !== 'ADMIN') {
      if (actor?.role !== 'PM' || workspace.creatorId !== actorId) {
        const [membership] = await tx<{allowed:boolean}>`SELECT puede_crear_proyectos AS allowed FROM pmo_cusn.membresia_workspace
          WHERE workspace_id=${workspaceId} AND usuario_id=${actorId} AND estado='ACTIVA' FOR SHARE`;
        if (!membership?.allowed || actor?.role !== 'PM') throw new ApiError(403,'FORBIDDEN','No puedes configurar este workspace.');
      }
    }
    const [updated] = await tx<{id:string;nombre:string;slug:string;version:string}>`UPDATE pmo_cusn.workspace
      SET nombre=${name.trim()},version=version+1,updated_at=now() WHERE id=${workspaceId} AND version=${version}
      RETURNING id::text,nombre,slug,version::text`;
    if (!updated) throw new ApiError(409,'VERSION_CONFLICT','El workspace cambió.');
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${workspaceId},'workspaces.configurar','workspace',${workspaceId},'PERMITIDO')`;
    return updated;
  });
}

export async function enableProjectCreation(actorId:string,workspaceId:string,userId:string,enabled:boolean) {
  return sql.begin(async tx => {
    if ((await activeActor(actorId,tx))?.role !== 'ADMIN') throw new ApiError(403,'FORBIDDEN','Solo Head habilita la creación.');
    const [target] = await tx<{id:string}>`SELECT u.id::text FROM pmo_cusn.usuario u
      JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
      JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.codigo='PM' AND r.activo
      WHERE u.id=${userId} AND u.activo AND u.tipo_usuario='INTERNO' FOR SHARE OF u`;
    if (!target) throw new ApiError(422,'INVALID_MEMBER','El miembro debe ser PM interno activo.');
    const [member] = await tx<{id:string;enabled:boolean}>`UPDATE pmo_cusn.membresia_workspace m
      SET puede_crear_proyectos=${enabled},updated_at=now() FROM pmo_cusn.workspace w
      WHERE m.workspace_id=w.id AND w.id=${workspaceId} AND w.estado='ACTIVO'
        AND m.usuario_id=${userId} AND m.estado='ACTIVA'
      RETURNING m.id::text,m.puede_crear_proyectos AS enabled`;
    if (!member) throw new ApiError(404,'NOT_FOUND','Membresía activa no encontrada.');
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${workspaceId},'workspaces.creacion_habilitar','membresia_workspace',${member.id},'PERMITIDO')`;
    return member;
  });
}

export async function changeMembership(actorId:string,workspaceId:string,userId:string,state:'ACTIVA'|'SUSPENDIDA'|'RETIRADA'){
  return sql.begin(async tx=>{
    if((await activeActor(actorId,tx))?.role!=='ADMIN')throw new ApiError(403,'FORBIDDEN','Solo Head gestiona el estado de membresía.');
    const [member]=await tx<{id:string;estado:string}>`UPDATE pmo_cusn.membresia_workspace SET estado=${state},
      puede_crear_proyectos=CASE WHEN ${state}='ACTIVA' THEN puede_crear_proyectos ELSE false END,updated_at=now()
      WHERE workspace_id=${workspaceId} AND usuario_id=${userId} RETURNING id::text,estado`;
    if(!member)throw new ApiError(404,'NOT_FOUND','Membresía no encontrada.');
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${workspaceId},'workspaces.miembros.gestionar','membresia_workspace',${member.id},'PERMITIDO')`;
    return member;
  });
}
