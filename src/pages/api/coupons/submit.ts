import type { APIRoute } from "astro";
import { getDb, invalidateCouponCache } from "../../../lib/cloudflare";
import { createCoupon, getUserByEmail, createUser } from "../../../lib/db";
import { getAuthenticatedUser, hashPassword } from "../../../lib/auth";
import { validateCouponInput } from "../../../lib/validation";
import { jsonError, jsonResponse, parseBody } from "../../../lib/api";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user ?? (await getAuthenticatedUser(request));
    const body = await parseBody<Record<string, unknown>>(request);
    const db = getDb();

    let userId: number | null = user?.id ?? null;

    // If visitor is not signed in but provided an optional email, link to that account
    const rawEmail = typeof body.user_email === "string" ? body.user_email.trim().toLowerCase() : "";
    if (!userId && rawEmail && rawEmail.includes("@")) {
      const existingUser = await getUserByEmail(db, rawEmail);
      if (!existingUser) {
        const { hash, salt } = await hashPassword(crypto.randomUUID());
        const newId = await createUser(db, {
          name: typeof body.user_name === "string" && body.user_name.trim() ? body.user_name.trim() : rawEmail.split("@")[0],
          email: rawEmail,
          password_hash: hash,
          password_salt: salt,
          role: "user",
        });
        userId = newId;
      } else {
        userId = existingUser.id;
      }
    }

    const validation = validateCouponInput({
      ...body,
      user_id: userId,
      is_active: 1, // Immediately live! No admin verification required.
    });

    if (!validation.ok || !validation.data) {
      return jsonError(validation.errors[0], 400, { errors: validation.errors });
    }

    const id = await createCoupon(db, validation.data);
    await invalidateCouponCache();

    return jsonResponse(
      {
        ok: true,
        id,
        status: "live",
        message: "Coupon published live immediately!",
      },
      201
    );
  } catch (error) {
    console.error("POST /api/coupons/submit error:", error);
    return jsonError("Failed to submit coupon. Please check that store and category are valid.", 500);
  }
};
