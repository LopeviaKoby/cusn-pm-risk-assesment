type ErrorBody = {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
  requestId?: string;
};

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

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(path, { ...init, headers, credentials: "same-origin" });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  const error = (body as ErrorBody | null)?.error;
  if (!response.ok || error) {
    throw new ApiError(
      response.status,
      error?.code ?? "HTTP_ERROR",
      error?.message ?? `La API respondió con estado ${response.status}.`,
      error?.fields,
    );
  }
  if (!body || typeof body !== "object" || !("data" in body)) {
    throw new ApiError(502, "INVALID_RESPONSE", "La API devolvió una respuesta no válida.");
  }
  return (body as { data: T }).data;
}
