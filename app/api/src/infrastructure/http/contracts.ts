import { z } from "zod";
import { PROJECT_STATES } from "../../domain";

// Transport contracts are independent of persistence entities. SQL bigint values stay strings.
const MAX_BIGINT = 9223372036854775807n;
export const id = z
  .string()
  .regex(/^[1-9][0-9]{0,18}$/)
  .refine(v => BigInt(v) <= MAX_BIGINT, "Identificador fuera de rango BIGINT.");
export const cursor = z
  .string()
  .regex(/^(0|[1-9][0-9]{0,18})$/)
  .refine(v => BigInt(v) <= MAX_BIGINT, "Cursor fuera de rango BIGINT.");
export const role = z.enum(["ADMIN", "PM", "ESPECIALISTA", "VISUALIZADOR"]);
export const projectState = z.enum(PROJECT_STATES);
const name = z.string().trim().min(1).max(200);
const limitString = z.string().regex(/^(?:[1-9]|[1-9][0-9]|100)$/).optional();
const offsetString = z.string().regex(/^(?:0|[1-9][0-9]{0,3}|10000)$/).optional();
const searchQuery = z.string().trim().min(1).max(120).optional();
const civilDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const shortRef = z.string().trim().max(120).nullable().optional();
const longText = z.string().trim().max(4000).nullable().optional();

export const inputs = {
  login: z.strictObject({ identifier: z.string().min(1).max(254), password: z.string().min(1).max(1024) }),
  workspace: z.strictObject({ nombre: name }),
  workspaceEdit: z.strictObject({ nombre: name, version: id }),
  workspaceList: z.strictObject({ after: cursor.optional(), limit: limitString, q: searchQuery }),
  workspaceMembersQuery: z.strictObject({
    after: cursor.optional(),
    limit: limitString,
    estado: z.enum(["ACTIVA", "SUSPENDIDA", "RETIRADA"]).optional(),
    rol: role.optional(),
    q: searchQuery,
  }),
  workspaceInvitationsQuery: z.strictObject({
    after: cursor.optional(),
    limit: limitString,
    estado: z.enum(["PENDIENTE", "ACEPTADA", "REVOCADA", "EXPIRADA"]).optional(),
  }),
  workspaceEligibleQuery: z.strictObject({
    para: z.enum(["PM_TITULAR", "SUPLENTE_PM", "ESPECIALISTA", "OBSERVADOR"]).optional(),
    q: searchQuery,
    limit: limitString,
  }),
  catalogsQuery: z.strictObject({
    q: searchQuery,
    lobId: id.optional(),
    limit: limitString,
  }),
  enable: z.strictObject({ habilitado: z.boolean() }),
  invitation: z.strictObject({ email: z.email().max(254), rol: z.enum(["PM", "ESPECIALISTA", "VISUALIZADOR"]) }),
  accept: z.strictObject({
    token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    password: z.string().min(14).max(1024).optional(),
  }),
  role: z.strictObject({ rol: role, alcance: z.enum(["GLOBAL", "ASIGNADOS"]) }),
  reset: z.strictObject({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/), password: z.string().min(14).max(1024) }),
  project: z.strictObject({
    workspaceId: id,
    tvt: z.string().trim().min(1).max(80),
    nombre: name,
    clienteId: id,
    paisId: id,
    lobId: id,
    pmTitularId: id.optional(),
    squadId: id.nullable().optional(),
    descripcion: longText,
    situacionInicial: longText,
    fechaRecepcionP1p2: civilDateString.nullable().optional(),
    fechaInicio: civilDateString.nullable().optional(),
    fechaTerminoBaseline: civilDateString.nullable().optional(),
    referenciaSap: shortRef,
    referenciaCeco: shortRef,
    referenciaPep: shortRef,
  }),
  projectEdit: z.strictObject({
    version: id,
    nombre: name.optional(),
    descripcion: longText,
    situacionInicial: longText,
    squadId: id.nullable().optional(),
    fechaRecepcionP1p2: civilDateString.nullable().optional(),
    fechaInicio: civilDateString.nullable().optional(),
    fechaTerminoBaseline: civilDateString.nullable().optional(),
    referenciaSap: shortRef,
    referenciaCeco: shortRef,
    referenciaPep: shortRef,
  }),
  transfer: z.strictObject({ workspaceId: id, pmTitularId: id, version: id }),
  substitution: z.strictObject({
    delegateId: id,
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
    reason: z.string().trim().min(1).max(2000),
    permissions: z.array(z.string().min(1).max(100)).min(1).max(20),
  }),
  member: z.strictObject({ estado: z.enum(["ACTIVA", "SUSPENDIDA", "RETIRADA"]) }),
  participant: z.strictObject({ userId: id, funcion: z.enum(["ESPECIALISTA", "OBSERVADOR"]) }),
  list: z.strictObject({ after: cursor.optional(), limit: limitString }),
  portfolioQuery: z.strictObject({
    q: searchQuery,
    workspaceId: id.optional(),
    paisId: id.optional(),
    lobId: id.optional(),
    squadId: id.optional(),
    clienteId: id.optional(),
    pmTitularId: id.optional(),
    estado: projectState.optional(),
    incluirInactivos: z.enum(["true", "false"]).optional(),
    ordenarPor: z.enum(["id", "tvt", "nombre", "cliente", "estado", "fechaTerminoActual", "updatedAt"]).optional(),
    direccion: z.enum(["asc", "desc"]).optional(),
    limit: limitString,
    offset: offsetString,
    after: cursor.optional(),
  }),
  workspacePortfolioQuery: z.strictObject({
    q: searchQuery,
    paisId: id.optional(),
    lobId: id.optional(),
    squadId: id.optional(),
    clienteId: id.optional(),
    pmTitularId: id.optional(),
    estado: projectState.optional(),
    incluirInactivos: z.enum(["true", "false"]).optional(),
    ordenarPor: z.enum(["id", "tvt", "nombre", "cliente", "estado", "fechaTerminoActual", "updatedAt"]).optional(),
    direccion: z.enum(["asc", "desc"]).optional(),
    limit: limitString,
    offset: offsetString,
    after: cursor.optional(),
  }),
};

const workspace = z.strictObject({ id, nombre: z.string(), slug: z.string(), version: id });
const project = z.strictObject({ id, tvt: z.string(), nombre: z.string(), workspaceId: id, version: id });
const participationFunction = z.enum(["PM_TITULAR", "ESPECIALISTA", "OBSERVADOR", "LIDER_TECNICO", "TAM", "SDM"]);

export const outputs = {
  workspace,
  workspaces: z.array(workspace),
  workspaceDetail: z.strictObject({
    id,
    nombre: z.string(),
    slug: z.string(),
    estado: z.enum(["ACTIVO", "ARCHIVADO"]),
    version: id,
    creadoPorId: id,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    miMembresia: z
      .strictObject({
        id,
        estado: z.enum(["ACTIVA", "SUSPENDIDA", "RETIRADA"]),
        puedeCrearProyectos: z.boolean(),
        rol: role,
      })
      .nullable(),
    permisos: z.strictObject({
      puedeConfigurar: z.boolean(),
      puedeCrearProyectos: z.boolean(),
      puedeInvitar: z.boolean(),
      puedeGestionarMiembros: z.boolean(),
    }),
    resumen: z.strictObject({
      miembrosActivos: z.number().int().nonnegative(),
      proyectosActivos: z.number().int().nonnegative(),
      invitacionesPendientes: z.number().int().nonnegative(),
    }),
  }),
  workspaceMembers: z.strictObject({
    items: z.array(
      z.strictObject({
        id,
        usuarioId: id,
        nombre: z.string(),
        email: z.string().nullable(),
        tipoUsuario: z.enum(["INTERNO", "EXTERNO"]),
        usuarioActivo: z.boolean(),
        rol: role.nullable(),
        estado: z.enum(["ACTIVA", "SUSPENDIDA", "RETIRADA"]),
        puedeCrearProyectos: z.boolean(),
        esElegibleTitular: z.boolean(),
        createdAt: z.iso.datetime(),
        updatedAt: z.iso.datetime(),
      }),
    ),
    nextCursor: id.nullable(),
    total: z.number().int().nonnegative(),
  }),
  workspaceInvitations: z.strictObject({
    items: z.array(
      z.strictObject({
        id,
        workspaceId: id,
        emailDestinatario: z.string(),
        rolSolicitado: z.enum(["PM", "ESPECIALISTA", "VISUALIZADOR"]),
        puedeCrearProyectos: z.boolean(),
        estado: z.enum(["PENDIENTE", "ACEPTADA", "REVOCADA", "EXPIRADA"]),
        invitadoPorId: id,
        expiresAt: z.iso.datetime(),
        acceptedAt: z.iso.datetime().nullable(),
        createdAt: z.iso.datetime(),
      }),
    ),
    nextCursor: id.nullable(),
    total: z.number().int().nonnegative(),
  }),
  workspaceEligible: z.strictObject({
    items: z.array(
      z.strictObject({
        usuarioId: id,
        nombre: z.string(),
        email: z.string(),
        tipoUsuario: z.enum(["INTERNO", "EXTERNO"]),
        rol: role,
        miembroActivo: z.boolean(),
        puedeCrearProyectos: z.boolean(),
      }),
    ),
  }),
  catalogs: z.strictObject({
    paises: z.array(z.strictObject({ id, codigo: z.string(), nombre: z.string() })),
    lobs: z.array(z.strictObject({ id, nombre: z.string() })),
    serviciosLob: z.array(z.strictObject({ id, lobId: id, nombre: z.string() })),
    squads: z.array(z.strictObject({ id, nombre: z.string() })),
    clientes: z.array(z.strictObject({ id, nombre: z.string(), sector: z.string().nullable() })),
    estadosProyecto: z.array(projectState),
  }),
  project,
  projects: z.array(project.extend({ estado: z.string() })),
  projectDetail: project.extend({
    estado: projectState,
    identidad: z.strictObject({
      id,
      tvt: z.string(),
      tvtNormalizado: z.string(),
      nombre: z.string(),
      descripcion: z.string().nullable(),
      situacionInicial: z.string().nullable(),
      activo: z.boolean(),
      workspace: z.strictObject({ id, nombre: z.string(), slug: z.string() }),
      cliente: z.strictObject({ id, nombre: z.string(), sector: z.string().nullable() }),
      pais: z.strictObject({ id, codigo: z.string(), nombre: z.string() }),
      lob: z.strictObject({ id, nombre: z.string() }),
      squad: z.strictObject({ id, nombre: z.string() }).nullable(),
      referenciasInternas: z
        .strictObject({
          sap: z.string().nullable(),
          ceco: z.string().nullable(),
          pep: z.string().nullable(),
        })
        .nullable(),
    }),
    gobierno: z.strictObject({
      estadoActual: projectState,
      version: id,
      titular: z.strictObject({
        usuarioId: id,
        nombre: z.string(),
        email: z.string().nullable(),
      }),
      participantes: z.array(
        z.strictObject({
          id,
          usuarioId: id,
          nombre: z.string(),
          funcion: participationFunction,
          fechaInicio: z.iso.datetime(),
        }),
      ),
      suplenciaEfectiva: z
        .strictObject({
          id,
          delegadoId: id,
          delegadoNombre: z.string(),
          inicio: z.iso.datetime(),
          fin: z.iso.datetime(),
          permisos: z.array(z.string()),
        })
        .nullable(),
      createdAt: z.iso.datetime(),
      updatedAt: z.iso.datetime(),
    }),
    planificacion: z.strictObject({
      fechaRecepcionP1p2: civilDateString.nullable(),
      fechaInicio: civilDateString.nullable(),
      fechaTerminoBaseline: civilDateString.nullable(),
      fechaTerminoActual: civilDateString.nullable(),
      baselineCongelada: z.boolean(),
    }),
    accionesDisponibles: z.strictObject({
      puedeEditarFicha: z.boolean(),
      puedeFijarBaseline: z.boolean(),
      puedeTransferir: z.boolean(),
      puedeGestionarParticipantes: z.boolean(),
      puedeDesignarSuplencia: z.boolean(),
      puedeRevocarSuplencia: z.boolean(),
    }),
    modulosPendientes: z.strictObject({
      complejidad: z.literal("PENDIENTE_P1"),
      riesgos: z.literal("PENDIENTE_P2"),
      controlesCambio: z.literal("PENDIENTE_P3"),
      seguimientoCurvaS: z.literal("PENDIENTE_P4"),
      facturacionCpi: z.literal("PENDIENTE_P4"),
      compras: z.literal("PENDIENTE_P5"),
      checklistLeccionesCierre: z.literal("PENDIENTE_P6"),
    }),
  }),
  projectAssignments: z.strictObject({
    projectId: id,
    workspaceId: id,
    titular: z.strictObject({
      participacionId: id,
      usuarioId: id,
      nombre: z.string(),
      email: z.string().nullable(),
      rolCorporativo: z.literal("PM"),
      estadoMembresiaWorkspace: z.enum(["ACTIVA", "SUSPENDIDA", "RETIRADA"]),
      fechaInicio: z.iso.datetime(),
    }),
    participantes: z.array(
      z.strictObject({
        id,
        usuarioId: id,
        nombre: z.string(),
        email: z.string().nullable(),
        tipoUsuario: z.enum(["INTERNO", "EXTERNO"]),
        rolCorporativo: role.nullable(),
        estadoMembresiaWorkspace: z.enum(["ACTIVA", "SUSPENDIDA", "RETIRADA"]).nullable(),
        funcion: z.enum(["ESPECIALISTA", "OBSERVADOR", "LIDER_TECNICO", "TAM", "SDM"]),
        fechaInicio: z.iso.datetime(),
      }),
    ),
    suplenciasVigentes: z.array(
      z.strictObject({
        id,
        deleganteId: id,
        delegadoId: id,
        delegadoNombre: z.string(),
        autorizadoPorId: id.nullable(),
        inicio: z.iso.datetime(),
        fin: z.iso.datetime(),
        estado: z.enum(["PENDIENTE", "ACTIVA"]),
        motivo: z.string(),
        permisos: z.array(z.string()),
      }),
    ),
    permisosDelegables: z.array(
      z.strictObject({
        codigo: z.string(),
        descripcion: z.string(),
      }),
    ),
  }),
  portfolio: z.strictObject({
    items: z.array(
      z.strictObject({
        id,
        tvt: z.string(),
        tvtNormalizado: z.string(),
        nombre: z.string(),
        estado: projectState,
        activo: z.boolean(),
        version: id,
        workspace: z.strictObject({ id, nombre: z.string(), slug: z.string() }),
        cliente: z.strictObject({ id, nombre: z.string() }),
        pais: z.strictObject({ id, codigo: z.string(), nombre: z.string() }),
        lob: z.strictObject({ id, nombre: z.string() }),
        squad: z.strictObject({ id, nombre: z.string() }).nullable(),
        titular: z.strictObject({ usuarioId: id, nombre: z.string() }),
        fechas: z.strictObject({
          recepcionP1p2: civilDateString.nullable(),
          inicio: civilDateString.nullable(),
          terminoBaseline: civilDateString.nullable(),
          terminoActual: civilDateString.nullable(),
        }),
        updatedAt: z.iso.datetime(),
        indicadoresPendientes: z.strictObject({
          spi: z.null(),
          cpi: z.null(),
          complejidad: z.null(),
          riesgosAbiertos: z.null(),
          ahorroCompras: z.null(),
          estadoModulos: z.literal("PENDIENTE_PAQUETES_P1_P5"),
        }),
      }),
    ),
    paginacion: z.strictObject({
      limit: z.number().int().positive(),
      offset: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
      hasMore: z.boolean(),
      nextOffset: z.number().int().nonnegative().nullable(),
      nextCursor: id.nullable(),
    }),
    resumenPorEstado: z.strictObject({
      total: z.number().int().nonnegative(),
      porEstado: z.strictObject({
        "Requiere P1P2": z.number().int().nonnegative(),
        "En ejecución": z.number().int().nonnegative(),
        "En transición": z.number().int().nonnegative(),
        "Detenido": z.number().int().nonnegative(),
        "Cancelado": z.number().int().nonnegative(),
        "Cerrado exitoso": z.number().int().nonnegative(),
        "Cerrado con observaciones": z.number().int().nonnegative(),
      }),
    }),
  }),
  session: z.strictObject({
    identifier: z.string(),
    expiresAt: z.iso.datetime(),
    role: role.nullable(),
    permissions: z.array(z.string()),
  }),
  closed: z.strictObject({ status: z.literal("closed") }),
  invitation: z.strictObject({ id, token: z.string(), expiresAt: z.iso.datetime(), delivery: z.literal("PENDING") }),
  accepted: z.strictObject({ workspaceId: id, userId: id }),
  enabled: z.strictObject({ id, enabled: z.boolean() }),
  assignment: z.strictObject({ userId: id, role, scope: z.enum(["GLOBAL", "ASIGNADOS"]), assignmentId: id }),
  inactive: z.strictObject({ userId: id, status: z.literal("INACTIVE") }),
  recovery: z.strictObject({
    userId: id,
    token: z.string(),
    expiresInSeconds: z.literal(1800),
    delivery: z.literal("PENDING"),
  }),
  reset: z.strictObject({ status: z.literal("PASSWORD_UPDATED") }),
  transferred: z.strictObject({ id, tvt: z.string(), workspaceId: id, pmTitularId: id, version: id }),
  substitution: z.strictObject({
    id,
    projectId: id,
    delegateId: id,
    start: z.iso.datetime(),
    end: z.iso.datetime(),
    state: z.literal("ACTIVA"),
  }),
  revoked: z.strictObject({ id, state: z.literal("REVOCADA") }),
  member: z.strictObject({ id, estado: z.enum(["ACTIVA", "SUSPENDIDA", "RETIRADA"]) }),
  participant: z.strictObject({ id, projectId: id, userId: id, funcion: z.enum(["ESPECIALISTA", "OBSERVADOR"]) }),
  roleRevoked: z.strictObject({ userId: id, status: z.literal("ROLE_REVOKED") }),
  health: z.strictObject({ status: z.literal("ok"), version: z.literal("2.1.0") }),
  ready: z.strictObject({ status: z.literal("ready"), migration: z.string().nullable() }),
};

export const errorSchema = z.strictObject({
  error: z.strictObject({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
  requestId: z.string(),
});
