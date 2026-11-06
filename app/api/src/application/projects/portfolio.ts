import { sql } from "../../db";
import { activeActor, assertPermission, hasGrant, hasPermission } from "../../authorization";
import { ApiError } from "../../errors";
import { type ProjectState } from "../../domain";

const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

function formatDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export type PortfolioQuery = {
  q?: string;
  workspaceId?: string;
  paisId?: string;
  lobId?: string;
  squadId?: string;
  clienteId?: string;
  pmTitularId?: string;
  estado?: ProjectState;
  incluirInactivos?: "true" | "false";
  ordenarPor?: "id" | "tvt" | "nombre" | "cliente" | "estado" | "fechaTerminoActual" | "updatedAt";
  direccion?: "asc" | "desc";
  limit?: string;
  offset?: string;
  after?: string;
};

export async function queryPortfolio(
  actorId: string,
  query: PortfolioQuery = {},
  fixedWorkspaceId?: string,
) {
  const actor = await activeActor(actorId);
  if (!actor || !(await hasGrant(actorId, "proyectos.consultar"))) {
    throw new ApiError(403, "FORBIDDEN", "Acceso no autorizado.");
  }

  if (fixedWorkspaceId) {
    const [ws] = await sql<{ id: string }>`SELECT id::text FROM pmo_cusn.workspace WHERE id=${fixedWorkspaceId} AND estado='ACTIVO'`;
    if (!ws) {
      if (actor.role === "ADMIN") throw new ApiError(404, "NOT_FOUND", "Workspace no encontrado.");
      throw new ApiError(403, "FORBIDDEN", "Acceso no autorizado.");
    }
    if (actor.role !== "ADMIN") {
      const [member] = await sql<{ id: string }>`SELECT id::text FROM pmo_cusn.membresia_workspace
        WHERE workspace_id=${fixedWorkspaceId} AND usuario_id=${actorId} AND estado='ACTIVA'`;
      if (!member) throw new ApiError(403, "FORBIDDEN", "Acceso no autorizado.");
    }
  }

  const incluirInactivos = query.incluirInactivos === "true";
  if (incluirInactivos && actor.role !== "ADMIN") {
    throw new ApiError(403, "FORBIDDEN", "Solo Head puede consultar proyectos deshabilitados.");
  }

  const globalRead =
    actor.role === "ADMIN" ||
    actor.role === "PM" ||
    (actor.role === "VISUALIZADOR" && actor.kind === "INTERNO" && actor.readScope === "GLOBAL");

  const workspaceId = fixedWorkspaceId ?? query.workspaceId ?? null;
  const paisId = query.paisId ?? null;
  const lobId = query.lobId ?? null;
  const squadId = query.squadId ?? null;
  const clienteId = query.clienteId ?? null;
  const pmTitularId = query.pmTitularId ?? null;
  const estado = query.estado ?? null;
  const search = query.q?.trim();
  const pattern = search ? `%${escapeLike(search)}%` : null;
  const after = query.after ?? null;
  const limit = Number(query.limit ?? 50);
  const offset = Number(query.offset ?? 0);
  const ordenarPor = query.ordenarPor ?? "id";
  const direccion = query.direccion ?? "asc";

  const stateCounts = await sql<{ estado: ProjectState; n: string }>`
    SELECT p.estado_actual AS estado, count(*)::text AS n
    FROM pmo_cusn.proyecto p
    JOIN pmo_cusn.workspace w ON w.id=p.workspace_id AND w.estado='ACTIVO'
    JOIN pmo_cusn.cliente c ON c.id=p.cliente_id
    JOIN pmo_cusn.participacion_proyecto pp_owner ON pp_owner.proyecto_id=p.id
      AND pp_owner.funcion='PM_TITULAR' AND pp_owner.fecha_fin IS NULL
    WHERE (${incluirInactivos} OR p.activo)
      AND (
        ${globalRead}
        OR EXISTS(
          SELECT 1 FROM pmo_cusn.participacion_proyecto pp_vis
          WHERE pp_vis.proyecto_id=p.id AND pp_vis.usuario_id=${actorId}
            AND pp_vis.fecha_inicio<=now() AND (pp_vis.fecha_fin IS NULL OR pp_vis.fecha_fin>now())
        )
      )
      AND (${workspaceId}::bigint IS NULL OR p.workspace_id=${workspaceId})
      AND (${paisId}::bigint IS NULL OR p.pais_id=${paisId})
      AND (${lobId}::bigint IS NULL OR p.lob_id=${lobId})
      AND (${squadId}::bigint IS NULL OR p.squad_id=${squadId})
      AND (${clienteId}::bigint IS NULL OR p.cliente_id=${clienteId})
      AND (${pmTitularId}::bigint IS NULL OR pp_owner.usuario_id=${pmTitularId})
      AND (${estado}::text IS NULL OR p.estado_actual=${estado})
      AND (
        ${pattern}::text IS NULL
        OR p.tvt ILIKE ${pattern} ESCAPE '\\'
        OR p.tvt_normalizado ILIKE ${pattern} ESCAPE '\\'
        OR p.nombre ILIKE ${pattern} ESCAPE '\\'
        OR c.nombre ILIKE ${pattern} ESCAPE '\\'
      )
    GROUP BY p.estado_actual`;

  const porEstado: Record<ProjectState, number> = {
    "Requiere P1P2": 0,
    "En ejecución": 0,
    "En transición": 0,
    "Detenido": 0,
    "Cancelado": 0,
    "Cerrado exitoso": 0,
    "Cerrado con observaciones": 0,
  };
  let total = 0;
  for (const row of stateCounts) {
    const count = Number(row.n);
    if (row.estado in porEstado) porEstado[row.estado] = count;
    total += count;
  }

  const orderClause =
    ordenarPor === "tvt"
      ? direccion === "desc"
        ? sql`ORDER BY p.tvt_normalizado DESC, p.id ASC`
        : sql`ORDER BY p.tvt_normalizado ASC, p.id ASC`
      : ordenarPor === "nombre"
        ? direccion === "desc"
          ? sql`ORDER BY lower(p.nombre) DESC, p.id ASC`
          : sql`ORDER BY lower(p.nombre) ASC, p.id ASC`
        : ordenarPor === "cliente"
          ? direccion === "desc"
            ? sql`ORDER BY lower(c.nombre) DESC, p.id ASC`
            : sql`ORDER BY lower(c.nombre) ASC, p.id ASC`
          : ordenarPor === "estado"
            ? direccion === "desc"
              ? sql`ORDER BY p.estado_actual DESC, p.id ASC`
              : sql`ORDER BY p.estado_actual ASC, p.id ASC`
            : ordenarPor === "fechaTerminoActual"
              ? direccion === "desc"
                ? sql`ORDER BY p.fecha_termino_actual DESC NULLS LAST, p.id ASC`
                : sql`ORDER BY p.fecha_termino_actual ASC NULLS LAST, p.id ASC`
              : ordenarPor === "updatedAt"
                ? direccion === "desc"
                  ? sql`ORDER BY p.updated_at DESC, p.id ASC`
                  : sql`ORDER BY p.updated_at ASC, p.id ASC`
                : direccion === "desc"
                  ? sql`ORDER BY p.id DESC`
                  : sql`ORDER BY p.id ASC`;

  const rows = await sql<{
    id: string;
    tvt: string;
    tvtNormalizado: string;
    nombre: string;
    estado: ProjectState;
    activo: boolean;
    version: string;
    workspaceId: string;
    workspaceNombre: string;
    workspaceSlug: string;
    clienteId: string;
    clienteNombre: string;
    estadoCliente: "NUEVO" | "ANTIGUO" | null;
    paisId: string;
    paisCodigo: string;
    paisNombre: string;
    lobId: string;
    lobNombre: string;
    squadId: string | null;
    squadNombre: string | null;
    titularId: string;
    titularNombre: string;
    fechaRecepcionP1p2: Date | string | null;
    fechaInicio: Date | string | null;
    fechaInicioReal: Date | string | null;
    fechaTerminoBaseline: Date | string | null;
    fechaTerminoActual: Date | string | null;
    updatedAt: Date;
  }>`
    SELECT p.id::text,p.tvt,p.tvt_normalizado AS "tvtNormalizado",p.nombre,
      p.estado_actual AS estado,p.activo,p.version::text,
      w.id::text AS "workspaceId",w.nombre AS "workspaceNombre",w.slug AS "workspaceSlug",
      c.id::text AS "clienteId",c.nombre AS "clienteNombre",c.estado_cliente AS "estadoCliente",
      pa.id::text AS "paisId",pa.codigo AS "paisCodigo",pa.nombre AS "paisNombre",
      l.id::text AS "lobId",l.nombre AS "lobNombre",
      s.id::text AS "squadId",s.nombre AS "squadNombre",
      u_owner.id::text AS "titularId",u_owner.nombre AS "titularNombre",
      p.fecha_recepcion_p1p2 AS "fechaRecepcionP1p2",
      p.fecha_inicio AS "fechaInicio",p.fecha_inicio_real AS "fechaInicioReal",
      p.fecha_termino_baseline AS "fechaTerminoBaseline",
      p.fecha_termino_actual AS "fechaTerminoActual",
      p.updated_at AS "updatedAt"
    FROM pmo_cusn.proyecto p
    JOIN pmo_cusn.workspace w ON w.id=p.workspace_id AND w.estado='ACTIVO'
    JOIN pmo_cusn.cliente c ON c.id=p.cliente_id
    JOIN pmo_cusn.pais pa ON pa.id=p.pais_id
    JOIN pmo_cusn.lob l ON l.id=p.lob_id
    LEFT JOIN pmo_cusn.squad s ON s.id=p.squad_id
    JOIN pmo_cusn.participacion_proyecto pp_owner ON pp_owner.proyecto_id=p.id
      AND pp_owner.funcion='PM_TITULAR' AND pp_owner.fecha_fin IS NULL
    JOIN pmo_cusn.usuario u_owner ON u_owner.id=pp_owner.usuario_id
    WHERE (${incluirInactivos} OR p.activo)
      AND (
        ${globalRead}
        OR EXISTS(
          SELECT 1 FROM pmo_cusn.participacion_proyecto pp_vis
          WHERE pp_vis.proyecto_id=p.id AND pp_vis.usuario_id=${actorId}
            AND pp_vis.fecha_inicio<=now() AND (pp_vis.fecha_fin IS NULL OR pp_vis.fecha_fin>now())
        )
      )
      AND (${workspaceId}::bigint IS NULL OR p.workspace_id=${workspaceId})
      AND (${paisId}::bigint IS NULL OR p.pais_id=${paisId})
      AND (${lobId}::bigint IS NULL OR p.lob_id=${lobId})
      AND (${squadId}::bigint IS NULL OR p.squad_id=${squadId})
      AND (${clienteId}::bigint IS NULL OR p.cliente_id=${clienteId})
      AND (${pmTitularId}::bigint IS NULL OR pp_owner.usuario_id=${pmTitularId})
      AND (${estado}::text IS NULL OR p.estado_actual=${estado})
      AND (${after}::bigint IS NULL OR p.id>${after}::bigint)
      AND (
        ${pattern}::text IS NULL
        OR p.tvt ILIKE ${pattern} ESCAPE '\\'
        OR p.tvt_normalizado ILIKE ${pattern} ESCAPE '\\'
        OR p.nombre ILIKE ${pattern} ESCAPE '\\'
        OR c.nombre ILIKE ${pattern} ESCAPE '\\'
      )
    ${orderClause}
    LIMIT ${limit} OFFSET ${offset}`;

  const items = rows.map(row => ({
    id: row.id,
    tvt: row.tvt,
    tvtNormalizado: row.tvtNormalizado,
    nombre: row.nombre,
    estado: row.estado,
    activo: row.activo,
    version: row.version,
    workspace: { id: row.workspaceId, nombre: row.workspaceNombre, slug: row.workspaceSlug },
    cliente: { id: row.clienteId, nombre: row.clienteNombre, estadoCliente: row.estadoCliente },
    pais: { id: row.paisId, codigo: row.paisCodigo, nombre: row.paisNombre },
    lob: { id: row.lobId, nombre: row.lobNombre },
    squad: row.squadId && row.squadNombre ? { id: row.squadId, nombre: row.squadNombre } : null,
    titular: { usuarioId: row.titularId, nombre: row.titularNombre },
    fechas: {
      recepcionP1p2: formatDate(row.fechaRecepcionP1p2),
      inicio: formatDate(row.fechaInicio),inicioReal: formatDate(row.fechaInicioReal),
      terminoBaseline: formatDate(row.fechaTerminoBaseline),
      terminoActual: formatDate(row.fechaTerminoActual),
    },
    updatedAt: row.updatedAt.toISOString(),
    indicadoresPendientes: {
      spi: null,
      cpi: null,
      complejidad: null,
      riesgosAbiertos: null,
      ahorroCompras: null,
      estadoModulos: "PENDIENTE_PAQUETES_P1_P5" as const,
    },
  }));

  const hasMore = after !== null ? items.length === limit : offset + items.length < total;
  return {
    items,
    paginacion: {
      limit,
      offset,
      total,
      hasMore,
      nextOffset: hasMore && after === null ? offset + items.length : null,
      nextCursor: items.length === limit ? items[items.length - 1]!.id : null,
    },
    resumenPorEstado: {
      total,
      porEstado,
    },
  };
}

export async function getProjectPresentation(actorId: string, projectId: string) {
  await assertPermission(actorId, "proyectos.consultar", projectId);
  const actor = await activeActor(actorId);
  if (!actor) throw new ApiError(403, "FORBIDDEN", "Acceso no autorizado.");
  const hideInternal = actor.kind === "EXTERNO";

  const [row] = await sql<{
    id: string;
    tvt: string;
    tvtNormalizado: string;
    nombre: string;
    descripcion: string | null;
    situacionInicial: string | null;
    estado: ProjectState;
    activo: boolean;
    version: string;
    workspaceId: string;
    workspaceNombre: string;
    workspaceSlug: string;
    clienteId: string;
    clienteNombre: string;
    estadoCliente: "NUEVO" | "ANTIGUO" | null;
    clienteSector: string | null;
    paisId: string;
    paisCodigo: string;
    paisNombre: string;
    lobId: string;
    lobNombre: string;
    squadId: string | null;
    squadNombre: string | null;
    titularId: string;
    titularNombre: string;
    titularEmail: string;
    fechaRecepcionP1p2: Date | string | null;
    fechaInicio: Date | string | null;
    fechaInicioReal: Date | string | null;
    fechaTerminoBaseline: Date | string | null;
    fechaTerminoActual: Date | string | null;
    referenciaSap: string | null;
    referenciaCeco: string | null;
    referenciaPep: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>`
    SELECT p.id::text,p.tvt,p.tvt_normalizado AS "tvtNormalizado",p.nombre,
      p.descripcion,p.situacion_inicial AS "situacionInicial",
      p.estado_actual AS estado,p.activo,p.version::text,
      w.id::text AS "workspaceId",w.nombre AS "workspaceNombre",w.slug AS "workspaceSlug",
      c.id::text AS "clienteId",c.nombre AS "clienteNombre",c.estado_cliente AS "estadoCliente",c.sector AS "clienteSector",
      pa.id::text AS "paisId",pa.codigo AS "paisCodigo",pa.nombre AS "paisNombre",
      l.id::text AS "lobId",l.nombre AS "lobNombre",
      s.id::text AS "squadId",s.nombre AS "squadNombre",
      u_owner.id::text AS "titularId",u_owner.nombre AS "titularNombre",u_owner.email AS "titularEmail",
      p.fecha_recepcion_p1p2 AS "fechaRecepcionP1p2",
      p.fecha_inicio AS "fechaInicio",p.fecha_inicio_real AS "fechaInicioReal",
      p.fecha_termino_baseline AS "fechaTerminoBaseline",
      p.fecha_termino_actual AS "fechaTerminoActual",
      p.referencia_sap AS "referenciaSap",
      p.referencia_ceco AS "referenciaCeco",
      p.referencia_pep AS "referenciaPep",
      p.created_at AS "createdAt",
      p.updated_at AS "updatedAt"
    FROM pmo_cusn.proyecto p
    JOIN pmo_cusn.workspace w ON w.id=p.workspace_id
    JOIN pmo_cusn.cliente c ON c.id=p.cliente_id
    JOIN pmo_cusn.pais pa ON pa.id=p.pais_id
    JOIN pmo_cusn.lob l ON l.id=p.lob_id
    LEFT JOIN pmo_cusn.squad s ON s.id=p.squad_id
    JOIN pmo_cusn.participacion_proyecto pp_owner ON pp_owner.proyecto_id=p.id
      AND pp_owner.funcion='PM_TITULAR' AND pp_owner.fecha_fin IS NULL
    JOIN pmo_cusn.usuario u_owner ON u_owner.id=pp_owner.usuario_id
    WHERE p.id=${projectId} AND p.activo`;

  if (!row) throw new ApiError(404, "NOT_FOUND", "Proyecto no encontrado.");

  const participants = await sql<{
    id: string;
    usuarioId: string;
    nombre: string;
    funcion: "PM_TITULAR" | "ESPECIALISTA" | "OBSERVADOR" | "LIDER_TECNICO" | "TAM" | "SDM";
    fechaInicio: Date;
  }>`
    SELECT pp.id::text,u.id::text AS "usuarioId",u.nombre,pp.funcion,pp.fecha_inicio AS "fechaInicio"
    FROM pmo_cusn.participacion_proyecto pp
    JOIN pmo_cusn.usuario u ON u.id=pp.usuario_id
    WHERE pp.proyecto_id=${projectId} AND pp.fecha_inicio<=now()
      AND (pp.fecha_fin IS NULL OR pp.fecha_fin>now())
    ORDER BY pp.id`;

  const [activeSub] = await sql<{
    id: string;
    delegadoId: string;
    delegadoNombre: string;
    inicio: Date;
    fin: Date;
    permisos: string[];
  }>`
    SELECT d.id::text,u.id::text AS "delegadoId",u.nombre AS "delegadoNombre",
      d.inicio,d.fin,
      coalesce(array_agg(p.codigo ORDER BY p.codigo) FILTER (WHERE p.codigo IS NOT NULL), ARRAY[]::text[]) AS permisos
    FROM pmo_cusn.delegacion_acceso d
    JOIN pmo_cusn.usuario u ON u.id=d.delegado_id AND u.activo
    LEFT JOIN pmo_cusn.delegacion_permiso dp ON dp.delegacion_id=d.id
    LEFT JOIN pmo_cusn.permiso p ON p.id=dp.permiso_id
    WHERE d.proyecto_id=${projectId} AND d.estado='ACTIVA'
      AND d.inicio<=now() AND d.fin>now() AND d.revocado_at IS NULL
    GROUP BY d.id,u.id,u.nombre,d.inicio,d.fin
    ORDER BY d.id DESC LIMIT 1`;

  const [commercial]=await sql<{tcvTipo:'DEFINIDO'|'ILIMITADO';tcvValor:string|null;unidadCodigo:string|null}>`SELECT tcv_tipo AS "tcvTipo",tcv_valor::text AS "tcvValor",unidad_codigo AS "unidadCodigo" FROM pmo_cusn.condicion_comercial WHERE proyecto_id=${projectId}`;
  const puedeEditarFicha = await hasPermission(actorId, "proyectos.editar", projectId);
  const esTitular = actor.role === "PM" && row.titularId === actorId;
  const esGobiernoTitular = actor.role === "ADMIN" || esTitular;
  const fechaTerminoBaseline = formatDate(row.fechaTerminoBaseline);

  return {
    id: row.id,
    tvt: row.tvt,
    nombre: row.nombre,
    workspaceId: row.workspaceId,
    version: row.version,
    estado: row.estado,
    identidad: {
      id: row.id,
      tvt: row.tvt,
      tvtNormalizado: row.tvtNormalizado,
      nombre: row.nombre,
      descripcion: row.descripcion,
      situacionInicial: row.situacionInicial,
      activo: row.activo,
      workspace: { id: row.workspaceId, nombre: row.workspaceNombre, slug: row.workspaceSlug },
      cliente: { id: row.clienteId, nombre: row.clienteNombre, estadoCliente: row.estadoCliente, sector: row.clienteSector },
      pais: { id: row.paisId, codigo: row.paisCodigo, nombre: row.paisNombre },
      lob: { id: row.lobId, nombre: row.lobNombre },
      squad: row.squadId && row.squadNombre ? { id: row.squadId, nombre: row.squadNombre } : null,
      referenciasInternas: hideInternal
        ? null
        : {
            sap: row.referenciaSap,
            ceco: row.referenciaCeco,
            pep: row.referenciaPep,
          },
    },
    gobierno: {
      estadoActual: row.estado,
      version: row.version,
      titular: {
        usuarioId: row.titularId,
        nombre: row.titularNombre,
        email: hideInternal ? null : row.titularEmail,
      },
      participantes: participants.map(p => ({
        id: p.id,
        usuarioId: p.usuarioId,
        nombre: p.nombre,
        funcion: p.funcion,
        fechaInicio: p.fechaInicio.toISOString(),
      })),
      suplenciaEfectiva: activeSub
        ? {
            id: activeSub.id,
            delegadoId: activeSub.delegadoId,
            delegadoNombre: activeSub.delegadoNombre,
            inicio: activeSub.inicio.toISOString(),
            fin: activeSub.fin.toISOString(),
            permisos: activeSub.permisos,
          }
        : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
    condicionComercial: actor.kind==='EXTERNO'?null:commercial??null,
    planificacion: {
      fechaRecepcionP1p2: formatDate(row.fechaRecepcionP1p2),
      fechaInicio: formatDate(row.fechaInicio),fechaInicioReal: formatDate(row.fechaInicioReal),
      fechaTerminoBaseline,
      fechaTerminoActual: formatDate(row.fechaTerminoActual),
      baselineCongelada: fechaTerminoBaseline !== null,
    },
    accionesDisponibles: {
      puedeEditarFicha,
      puedeFijarBaseline: false,
      puedeTransferir: actor.role === "ADMIN",
      puedeGestionarParticipantes: esGobiernoTitular,
      puedeDesignarSuplencia: esGobiernoTitular,
      puedeRevocarSuplencia: esGobiernoTitular && activeSub !== undefined,
    },
    modulosPendientes: {
      complejidad: "PENDIENTE_P1" as const,
      riesgos: "PENDIENTE_P2" as const,
      controlesCambio: "PENDIENTE_P3" as const,
      seguimientoCurvaS: "PENDIENTE_P4" as const,
      facturacionCpi: "PENDIENTE_P4" as const,
      compras: "PENDIENTE_P5" as const,
      checklistLeccionesCierre: "PENDIENTE_P6" as const,
    },
  };
}

export async function getProjectAssignments(actorId: string, projectId: string) {
  await assertPermission(actorId, "proyectos.consultar", projectId);
  const actor = await activeActor(actorId);
  if (!actor) throw new ApiError(403, "FORBIDDEN", "Acceso no autorizado.");
  const hideInternal = actor.kind === "EXTERNO";

  const [project] = await sql<{ id: string; workspaceId: string }>`
    SELECT id::text,workspace_id::text AS "workspaceId"
    FROM pmo_cusn.proyecto WHERE id=${projectId} AND activo`;
  if (!project) throw new ApiError(404, "NOT_FOUND", "Proyecto no encontrado.");

  const participations = await sql<{
    id: string;
    usuarioId: string;
    nombre: string;
    email: string;
    tipoUsuario: "INTERNO" | "EXTERNO";
    rolCorporativo: "ADMIN" | "PM" | "ESPECIALISTA" | "VISUALIZADOR" | null;
    estadoMembresiaWorkspace: "ACTIVA" | "SUSPENDIDA" | "RETIRADA" | null;
    funcion: "PM_TITULAR" | "ESPECIALISTA" | "OBSERVADOR" | "LIDER_TECNICO" | "TAM" | "SDM";
    fechaInicio: Date;
  }>`
    SELECT pp.id::text,u.id::text AS "usuarioId",u.nombre,u.email,
      u.tipo_usuario AS "tipoUsuario",
      r.codigo AS "rolCorporativo",
      m.estado AS "estadoMembresiaWorkspace",
      pp.funcion,pp.fecha_inicio AS "fechaInicio"
    FROM pmo_cusn.participacion_proyecto pp
    JOIN pmo_cusn.usuario u ON u.id=pp.usuario_id
    LEFT JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
    LEFT JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.activo
    LEFT JOIN pmo_cusn.membresia_workspace m ON m.usuario_id=u.id AND m.workspace_id=${project.workspaceId}
    WHERE pp.proyecto_id=${projectId} AND pp.fecha_inicio<=now()
      AND (pp.fecha_fin IS NULL OR pp.fecha_fin>now())
    ORDER BY pp.id`;

  const ownerRow = participations.find(p => p.funcion === "PM_TITULAR");
  if (!ownerRow) throw new ApiError(409, "OWNER_MISSING", "Proyecto sin titular vigente.");

  const substitutions = hideInternal
    ? []
    : await sql<{
        id: string;
        deleganteId: string;
        delegadoId: string;
        delegadoNombre: string;
        autorizadoPorId: string | null;
        inicio: Date;
        fin: Date;
        estado: "PENDIENTE" | "ACTIVA";
        motivo: string;
        permisos: string[];
      }>`
        SELECT d.id::text,d.delegante_id::text AS "deleganteId",
          d.delegado_id::text AS "delegadoId",u.nombre AS "delegadoNombre",
          d.autorizado_por_id::text AS "autorizadoPorId",
          d.inicio,d.fin,d.estado,d.motivo,
          coalesce(array_agg(p.codigo ORDER BY p.codigo) FILTER (WHERE p.codigo IS NOT NULL), ARRAY[]::text[]) AS permisos
        FROM pmo_cusn.delegacion_acceso d
        JOIN pmo_cusn.usuario u ON u.id=d.delegado_id
        LEFT JOIN pmo_cusn.delegacion_permiso dp ON dp.delegacion_id=d.id
        LEFT JOIN pmo_cusn.permiso p ON p.id=dp.permiso_id
        WHERE d.proyecto_id=${projectId}
          AND d.estado IN ('PENDIENTE','ACTIVA')
          AND d.fin>now() AND d.revocado_at IS NULL
        GROUP BY d.id,d.delegante_id,d.delegado_id,u.nombre,d.autorizado_por_id,d.inicio,d.fin,d.estado,d.motivo
        ORDER BY d.inicio ASC, d.id ASC`;

  const delegablePermissions = hideInternal
    ? []
    : await sql<{ codigo: string; descripcion: string }>`
        SELECT p.codigo,p.descripcion
        FROM pmo_cusn.permiso p
        JOIN pmo_cusn.rol_permiso rp ON rp.permiso_id=p.id
        JOIN pmo_cusn.rol r ON r.id=rp.rol_id AND r.codigo='PM'
        WHERE p.delegable
        ORDER BY p.codigo`;

  return {
    projectId: project.id,
    workspaceId: project.workspaceId,
    titular: {
      participacionId: ownerRow.id,
      usuarioId: ownerRow.usuarioId,
      nombre: ownerRow.nombre,
      email: hideInternal ? null : ownerRow.email,
      rolCorporativo: "PM" as const,
      estadoMembresiaWorkspace: ownerRow.estadoMembresiaWorkspace ?? "ACTIVA",
      fechaInicio: ownerRow.fechaInicio.toISOString(),
    },
    participantes: participations
      .filter(p => p.funcion !== "PM_TITULAR")
      .map(p => ({
        id: p.id,
        usuarioId: p.usuarioId,
        nombre: p.nombre,
        email: hideInternal ? null : p.email,
        tipoUsuario: p.tipoUsuario,
        rolCorporativo: p.rolCorporativo,
        estadoMembresiaWorkspace: p.estadoMembresiaWorkspace,
        funcion: p.funcion as "ESPECIALISTA" | "OBSERVADOR" | "LIDER_TECNICO" | "TAM" | "SDM",
        fechaInicio: p.fechaInicio.toISOString(),
      })),
    suplenciasVigentes: substitutions.map(s => ({
      id: s.id,
      deleganteId: s.deleganteId,
      delegadoId: s.delegadoId,
      delegadoNombre: s.delegadoNombre,
      autorizadoPorId: s.autorizadoPorId,
      inicio: s.inicio.toISOString(),
      fin: s.fin.toISOString(),
      estado: s.estado,
      motivo: s.motivo,
      permisos: s.permisos,
    })),
    permisosDelegables: delegablePermissions,
  };
}
