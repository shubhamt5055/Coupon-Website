import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { deleteCategory } from "../../../../lib/db";
import { jsonError, jsonResponse, parseId } from "../../../../lib/api";

export const DELETE: APIRoute = async ({ params }) => {
  const id = parseId(params.id);
  if (!id) return jsonError("Invalid category ID.", 400);

  try {
    const deleted = await deleteCategory(getDb(), id);
    if (!deleted) return jsonError("Category not found.", 404);
    return jsonResponse({ ok: true, id });
  } catch (error) {
    console.error("DELETE /api/admin/categories/[id] error:", error);
    return jsonError("Failed to delete category.", 500);
  }
};
