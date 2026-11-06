import { sql } from "../../db";
import { assertPermission } from "../../authorization";
import { ApiError } from "../../errors";
import {renameProject} from '../../repositories/projects';

export async function editProjectName(actorId: string, projectId: string, expectedVersion: string, name: string) {
  const nombre = name.trim();
  if (!nombre || nombre.length > 200) throw new ApiError(422,"INVALID_NAME","Nombre de proyecto no válido.");
  return sql.begin(async tx => {
    const [locked]=await tx`SELECT id FROM pmo_cusn.proyecto WHERE id=${projectId} AND activo FOR UPDATE`;
    if(!locked)throw new ApiError(404,'NOT_FOUND','Proyecto no encontrado.');
    await tx`SELECT u.id FROM pmo_cusn.usuario u JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id
      WHERE u.id=${actorId} AND a.revocado_at IS NULL FOR SHARE OF u,a`;
    await assertPermission(actorId,"proyectos.editar",projectId,tx);
    const [delegation]=await tx<{id:string}>`SELECT d.id::text FROM pmo_cusn.delegacion_acceso d
      JOIN pmo_cusn.delegacion_permiso dp ON dp.delegacion_id=d.id JOIN pmo_cusn.permiso p ON p.id=dp.permiso_id
      WHERE d.proyecto_id=${projectId} AND d.delegado_id=${actorId} AND d.estado='ACTIVA'
        AND d.inicio<=now() AND d.fin>now() AND d.revocado_at IS NULL AND p.codigo='proyectos.editar'
        AND NOT EXISTS (SELECT 1 FROM pmo_cusn.participacion_proyecto pp WHERE pp.proyecto_id=${projectId}
          AND pp.usuario_id=${actorId} AND pp.funcion='PM_TITULAR' AND pp.fecha_fin IS NULL)
      FOR SHARE OF d`;
    const row=await renameProject(tx,projectId,expectedVersion,nombre);
    if (!row) throw new ApiError(409,"VERSION_CONFLICT","El proyecto cambió; vuelve a cargarlo.");
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,delegacion_id,workspace_id,proyecto_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${actorId},${delegation?.id??null},${row.workspaceId},${projectId},'proyectos.editar','proyecto',${projectId},'PERMITIDO')`;
    return row;
  });
}
