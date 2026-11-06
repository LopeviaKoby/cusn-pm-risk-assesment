import type { SQL } from 'bun';
import { sql } from '../db';
import { activeActor, hasGrant } from '../authorization';
import { ApiError } from '../errors';

async function assertInternalReader(actorId: string, db: SQL, clientsOnly = false) {
  const actor = await activeActor(actorId, db);
  if (!actor || actor.kind !== 'INTERNO' || (clientsOnly && !['ADMIN', 'PM'].includes(actor.role)) ||
      !await hasGrant(actorId, 'proyectos.consultar', db)) {
    throw new ApiError(403, 'FORBIDDEN', 'No tienes permiso para consultar este recurso.');
  }
}

export async function searchClients(actorId: string, query: { q?: string; limit?: string; after?: string }) {
  return sql.begin(async tx => {
    await assertInternalReader(actorId, tx, true);
    const limit = Number(query.limit ?? 50);
    const pattern = query.q ? `%${query.q.replace(/[\\%_]/g, '\\$&')}%` : null;
    const [count] = await tx<{ total: string }>`SELECT count(*)::text AS total FROM pmo_cusn.cliente
      WHERE activo AND (${pattern}::text IS NULL OR nombre ILIKE ${pattern} ESCAPE '\\')`;
    const rows = await tx<{ id: string; nombre: string; sector: string | null; estadoCliente: "NUEVO" | "ANTIGUO" | null }>`
      SELECT c.id::text,c.nombre,c.sector,c.estado_cliente AS "estadoCliente" FROM pmo_cusn.cliente c
      WHERE c.activo AND c.id>${query.after ?? '0'}::bigint
        AND (${pattern}::text IS NULL OR c.nombre ILIKE ${pattern} ESCAPE '\\')
      ORDER BY c.id ASC LIMIT ${limit + 1}`;
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    return { items, paginacion: { limit, total: Number(count!.total), hasMore,
      nextCursor: hasMore ? items[items.length - 1]!.id : null } };
  });
}

export async function createClient(actorId: string, name: string, estadoCliente: "NUEVO" | "ANTIGUO") {
  const nombre = name.trim();
  if (!nombre || nombre.length > 200) throw new ApiError(422, 'INVALID_FIELD', 'Nombre de cliente no válido.');
  return sql.begin(async tx => {
    const actor = await activeActor(actorId, tx);
    if (!actor || actor.kind !== 'INTERNO' || !['ADMIN', 'PM'].includes(actor.role) ||
        !await hasGrant(actorId, 'clientes.crear', tx)) {
      throw new ApiError(403, 'FORBIDDEN', 'No tienes permiso para registrar clientes.');
    }
    // Equal names are allowed: every valid request creates a distinct persistent identity.
    const [client] = await tx<{ id: string; nombre: string; sector: string | null; estadoCliente: "NUEVO" | "ANTIGUO" | null }>`
      INSERT INTO pmo_cusn.cliente(nombre,estado_cliente) VALUES (${nombre},${estadoCliente}) RETURNING id::text,nombre,sector,estado_cliente AS "estadoCliente"`;
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},'clientes.crear','cliente',${client!.id},'PERMITIDO')`;
    return client!;
  });
}

export async function listCountries(actorId: string) {
  await assertInternalReader(actorId, sql);
  return sql<{ id: string; codigo: string; nombre: string }>`
    SELECT id::text,codigo,nombre FROM pmo_cusn.pais WHERE activo ORDER BY nombre,id`;
}

export async function listLobs(actorId: string) {
  await assertInternalReader(actorId, sql);
  return sql<{ id: string; nombre: string }>`
    SELECT id::text,nombre FROM pmo_cusn.lob WHERE activo ORDER BY nombre,id`;
}
