import type { APIRoute } from "astro";
import { getDb } from "../../lib/cloudflare";
import { getStoresWithCounts } from "../../lib/db";

export const GET: APIRoute = async () => {
  try {
    const stores = await getStoresWithCounts(getDb());
    return Response.json({ stores });
  } catch (error) {
    console.error("GET /api/stores error:", error);
    return Response.json({ error: "Failed to load stores." }, { status: 500 });
  }
};
