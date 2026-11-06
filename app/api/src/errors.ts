export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const headers = (requestId: string) => ({
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-request-id": requestId,
});

export function respond(data: unknown, requestId: string, status = 200): Response {
  return new Response(JSON.stringify({ data }, (_key,value:unknown)=>typeof value==='bigint'?value.toString():value), { status, headers: headers(requestId) });
}

export function respondError(error: unknown, requestId: string): Response {
  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({ error: { code: error.code, message: error.message, fields: error.fields }, requestId }),
      { status: error.status, headers: headers(requestId) },
    );
  }

  const value = error as { code?: string; errno?: string; message?: string };
  const sqlState = value.errno ?? value.code ?? "";
  if (["23505","23P01","P0001","40001","40P01"].includes(sqlState)) {
    return new Response(
      JSON.stringify({ error: { code: "CONFLICT", message: "El registro ya existe o entra en conflicto con otro." }, requestId }),
      { status: 409, headers: headers(requestId) },
    );
  }
  if (["23503","23514","23502","22003","22007","22008","22P02"].includes(sqlState)) {
    return new Response(
      JSON.stringify({ error: { code: "INVALID_REFERENCE", message: "Una referencia o restricción de la base de datos no es válida." }, requestId }),
      { status: 422, headers: headers(requestId) },
    );
  }
  if (sqlState.startsWith('08') || ['57P01','57P02','57P03'].includes(sqlState) || value.code?.startsWith("ECONN") || value.code==='ERR_POSTGRES_CONNECTION_CLOSED' || value.code==='ERR_POSTGRES_CONNECTION_TIMEOUT') {
    return new Response(
      JSON.stringify({ error: { code: "DATABASE_UNAVAILABLE", message: "La base de datos no está disponible." }, requestId }),
      { status: 503, headers: headers(requestId) },
    );
  }

  console.error(`[${requestId}] error inesperado: ${value.code ?? "sin código"}`);
  return new Response(
    JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." }, requestId }),
    { status: 500, headers: headers(requestId) },
  );
}
