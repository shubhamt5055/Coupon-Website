import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { deleteCoupon, getCouponById } from "../../../../lib/db";

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return Response.json(
      { error: "Unauthorized. Please sign in to manage your coupons." },
      { status: 401 }
    );
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid coupon ID." }, { status: 400 });
  }

  try {
    const db = getDb();
    const coupon = await getCouponById(db, id);

    if (!coupon) {
      return Response.json({ error: "Coupon not found." }, { status: 404 });
    }

    // Security check: only the author or an admin can delete this coupon
    if (coupon.user_id !== user.id && user.role !== "admin") {
      return Response.json(
        { error: "Forbidden. You can only delete coupons that you have submitted." },
        { status: 403 }
      );
    }

    const deleted = await deleteCoupon(db, id);
    if (!deleted) {
      return Response.json({ error: "Failed to delete coupon." }, { status: 500 });
    }

    return Response.json({
      ok: true,
      id,
      message: "Coupon deleted successfully.",
    });
  } catch (error) {
    console.error(`DELETE /api/coupons/${id} error:`, error);
    return Response.json({ error: "Failed to delete coupon. Please try again." }, { status: 500 });
  }
};
