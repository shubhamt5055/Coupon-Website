import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { createCoupon, getCoupons } from "../../../../lib/db";
import { validateCouponInput } from "../../../../lib/validation";
import { jsonError, jsonResponse, parseBody } from "../../../../lib/api";

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const search = url.searchParams.get("q") ?? undefined;
    const statusParam = url.searchParams.get("status");
    const status =
      statusParam === "active" ||
      statusParam === "inactive" ||
      statusParam === "expired"
        ? statusParam
        : "all";
    const categoryId = Number(url.searchParams.get("categoryId")) || undefined;
    const storeId = Number(url.searchParams.get("storeId")) || undefined;

    const coupons = await getCoupons(db, {
      search,
      status: status === "all" ? undefined : status,
      categoryId,
      storeId,
      includeExpired: true,
      includeInactive: true,
      sort: "newest",
    });

    return jsonResponse({ coupons });
  } catch (error) {
    console.error("GET /api/admin/coupons error:", error);
    return jsonError("Failed to fetch coupons.", 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await parseBody(request);
    const validation = validateCouponInput(body);

    if (!validation.ok || !validation.data) {
      return jsonError(validation.errors[0], 400, { errors: validation.errors });
    }

    const id = await createCoupon(getDb(), validation.data);
    return jsonResponse({ ok: true, id }, 201);
  } catch (error) {
    console.error("POST /api/admin/coupons error:", error);
    return jsonError("Failed to create coupon.", 500);
  }
};
