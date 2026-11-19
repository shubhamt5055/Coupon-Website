import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { incrementCouponClick } from "../../../../lib/db";

export const POST: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid coupon ID." }, { status: 400 });
  }

  try {
    const result = await incrementCouponClick(getDb(), id);
    if (!result) {
      return Response.json({ error: "Coupon not found." }, { status: 404 });
    }
    return Response.json({ ok: true, click_count: result.click_count });
  } catch (error) {
    console.error("POST /api/coupons/[id]/click error:", error);
    return Response.json({ error: "Failed to track click." }, { status: 500 });
  }
};
