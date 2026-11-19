import type { APIRoute } from "astro";
import { buildClearSessionCookie } from "../../../lib/auth";

export const POST: APIRoute = async ({ request }) => {
  const cookie = buildClearSessionCookie(request.url);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie,
    },
  });
};
