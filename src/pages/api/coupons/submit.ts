import type { APIRoute } from "astro";
import { getDb } from "../../../lib/cloudflare";
import { createCoupon } from "../../../lib/db";
import { getAuthenticatedUser } from "../../../lib/auth";
import { validateCouponInput } from "../../../lib/validation";
import { jsonError, jsonResponse, parseBody } from "../../../lib/api";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user ?? (await getAuthenticatedUser(request));
    if (!user) {
      return jsonError("You must be signed in to submit a coupon.", 401);
    }

    const body = await parseBody(request);
    const validation = validateCouponInput({
      ...body,
      user_id: user.id,
      is_active: 0, // Inactive until verified and approved by admin
    });

    if (!validation.ok || !validation.data) {
      return jsonError(validation.errors[0], 400, { errors: validation.errors });
    }

    const id = await createCoupon(getDb(), validation.data);
    return jsonResponse({ ok: true, id, status: "pending_verification" }, 201);
  } catch (error) {
    console.error("POST /api/coupons/submit error:", error);
    return jsonError("Failed to submit coupon. Please check that store and category are valid.", 500);
  }
};
