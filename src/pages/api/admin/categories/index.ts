import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { createCategory, getCategoriesWithCounts } from "../../../../lib/db";
import { validateCategoryInput } from "../../../../lib/validation";

export const GET: APIRoute = async () => {
  try {
    const categories = await getCategoriesWithCounts(getDb());
    return Response.json({ categories });
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);
    return Response.json({ error: "Failed to load categories." }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCategoryInput(body);

    if (!validation.ok || !validation.data) {
      return Response.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const id = await createCategory(getDb(), validation.data);
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("UNIQUE")) {
      return Response.json(
        { error: "A category with this name or slug already exists." },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/categories error:", error);
    return Response.json({ error: "Failed to create category." }, { status: 500 });
  }
};
