import type { APIRoute } from "astro";
import { buildClearUserSessionCookie } from "../../../lib/auth";

export const POST: APIRoute = async ({ request }) => {
  const cookie = buildClearUserSessionCookie(request.url);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie,
    },
  });
};
