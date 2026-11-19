import type { APIRoute } from "astro";
import { getDb } from "../../lib/cloudflare";
import { getStoresWithCounts } from "../../lib/db";
import { jsonError, jsonResponse } from "../../lib/api";

export const GET: APIRoute = async () => {
  try {
    const stores = await getStoresWithCounts(getDb());
    return jsonResponse({ stores });
  } catch (error) {
    console.error("GET /api/stores error:", error);
    return jsonError("Failed to load stores.", 500);
  }
};
