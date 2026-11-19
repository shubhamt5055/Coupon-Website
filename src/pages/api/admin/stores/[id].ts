import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { deleteStore, updateStore } from "../../../../lib/db";
import { validateStoreInput } from "../../../../lib/validation";
import { jsonError, jsonResponse, parseBody, parseId } from "../../../../lib/api";

export const PUT: APIRoute = async ({ params, request }) => {
  const id = parseId(params.id);
  if (!id) return jsonError("Invalid store ID.", 400);

  try {
    const body = await parseBody(request);
    const validation = validateStoreInput(body);
    if (!validation.ok || !validation.data) {
      return jsonError(validation.errors[0], 400, { errors: validation.errors });
    }

    const ok = await updateStore(getDb(), id, validation.data);
    if (!ok) return jsonError("Store not found.", 404);

    return jsonResponse({ ok: true, id });
  } catch (error) {
    console.error("PUT /api/admin/stores/[id] error:", error);
    return jsonError("Failed to update store.", 500);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = parseId(params.id);
  if (!id) return jsonError("Invalid store ID.", 400);

  try {
    const deleted = await deleteStore(getDb(), id);
    if (!deleted) return jsonError("Store not found.", 404);
    return jsonResponse({ ok: true, id });
  } catch (error) {
    console.error("DELETE /api/admin/stores/[id] error:", error);
    return jsonError("Failed to delete store.", 500);
  }
};
