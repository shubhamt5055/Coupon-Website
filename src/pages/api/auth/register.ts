import type { APIRoute } from "astro";
import { getDb } from "../../../lib/cloudflare";
import { createUser, getUserByEmail } from "../../../lib/db";
import {
  buildUserSessionCookie,
  createUserSessionToken,
  hashPassword,
} from "../../../lib/auth";
import { validateRegisterInput } from "../../../lib/validation";
import { jsonError, jsonResponse, parseBody } from "../../../lib/api";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await parseBody(request);
    const validation = validateRegisterInput(body);
    if (!validation.ok || !validation.data) {
      return jsonError(validation.errors[0], 400, { errors: validation.errors });
    }

    const { name, email, password } = validation.data;
    const db = getDb();

    const existing = await getUserByEmail(db, email);
    if (existing) {
      return jsonError("An account with this email already exists. Please sign in instead.", 409);
    }

    const { hash, salt } = await hashPassword(password);
    const userId = await createUser(db, {
      name,
      email,
      password_hash: hash,
      password_salt: salt,
      role: "user",
    });

    const token = await createUserSessionToken({
      id: userId,
      email,
      name,
      role: "user",
    });
    const cookie = buildUserSessionCookie(token, request.url);

    return jsonResponse(
      { ok: true, user: { id: userId, name, email } },
      201,
      { "Set-Cookie": cookie }
    );
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return jsonError("Account creation failed. Please try again.", 500);
  }
};
