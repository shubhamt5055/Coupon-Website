import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { createCoupon, getCoupons } from "../../../../lib/db";
import { validateCouponInput } from "../../../../lib/validation";

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

    return Response.json({ coupons });
  } catch (error) {
    console.error("GET /api/admin/coupons error:", error);
    return Response.json({ error: "Failed to fetch coupons." }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCouponInput(body);

    if (!validation.ok || !validation.data) {
      return Response.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const id = await createCoupon(getDb(), validation.data);
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/coupons error:", error);
    return Response.json(
      { error: "Failed to create coupon. Verify selected store and category exist." },
      { status: 500 }
    );
  }
};
