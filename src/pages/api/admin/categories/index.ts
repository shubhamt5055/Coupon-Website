import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { createCategory, getCategoriesWithCounts } from "../../../../lib/db";
import { validateCategoryInput } from "../../../../lib/validation";
import { jsonError, jsonResponse, parseBody } from "../../../../lib/api";

export const GET: APIRoute = async () => {
  try {
    const categories = await getCategoriesWithCounts(getDb());
    return jsonResponse({ categories });
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);
    return jsonError("Failed to load categories.", 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await parseBody(request);
    const validation = validateCategoryInput(body);

    if (!validation.ok || !validation.data) {
      return jsonError(validation.errors[0], 400, { errors: validation.errors });
    }

    const id = await createCategory(getDb(), validation.data);
    return jsonResponse({ ok: true, id }, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("UNIQUE")) {
      return jsonError("A category with this name or slug already exists.", 409);
    }
    console.error("POST /api/admin/categories error:", error);
    return jsonError("Failed to create category.", 500);
  }
};
