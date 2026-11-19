import type { APIRoute } from "astro";
import { getDb } from "../../lib/cloudflare";
import { getCategoriesWithCounts } from "../../lib/db";

export const GET: APIRoute = async () => {
  try {
    const categories = await getCategoriesWithCounts(getDb());
    return Response.json({ categories });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return Response.json({ error: "Failed to load categories." }, { status: 500 });
  }
};
