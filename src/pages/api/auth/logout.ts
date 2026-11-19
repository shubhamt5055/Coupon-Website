import type { APIRoute } from "astro";
import { buildClearUserSessionCookie } from "../../../lib/auth";
import { jsonResponse } from "../../../lib/api";

export const POST: APIRoute = async ({ request }) => {
  const cookie = buildClearUserSessionCookie(request.url);
  return jsonResponse({ ok: true }, 200, { "Set-Cookie": cookie });
};
