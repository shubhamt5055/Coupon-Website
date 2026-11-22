import type { APIRoute } from "astro";
import { getDb, invalidateCouponCache } from "../../../lib/cloudflare";
import { createCoupon } from "../../../lib/db";
import { validateCouponInput } from "../../../lib/validation";
import { jsonError, jsonResponse, parseBody } from "../../../lib/api";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await parseBody<Record<string, unknown>>(request);
    const db = getDb();

    const validation = validateCouponInput({
      ...body,
      is_active: 1, // Immediately public across CouponHub and visible in Admin Panel!
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
