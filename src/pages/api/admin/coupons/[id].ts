import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import {
  deleteCoupon,
  getCouponById,
  setCouponActiveStatus,
  updateCoupon,
} from "../../../../lib/db";
import { validateCouponInput } from "../../../../lib/validation";

export const GET: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid coupon ID." }, { status: 400 });
  }

  const coupon = await getCouponById(getDb(), id);
  if (!coupon) {
    return Response.json({ error: "Coupon not found." }, { status: 404 });
  }
  return Response.json({ coupon });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid coupon ID." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCouponInput(body);

    if (!validation.ok || !validation.data) {
      return Response.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const updated = await updateCoupon(getDb(), id, validation.data);
    if (!updated) {
      return Response.json({ error: "Coupon not found." }, { status: 404 });
    }

    return Response.json({ ok: true, id });
  } catch (error) {
    console.error("PUT /api/admin/coupons/[id] error:", error);
    return Response.json({ error: "Failed to update coupon." }, { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid coupon ID." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { is_active?: boolean | number };
    const isActive = body.is_active === true || body.is_active === 1 ? 1 : 0;

    const updated = await setCouponActiveStatus(getDb(), id, isActive);
    if (!updated) {
      return Response.json({ error: "Coupon not found." }, { status: 404 });
    }

    return Response.json({ ok: true, id, is_active: isActive });
  } catch (error) {
    console.error("PATCH /api/admin/coupons/[id] error:", error);
    return Response.json({ error: "Failed to update status." }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid coupon ID." }, { status: 400 });
  }

  try {
    const deleted = await deleteCoupon(getDb(), id);
    if (!deleted) {
      return Response.json({ error: "Coupon not found." }, { status: 404 });
    }
    return Response.json({ ok: true, id });
  } catch (error) {
    console.error("DELETE /api/admin/coupons/[id] error:", error);
    return Response.json({ error: "Failed to delete coupon." }, { status: 500 });
  }
};
