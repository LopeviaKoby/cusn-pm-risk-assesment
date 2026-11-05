export interface PlanRequest {
  readonly projectKey: string;
  readonly field: 'FECHA_INICIO' | 'FECHA_TERMINO' | 'FECHA_OPERACION_INICIO' | 'FECHA_OPERACION_TERMINO';
  readonly proposed: string;
  readonly controlChangeId?: string;
  readonly exceptionReason?: string;
}
export interface ChangePort {
  request(input: PlanRequest, actorId: string): Promise<{ id: string; state: string }>;
  decide(id: string, decision: 'APROBADO' | 'RECHAZADO', actorId: string, note?:string): Promise<{ id: string; state: string }>;
  approveEconomic(id: string, period: string | undefined, actorId: string): Promise<{ id: string; billingId: string | null; state: 'APROBADO' }>;
}
