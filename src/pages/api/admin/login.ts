import type { APIRoute } from "astro";
import {
  buildSessionCookie,
  createSessionToken,
  verifyAdminCredentials,
} from "../../../lib/auth";
import { jsonError, jsonResponse, parseBody } from "../../../lib/api";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await parseBody<{ username?: string; password?: string }>(request);
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    const check = verifyAdminCredentials(username, password);
    if (!check.ok) {
      return jsonError(check.reason ?? "Invalid credentials.", 401);
    }

    const token = await createSessionToken(username);
    const cookie = buildSessionCookie(token, request.url);

    return jsonResponse({ ok: true, username }, 200, { "Set-Cookie": cookie });
  } catch (error) {
    console.error("POST /api/admin/login error:", error);
    return jsonError("Login failed.", 500);
  }
};
