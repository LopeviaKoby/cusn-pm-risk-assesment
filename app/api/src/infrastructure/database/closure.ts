import type { SQL } from 'bun';
import { sql } from '../../db';
import { ApiError } from '../../errors';
import { assertPermission } from '../../authorization';
import { lockProject } from '../../repositories/writes';
import type { ClosurePort, ClosureSnapshot, ClosureTransaction } from '../../application/ports/closure';

class PgClosureTransaction implements ClosureTransaction {
  constructor(private readonly tx: SQL) {}
  async load(key: string, actor: string, permission: string): Promise<ClosureSnapshot> {
    const project = await lockProject(this.tx, key);
    const id = project.key;
    await assertPermission(actor, permission, id, this.tx);
    await assertPermission(actor, 'proyectos.consultar', id, this.tx);
    const [items, lessons, risks] = await Promise.all([
      this.tx<{ completed: boolean; requiere_documento: boolean; has_document: boolean }>`SELECT i.completado completed,i.requiere_documento,
        EXISTS(SELECT 1 FROM pmo_cusn.item_checklist_documento l JOIN pmo_cusn.documento d ON d.id=l.documento_id
          WHERE l.item_checklist_id=i.id AND d.estado_registro='VIGENTE') has_document
        FROM pmo_cusn.item_checklist_proyecto i WHERE i.proyecto_id=${id}`,
      this.tx<{ n: string }>`SELECT count(*)::text n FROM pmo_cusn.leccion_aprendida
        WHERE proyecto_id=${id} AND btrim(titulo)<>'' AND btrim(leccion)<>''`,
      this.tx<{ project_id: string; state: string; strategy: string | null }>`SELECT proyecto_id::text project_id,estado state,estrategia strategy
        FROM pmo_cusn.riesgo_proyecto WHERE proyecto_id=${id}`,
    ]);
    return { id, state: String(project.estado_actual), items: items.map(item => ({ completed: item.completed,
      requiresDocument: item.requiere_documento, hasCurrentDocument: item.has_document })),
      lessonCount: Number(lessons[0]?.n ?? 0), risks: risks.map(risk => ({ projectId: risk.project_id, state: risk.state, strategy: risk.strategy })) };
  }
  async close(snapshot: ClosureSnapshot, state: 'Cerrado exitoso' | 'Cerrado con observaciones', actor: string, today: string): Promise<void> {
    const id = snapshot.id;
    await this.tx`INSERT INTO pmo_cusn.validacion_cierre(proyecto_id,validador_id,checklist_ok,documentos_ok,riesgos_ok,lecciones_ok,resultado)
      VALUES (${id},${actor},true,true,true,true,'APTO')`;
    await this.tx`UPDATE pmo_cusn.proyecto SET estado_actual=${state},fecha_cierre_real=${today},periodo_cierre_mes=${today.slice(0,7)},updated_at=now() WHERE id=${id}`;
    await this.tx`INSERT INTO pmo_cusn.evento_proyecto(proyecto_id,actor_id,tipo_evento,estado_anterior,estado_nuevo,detalle)
      VALUES (${id},${actor},'CIERRE',${snapshot.state},${state},${JSON.stringify({ fechaCierre: today })}::jsonb)`;
  }
  async reopen(snapshot: ClosureSnapshot, actor: string, state: 'En ejecución', reason: string): Promise<void> {
    const id = snapshot.id;
    await this.tx`UPDATE pmo_cusn.proyecto SET estado_actual=${state},fecha_cierre_real=NULL,periodo_cierre_mes=NULL,updated_at=now() WHERE id=${id}`;
    await this.tx`INSERT INTO pmo_cusn.evento_proyecto(proyecto_id,actor_id,tipo_evento,estado_anterior,estado_nuevo,motivo,detalle)
      VALUES (${id},${actor},'REAPERTURA',${snapshot.state},${state},${reason},${JSON.stringify({ motivo: reason })}::jsonb)`;
  }
}
export const closurePort: ClosurePort = { transact: work => sql.begin(async tx => {
  try { return await work(new PgClosureTransaction(tx)); }
  catch (error) {
    if (error instanceof Error && ['Proyecto ya cerrado','Proyecto no cerrado','Cierre sin evidencias completas','Motivo de reapertura obligatorio'].includes(error.message))
      throw new ApiError(409, 'CLOSURE_RULE', error.message);
    throw error;
  }
}) };
