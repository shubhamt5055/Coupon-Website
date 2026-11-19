import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { deleteCategory } from "../../../../lib/db";

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid category ID." }, { status: 400 });
  }

  try {
    const deleted = await deleteCategory(getDb(), id);
    if (!deleted) {
      return Response.json({ error: "Category not found." }, { status: 404 });
    }
    return Response.json({ ok: true, id });
  } catch (error) {
    console.error("DELETE /api/admin/categories/[id] error:", error);
    return Response.json({ error: "Failed to delete category." }, { status: 500 });
  }
};
