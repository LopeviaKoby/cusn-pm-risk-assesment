import { sql } from "../../db";
import { activeActor } from "../../authorization";
import { ApiError } from "../../errors";

const slugBase = (name: string) => name.normalize("NFD").replace(/\p{Diacritic}/gu, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40).replace(/-$/g, "");

export async function createWorkspace(actorId: string, name: string) {
  const nombre = name.trim();
  if (!nombre || nombre.length > 200) throw new ApiError(422, "INVALID_NAME", "El nombre del workspace no es válido.");
  const base = slugBase(nombre) || "workspace";
  return sql.begin(async tx => {
    const actor = await activeActor(actorId, tx);
    if (!actor || !["ADMIN", "PM"].includes(actor.role)) throw new ApiError(403, "FORBIDDEN", "No puedes crear un workspace.");
    for (let suffix = 0; suffix < 1000; suffix++) {
      const slug = suffix === 0 ? base : `${base}-${suffix + 1}`;
      const [created] = await tx<{ id: string; slug: string; nombre: string; version: string }>`
        INSERT INTO pmo_cusn.workspace(nombre,slug,creado_por_id) VALUES (${nombre},${slug},${actorId})
        ON CONFLICT (slug) DO NOTHING RETURNING id::text,slug,nombre,version::text`;
      if (!created) continue;
      if (actor.role === "PM") await tx`INSERT INTO pmo_cusn.membresia_workspace(workspace_id,usuario_id,puede_crear_proyectos,incorporado_por_id)
        VALUES (${created.id},${actorId},true,${actorId})`;
      await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,workspace_id,operacion,recurso_tipo,recurso_id,resultado)
        VALUES (${actorId},${created.id},'workspaces.crear','workspace',${created.id},'PERMITIDO')`;
      return created;
    }
    throw new ApiError(409, "SLUG_EXHAUSTED", "No se pudo generar un slug único.");
  });
}
