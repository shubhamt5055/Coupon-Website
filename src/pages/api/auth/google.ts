import type { APIRoute } from "astro";
import { getDb } from "../../../lib/cloudflare";
import { getUserByEmail, createUser } from "../../../lib/db";
import {
  buildUserSessionCookie,
  createUserSessionToken,
  hashPassword,
} from "../../../lib/auth";
import { jsonError, jsonResponse, parseBody } from "../../../lib/api";

function parseJwtPayload(token: string): { email?: string; name?: string; sub?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await parseBody<Record<string, unknown>>(request);
    let email = "";
    let name = "";

    // 1. Check if Google OAuth ID token (credential) was passed from Google Identity Services
    if (typeof body.credential === "string" && body.credential.includes(".")) {
      const payload = parseJwtPayload(body.credential);
      if (payload && payload.email) {
        email = payload.email.trim().toLowerCase();
        name = payload.name?.trim() || email.split("@")[0];
      }
    }

    // 2. Direct Google sign-in (email/name)
    if (!email && typeof body.email === "string") {
      email = body.email.trim().toLowerCase();
      name =
        typeof body.name === "string" && body.name.trim()
          ? body.name.trim()
          : email.split("@")[0];
    }

    if (!email || !email.includes("@") || email.length < 5) {
      return jsonError("A valid Google email address is required.", 400);
    }

    const db = getDb();
    let user = await getUserByEmail(db, email);

    // If user does not exist yet, create account automatically
    if (!user) {
      const { hash, salt } = await hashPassword(crypto.randomUUID());
      const newUserId = await createUser(db, {
        name: name || email.split("@")[0],
        email,
        password_hash: hash,
        password_salt: salt,
        role: "user",
      });

      user = {
        id: newUserId,
        email,
        name: name || email.split("@")[0],
        role: "user",
        password_hash: hash,
        password_salt: salt,
        created_at: new Date().toISOString(),
      };
    }

    // Generate signed user session token
    const token = await createUserSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const cookie = buildUserSessionCookie(token, request.url);

    return jsonResponse(
      {
        ok: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      200,
      { "Set-Cookie": cookie }
    );
  } catch (error) {
    console.error("POST /api/auth/google error:", error);
    return jsonError("Google sign-in failed. Please try again.", 500);
  }
};
