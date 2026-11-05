import { evaluateClosure } from '../../domain/closure';
import { isClosedProject } from '../../domain/projects/state';
import type { ClosurePort } from '../ports/closure';

export async function closeProject(port: ClosurePort, projectKey: string, actorId: string, today: string): Promise<{ id: string; state: string }> {
  return port.transact(async tx => {
    const snapshot = await tx.load(projectKey, actorId, 'proyectos.cerrar');
    if (isClosedProject(snapshot.state)) throw new Error('Proyecto ya cerrado');
    const result = evaluateClosure(snapshot.id, snapshot.items, snapshot.lessonCount, snapshot.risks);
    await tx.close(snapshot, result.state, actorId, today);
    return { id: snapshot.id, state: result.state };
  });
}

export async function reopenProject(port: ClosurePort, projectKey: string, actorId: string, reason: string): Promise<{ id: string; state: 'En ejecución' }> {
  if (!reason.trim()) throw new Error('Motivo de reapertura obligatorio');
  return port.transact(async tx => {
    const snapshot = await tx.load(projectKey, actorId, 'proyectos.cerrar');
    if (!isClosedProject(snapshot.state)) throw new Error('Proyecto no cerrado');
    await tx.reopen(snapshot, actorId, 'En ejecución', reason.trim());
    return { id: snapshot.id, state: 'En ejecución' };
  });
}
