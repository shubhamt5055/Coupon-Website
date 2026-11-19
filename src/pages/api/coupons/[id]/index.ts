import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { getCouponById } from "../../../../lib/db";

export const GET: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid coupon ID." }, { status: 400 });
  }

  try {
    const coupon = await getCouponById(getDb(), id);
    if (!coupon || coupon.is_active !== 1) {
      return Response.json({ error: "Coupon not found." }, { status: 404 });
    }
    return Response.json({ coupon });
  } catch (error) {
    console.error("GET /api/coupons/[id] error:", error);
    return Response.json({ error: "Failed to load coupon." }, { status: 500 });
  }
};
