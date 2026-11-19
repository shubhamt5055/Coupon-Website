import type { APIRoute } from "astro";
import { getDb } from "../../../lib/cloudflare";
import { createUser, getUserByEmail } from "../../../lib/db";
import {
  buildUserSessionCookie,
  createUserSessionToken,
  hashPassword,
} from "../../../lib/auth";
import { validateRegisterInput } from "../../../lib/validation";

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

    const validation = validateRegisterInput(body);
    if (!validation.ok || !validation.data) {
      return Response.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;
    const db = getDb();

    // Check if email already registered
    const existing = await getUserByEmail(db, email);
    if (existing) {
      return Response.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Hash password with PBKDF2 (100,000 iterations, random salt)
    const { hash, salt } = await hashPassword(password);
    const userId = await createUser(db, {
      name,
      email,
      password_hash: hash,
      password_salt: salt,
      role: "user",
    });

    // Create session token & cookie
    const token = await createUserSessionToken({
      id: userId,
      email,
      name,
      role: "user",
    });
    const cookie = buildUserSessionCookie(token, request.url);

    return new Response(
      JSON.stringify({
        ok: true,
        user: { id: userId, name, email },
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
        },
      }
    );
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return Response.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
};
