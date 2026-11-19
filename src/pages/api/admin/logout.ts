import type { APIRoute } from "astro";
import { buildClearSessionCookie } from "../../../lib/auth";
import { jsonResponse } from "../../../lib/api";

export const POST: APIRoute = async ({ request }) => {
  const cookie = buildClearSessionCookie(request.url);
  return jsonResponse({ ok: true }, 200, { "Set-Cookie": cookie });
};
