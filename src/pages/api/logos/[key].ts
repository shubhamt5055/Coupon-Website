import type { APIRoute } from "astro";
import { getR2Bucket } from "../../../lib/cloudflare";

/**
 * Serves uploaded store logos from Cloudflare R2 when STORE_LOGOS binding is configured.
 */
export const GET: APIRoute = async ({ params }) => {
  const key = params.key;
  if (!key || !/^[a-zA-Z0-9._-]+$/.test(key)) {
    return new Response("Invalid logo key", { status: 400 });
  }

  const bucket = getR2Bucket();
  if (!bucket) {
    return new Response("R2 storage is not configured", { status: 404 });
  }

  const object = await bucket.get(`logos/${key}`);
  if (!object) {
    return new Response("Logo not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (!headers.get("Content-Type")) {
    headers.set("Content-Type", "image/png");
  }

  return new Response(object.body, { headers });
};
