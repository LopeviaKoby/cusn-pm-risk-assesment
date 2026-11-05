import type { ClosureItem, ClosureRisk } from '../../domain/closure';
export interface ClosureSnapshot {
  readonly id: string;
  readonly state: string;
  readonly items: readonly ClosureItem[];
  readonly lessonCount: number;
  readonly risks: readonly ClosureRisk[];
}
export interface ClosureTransaction {
  load(projectKey: string, actorId: string, permission: string): Promise<ClosureSnapshot>;
  close(snapshot: ClosureSnapshot, state: 'Cerrado exitoso' | 'Cerrado con observaciones', actorId: string, today: string): Promise<void>;
  reopen(snapshot: ClosureSnapshot, actorId: string, state: 'En ejecución', reason: string): Promise<void>;
}
export interface ClosurePort { transact<T>(work: (tx: ClosureTransaction) => Promise<T>): Promise<T> }
