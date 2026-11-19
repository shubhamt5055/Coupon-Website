import type { APIRoute } from "astro";
import { getDb } from "../../../lib/cloudflare";
import { getCoupons, getTopCouponsToday } from "../../../lib/db";
import { jsonError, jsonResponse } from "../../../lib/api";

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = getDb();
    const top = url.searchParams.get("top");

    if (top === "1" || top === "true") {
      const limit = Number(url.searchParams.get("limit")) || 4;
      const coupons = await getTopCouponsToday(db, limit);
      return jsonResponse({ coupons });
    }

    const search = url.searchParams.get("q") ?? undefined;
    const categorySlug = url.searchParams.get("category") ?? undefined;
    const storeSlug = url.searchParams.get("store") ?? undefined;
    const includeExpired = url.searchParams.get("includeExpired") === "1";
    const sortParam = url.searchParams.get("sort");
    const sort =
      sortParam === "popular" || sortParam === "expiring" ? sortParam : "newest";

    const coupons = await getCoupons(db, {
      search,
      categorySlug,
      storeSlug,
      includeExpired,
      includeInactive: false,
      sort,
    });

    return jsonResponse({ coupons });
  } catch (error) {
    console.error("GET /api/coupons error:", error);
    return jsonError("Failed to load coupons.", 500);
  }
};
