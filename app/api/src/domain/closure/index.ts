export interface ClosureItem { readonly completed: boolean; readonly requiresDocument: boolean; readonly hasCurrentDocument: boolean }
export interface ClosureRisk { readonly projectId: string | null; readonly state: string; readonly strategy: string | null }
export function evaluateClosure(projectId: string, items: readonly ClosureItem[], validLessonCount: number, risks: readonly ClosureRisk[]): { state: 'Cerrado exitoso' | 'Cerrado con observaciones'; checklistOk: boolean; lessonsOk: boolean; risksOk: boolean; documentsOk: boolean } {
  const linked = risks.filter(risk => risk.projectId === projectId);
  const checklistOk = items.length > 0 && items.every(item => item.completed);
  const documentsOk = items.every(item => !item.requiresDocument || item.hasCurrentDocument);
  const lessonsOk = validLessonCount > 0;
  const risksOk = linked.every(risk => !['Pendiente', 'Contingencia'].includes(risk.state));
  if (!checklistOk || !documentsOk || !lessonsOk || !risksOk) throw new Error('Cierre sin evidencias completas');
  return { state: linked.some(risk => risk.strategy === 'Transferir') ? 'Cerrado con observaciones' : 'Cerrado exitoso', checklistOk, documentsOk, lessonsOk, risksOk };
}
