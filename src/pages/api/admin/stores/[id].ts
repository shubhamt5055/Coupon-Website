import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { deleteStore, updateStore } from "../../../../lib/db";
import { validateStoreInput } from "../../../../lib/validation";

export const PUT: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid store ID." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateStoreInput(body);
    if (!validation.ok || !validation.data) {
      return Response.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const ok = await updateStore(getDb(), id, validation.data);
    if (!ok) {
      return Response.json({ error: "Store not found." }, { status: 404 });
    }
    return Response.json({ ok: true, id });
  } catch (error) {
    console.error("PUT /api/admin/stores/[id] error:", error);
    return Response.json({ error: "Failed to update store." }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid store ID." }, { status: 400 });
  }

  try {
    const deleted = await deleteStore(getDb(), id);
    if (!deleted) {
      return Response.json({ error: "Store not found." }, { status: 404 });
    }
    return Response.json({ ok: true, id });
  } catch (error) {
    console.error("DELETE /api/admin/stores/[id] error:", error);
    return Response.json({ error: "Failed to delete store." }, { status: 500 });
  }
};
