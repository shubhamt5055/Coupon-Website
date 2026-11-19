import type { APIRoute } from "astro";
import { getDb } from "../../../lib/cloudflare";
import { getUserByEmail } from "../../../lib/db";
import {
  buildUserSessionCookie,
  createUserSessionToken,
  verifyPassword,
} from "../../../lib/auth";
import { validateLoginInput } from "../../../lib/validation";
import { jsonError, jsonResponse, parseBody } from "../../../lib/api";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await parseBody(request);
    const validation = validateLoginInput(body);
    if (!validation.ok || !validation.data) {
      return jsonError(validation.errors[0], 400, { errors: validation.errors });
    }

    const { email, password } = validation.data;
    const db = getDb();
    const user = await getUserByEmail(db, email);

    if (!user) {
      return jsonError("No account found with this email. Please create an account first!", 404, {
        ok: false,
        notFound: true,
        email,
      });
    }

    const isValid = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!isValid) {
      return jsonError("Incorrect password. Please verify your password and try again.", 401, {
        ok: false,
        notFound: false,
      });
    }

    const token = await createUserSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    const cookie = buildUserSessionCookie(token, request.url);

    return jsonResponse(
      { ok: true, user: { id: user.id, name: user.name, email: user.email } },
      200,
      { "Set-Cookie": cookie }
    );
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return jsonError("Login failed. Please try again.", 500);
  }
};
