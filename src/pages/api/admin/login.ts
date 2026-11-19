import type { APIRoute } from "astro";
import {
  buildSessionCookie,
  createSessionToken,
  verifyAdminCredentials,
} from "../../../lib/auth";

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let username = "";
    let password = "";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { username?: string; password?: string };
      username = String(body.username ?? "");
      password = String(body.password ?? "");
    } else {
      const form = await request.formData();
      username = String(form.get("username") ?? "");
      password = String(form.get("password") ?? "");
    }

    const check = verifyAdminCredentials(username, password);
    if (!check.ok) {
      return Response.json(
        { error: check.reason ?? "Invalid credentials." },
        { status: 401 }
      );
    }

    const token = await createSessionToken(username.trim());
    const cookie = buildSessionCookie(token, request.url);

    return new Response(JSON.stringify({ ok: true, username: username.trim() }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/login error:", error);
    return Response.json({ error: "Login failed." }, { status: 500 });
  }
};
