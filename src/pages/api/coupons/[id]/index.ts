import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { deleteCoupon, getCouponById } from "../../../../lib/db";
import { jsonError, jsonResponse, parseId } from "../../../../lib/api";

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return jsonError("Unauthorized. Please sign in to manage your coupons.", 401);
  }

  const id = parseId(params.id);
  if (!id) {
    return jsonError("Invalid coupon ID.", 400);
  }

  try {
    const db = getDb();
    const coupon = await getCouponById(db, id);

    if (!coupon) {
      return jsonError("Coupon not found.", 404);
    }

    if (coupon.user_id !== user.id && user.role !== "admin") {
      return jsonError("Forbidden. You can only delete coupons that you have submitted.", 403);
    }

    const deleted = await deleteCoupon(db, id);
    if (!deleted) {
      return jsonError("Failed to delete coupon.", 500);
    }

    return jsonResponse({ ok: true, id, message: "Coupon deleted successfully." });
  } catch (error) {
    console.error(`DELETE /api/coupons/${id} error:`, error);
    return jsonError("Failed to delete coupon. Please try again.", 500);
  }
};
