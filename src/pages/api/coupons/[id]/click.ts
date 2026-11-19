import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { incrementCouponClick } from "../../../../lib/db";
import { jsonError, jsonResponse, parseId } from "../../../../lib/api";

export const POST: APIRoute = async ({ params }) => {
  const id = parseId(params.id);
  if (!id) return jsonError("Invalid coupon ID.", 400);

  try {
    const result = await incrementCouponClick(getDb(), id);
    if (!result) return jsonError("Coupon not found.", 404);
    return jsonResponse({ ok: true, click_count: result.click_count });
  } catch (error) {
    console.error("POST /api/coupons/[id]/click error:", error);
    return jsonError("Failed to track click.", 500);
  }
};
