import type { SQL } from "bun";
import { sql } from "./db";
import { ApiError } from "./errors";

export async function hasPermission(actorId: string, permission: string, projectId: string | null, db: SQL = sql): Promise<boolean> {
  const [row] = await db<{ allowed: boolean }>`
    WITH resource AS (SELECT id,pais_id FROM pmo_cusn.proyecto WHERE id::text=${projectId} AND activo),
    grants AS (
      SELECT a.usuario_id,a.alcance,a.pais_id,a.proyecto_id,p.delegable FROM pmo_cusn.asignacion_rol a
      JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.activo
      JOIN pmo_cusn.rol_permiso rp ON rp.rol_id=r.id
      JOIN pmo_cusn.permiso p ON p.id=rp.permiso_id AND p.codigo=${permission}
      JOIN pmo_cusn.usuario u ON u.id=a.usuario_id AND u.activo WHERE a.activo
    ), scoped AS (
      SELECT * FROM grants g WHERE g.alcance='GLOBAL' OR EXISTS (
        SELECT 1 FROM resource x WHERE (g.alcance='PAIS' AND g.pais_id=x.pais_id)
          OR (g.alcance='PROYECTO' AND g.proyecto_id=x.id))
    )
    SELECT EXISTS (SELECT 1 FROM pmo_cusn.usuario u WHERE u.id::text=${actorId} AND u.activo AND (
      EXISTS(SELECT 1 FROM scoped WHERE usuario_id=u.id) OR EXISTS(
        SELECT 1 FROM pmo_cusn.delegacion_acceso d
        JOIN pmo_cusn.delegacion_permiso dp ON dp.delegacion_id=d.id
        JOIN pmo_cusn.permiso p ON p.id=dp.permiso_id AND p.codigo=${permission} AND p.delegable
        JOIN scoped g ON g.usuario_id=d.delegante_id AND g.delegable
        WHERE d.delegado_id=u.id AND d.estado='ACTIVA' AND d.autorizado_por_id IS NOT NULL
          AND now() >= d.inicio AND now() < d.fin AND (
            d.alcance='GLOBAL' OR EXISTS(SELECT 1 FROM resource x WHERE
              (d.alcance='PAIS' AND d.pais_id=x.pais_id) OR (d.alcance='PROYECTO' AND d.proyecto_id=x.id)))
      )
    )) AS allowed
  `;
  return row?.allowed === true;
}

export async function assertPermission(actorId: string, permission: string, projectId: string | null, db: SQL = sql): Promise<void> {
  if (!await hasPermission(actorId, permission, projectId, db)) {
    throw new ApiError(403, "FORBIDDEN", "No tienes permiso para esta operación y recurso.");
  }
}

export async function visibleProjects(actorId: string, db: SQL = sql): Promise<Set<string>> {
  const rows = await db<{ id: string }>`SELECT id::text AS id FROM pmo_cusn.proyecto WHERE activo`;
  const allowed = new Set<string>();
  for (const row of rows) if (await hasPermission(actorId, "proyectos.consultar", row.id, db)) allowed.add(row.id);
  if (!allowed.size && !await hasPermission(actorId,"proyectos.consultar",null,db)) {
    throw new ApiError(403,"FORBIDDEN","No tienes permiso para consultar proyectos.");
  }
  return allowed;
}
