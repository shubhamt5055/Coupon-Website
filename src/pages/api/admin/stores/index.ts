import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { createStore, getStoresWithCounts } from "../../../../lib/db";
import { validateStoreInput } from "../../../../lib/validation";
import { jsonError, jsonResponse, parseBody } from "../../../../lib/api";

export const GET: APIRoute = async () => {
  try {
    const stores = await getStoresWithCounts(getDb());
    return jsonResponse({ stores });
  } catch (error) {
    console.error("GET /api/admin/stores error:", error);
    return jsonError("Failed to load stores.", 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await parseBody(request);
    const validation = validateStoreInput(body);

    if (!validation.ok || !validation.data) {
      return jsonError(validation.errors[0], 400, { errors: validation.errors });
    }

    const id = await createStore(getDb(), validation.data);
    return jsonResponse({ ok: true, id }, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("UNIQUE")) {
      return jsonError("A store with this name or slug already exists.", 409);
    }
    console.error("POST /api/admin/stores error:", error);
    return jsonError("Failed to create store.", 500);
  }
};
