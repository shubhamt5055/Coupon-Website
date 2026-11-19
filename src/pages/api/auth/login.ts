import type { APIRoute } from "astro";
import { getDb } from "../../../lib/cloudflare";
import { getUserByEmail } from "../../../lib/db";
import {
  buildUserSessionCookie,
  createUserSessionToken,
  verifyPassword,
} from "../../../lib/auth";
import { validateLoginInput } from "../../../lib/validation";

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let body: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      body = (await request.json()) as Record<string, unknown>;
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }

    const validation = validateLoginInput(body);
    if (!validation.ok || !validation.data) {
      return Response.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const db = getDb();
    const user = await getUserByEmail(db, email);

    if (!user) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!isValid) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await createUserSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    const cookie = buildUserSessionCookie(token, request.url);

    return new Response(
      JSON.stringify({
        ok: true,
        user: { id: user.id, name: user.name, email: user.email },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
        },
      }
    );
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return Response.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
};
