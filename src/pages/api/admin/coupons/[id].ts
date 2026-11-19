import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import {
  deleteCoupon,
  getCouponById,
  setCouponActiveStatus,
  updateCoupon,
} from "../../../../lib/db";
import { validateCouponInput } from "../../../../lib/validation";
import { jsonError, jsonResponse, parseBody, parseId } from "../../../../lib/api";

export const GET: APIRoute = async ({ params }) => {
  const id = parseId(params.id);
  if (!id) return jsonError("Invalid coupon ID.", 400);

  const coupon = await getCouponById(getDb(), id);
  if (!coupon) return jsonError("Coupon not found.", 404);
  return jsonResponse({ coupon });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = parseId(params.id);
  if (!id) return jsonError("Invalid coupon ID.", 400);

  try {
    const body = await parseBody(request);
    const validation = validateCouponInput(body);

    if (!validation.ok || !validation.data) {
      return jsonError(validation.errors[0], 400, { errors: validation.errors });
    }

    const updated = await updateCoupon(getDb(), id, validation.data);
    if (!updated) return jsonError("Coupon not found.", 404);

    return jsonResponse({ ok: true, id });
  } catch (error) {
    console.error("PUT /api/admin/coupons/[id] error:", error);
    return jsonError("Failed to update coupon.", 500);
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = parseId(params.id);
  if (!id) return jsonError("Invalid coupon ID.", 400);

  try {
    const body = await parseBody<{ is_active?: boolean | number }>(request);
    const isActive = body.is_active === true || body.is_active === 1 ? 1 : 0;

    const updated = await setCouponActiveStatus(getDb(), id, isActive);
    if (!updated) return jsonError("Coupon not found.", 404);

    return jsonResponse({ ok: true, id, is_active: isActive });
  } catch (error) {
    console.error("PATCH /api/admin/coupons/[id] error:", error);
    return jsonError("Failed to update coupon status.", 500);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = parseId(params.id);
  if (!id) return jsonError("Invalid coupon ID.", 400);

  try {
    const deleted = await deleteCoupon(getDb(), id);
    if (!deleted) return jsonError("Coupon not found.", 404);

    return jsonResponse({ ok: true, id });
  } catch (error) {
    console.error("DELETE /api/admin/coupons/[id] error:", error);
    return jsonError("Failed to delete coupon.", 500);
  }
};
