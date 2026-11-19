/**
 * Reusable API Response and Request Parsing Helpers
 * Provides standardized JSON responses and uniform body parsing across all endpoints.
 */

export function jsonResponse<T = unknown>(
  data: T,
  status = 200,
  headers: HeadersInit = {}
): Response {
  return Response.json(data, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

export function jsonError(
  message: string,
  status = 400,
  extra: Record<string, unknown> = {}
): Response {
  return Response.json({ error: message, ...extra }, { status });
}

export async function parseBody<T = Record<string, unknown>>(
  request: Request
): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await request.json()) as T;
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries()) as unknown as T;
}

export function parseId(val: unknown): number | null {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}
