export type ClosedProjectState = 'Cerrado exitoso' | 'Cerrado con observaciones';
export function isClosedProject(state: string): state is ClosedProjectState {
  return state === 'Cerrado exitoso' || state === 'Cerrado con observaciones';
}
export function isOperationalRisk(projectState: string | null, hasActiveControl: boolean): boolean {
  return projectState !== null && isClosedProject(projectState) && hasActiveControl;
}
