import type { SQL } from "bun";
import { sql } from "./db";
import { ApiError } from "./errors";

type Actor = { role: "ADMIN" | "PM" | "ESPECIALISTA" | "VISUALIZADOR"; kind: "INTERNO" | "EXTERNO"; readScope: "GLOBAL" | "ASIGNADOS" };

export async function activeActor(actorId: string, db: SQL = sql): Promise<Actor | null> {
  const [actor] = await db<Actor>`SELECT r.codigo AS role,u.tipo_usuario AS kind,a.alcance_lectura AS "readScope"
    FROM pmo_cusn.usuario u JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
    JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.activo
    WHERE u.id::text=${actorId} AND u.activo AND u.password_hash IS NOT NULL FOR SHARE OF u,a`;
  if (!actor || (actor.kind === "EXTERNO" && actor.role !== "VISUALIZADOR")) return null;
  return actor;
}

export async function hasPermission(actorId: string, permission: string, projectId: string | null, db: SQL = sql): Promise<boolean> {
  const actor = await activeActor(actorId, db);
  if (!actor) return false;
  if (!await hasGrant(actorId,permission,db)) return false;
  if (actor.role === "ADMIN") return true;
  // Classification rules for external documents are not approved yet.
  if (permission.startsWith("documentos.")) return false;
  if (permission === "workspaces.crear" && actor.role === "PM") return true;
  if (!projectId) return permission === "proyectos.consultar" &&
    (actor.role === "PM" || (actor.role === "VISUALIZADOR" && actor.kind === "INTERNO" && actor.readScope === "GLOBAL"));
  const [project] = await db<{ exists: boolean }>`SELECT EXISTS(SELECT 1 FROM pmo_cusn.proyecto WHERE id::text=${projectId} AND activo) AS exists`;
  if (!project?.exists) return false;
  if (permission === "proyectos.consultar") {
    if (actor.role === "PM" || (actor.role === "VISUALIZADOR" && actor.kind === "INTERNO" && actor.readScope === "GLOBAL")) return true;
    const [assignment] = await db<{ yes: boolean }>`SELECT EXISTS(SELECT 1 FROM pmo_cusn.participacion_proyecto
      WHERE proyecto_id::text=${projectId} AND usuario_id::text=${actorId} AND fecha_inicio<=now()
        AND (fecha_fin IS NULL OR fecha_fin>now())) AS yes`;
    return assignment?.yes === true;
  }
  if (actor.role !== "PM") return false;
  const [owner] = await db<{ yes: boolean }>`SELECT EXISTS(SELECT 1 FROM pmo_cusn.participacion_proyecto
    WHERE proyecto_id::text=${projectId} AND usuario_id::text=${actorId} AND funcion='PM_TITULAR'
      AND fecha_inicio<=now() AND fecha_fin IS NULL) AS yes`;
  if (owner?.yes) return true;
  const [delegated] = await db<{ yes: boolean }>`SELECT EXISTS(SELECT 1 FROM pmo_cusn.delegacion_acceso d
    JOIN pmo_cusn.delegacion_permiso dp ON dp.delegacion_id=d.id
    JOIN pmo_cusn.permiso p ON p.id=dp.permiso_id AND p.codigo=${permission} AND p.delegable
    WHERE d.proyecto_id::text=${projectId} AND d.delegado_id::text=${actorId}
      AND d.estado='ACTIVA' AND d.inicio<=now() AND d.fin>now() AND d.revocado_at IS NULL
      AND EXISTS(SELECT 1 FROM pmo_cusn.participacion_proyecto pp
        JOIN pmo_cusn.usuario u ON u.id=pp.usuario_id AND u.activo AND u.tipo_usuario='INTERNO'
        JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
        JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.codigo='PM' AND r.activo
        WHERE pp.proyecto_id=d.proyecto_id AND pp.usuario_id=d.delegante_id AND pp.funcion='PM_TITULAR'
          AND pp.fecha_inicio<=now() AND pp.fecha_fin IS NULL)) AS yes`;
  return delegated?.yes === true;
}

export async function hasGrant(actorId:string,permission:string,db:SQL=sql):Promise<boolean>{
  if(!await activeActor(actorId,db))return false;
  const [grant] = await db<{ yes: boolean }>`SELECT EXISTS(
    SELECT 1 FROM pmo_cusn.asignacion_rol a JOIN pmo_cusn.rol_permiso rp ON rp.rol_id=a.rol_id
      JOIN pmo_cusn.permiso p ON p.id=rp.permiso_id
    WHERE a.usuario_id::text=${actorId} AND a.revocado_at IS NULL AND p.codigo=${permission}) AS yes`;
  return grant?.yes===true;
}

export async function assertPermission(actorId: string, permission: string, projectId: string | null, db: SQL = sql): Promise<void> {
  if (!await hasPermission(actorId, permission, projectId, db)) throw new ApiError(403, "FORBIDDEN", "No tienes permiso para esta operación y recurso.");
}

export async function visibleProjects(actorId: string, db: SQL = sql): Promise<Set<string>> {
  const actor = await activeActor(actorId, db);
  if (!actor) throw new ApiError(403, "FORBIDDEN", "No tienes permiso para consultar proyectos.");
  const rows = await db<{ id: string }>`SELECT id::text AS id FROM pmo_cusn.proyecto WHERE activo`;
  const allowed = new Set<string>();
  for (const row of rows) if (await hasPermission(actorId, "proyectos.consultar", row.id, db)) allowed.add(row.id);
  return allowed;
}
