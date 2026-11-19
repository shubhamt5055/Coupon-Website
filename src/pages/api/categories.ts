import type { APIRoute } from "astro";
import { getDb } from "../../lib/cloudflare";
import { getCategoriesWithCounts } from "../../lib/db";
import { jsonError, jsonResponse } from "../../lib/api";

export const GET: APIRoute = async () => {
  try {
    const categories = await getCategoriesWithCounts(getDb());
    return jsonResponse({ categories });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return jsonError("Failed to load categories.", 500);
  }
};
