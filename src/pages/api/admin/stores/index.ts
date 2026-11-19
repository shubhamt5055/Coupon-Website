import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { createStore, getStoresWithCounts } from "../../../../lib/db";
import { validateStoreInput } from "../../../../lib/validation";

export const GET: APIRoute = async () => {
  try {
    const stores = await getStoresWithCounts(getDb());
    return Response.json({ stores });
  } catch (error) {
    console.error("GET /api/admin/stores error:", error);
    return Response.json({ error: "Failed to load stores." }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateStoreInput(body);

    if (!validation.ok || !validation.data) {
      return Response.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const id = await createStore(getDb(), validation.data);
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("UNIQUE")) {
      return Response.json(
        { error: "A store with this name or slug already exists." },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/stores error:", error);
    return Response.json({ error: "Failed to create store." }, { status: 500 });
  }
};
