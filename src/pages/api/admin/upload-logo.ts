import type { APIRoute } from "astro";
import { getR2Bucket } from "../../../lib/cloudflare";
import { jsonError, jsonResponse } from "../../../lib/api";

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const MAX_R2_BYTES = 1024 * 1024; // 1MB for R2
const MAX_FALLBACK_BYTES = 150 * 1024; // 150KB for inline data URL fallback

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("No image file provided.", 400);
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return jsonError("Only PNG, JPG, WebP, or SVG logos are allowed.", 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const bucket = getR2Bucket();

    if (bucket) {
      if (bytes.byteLength > MAX_R2_BYTES) {
        return jsonError("Logo must be smaller than 1 MB.", 400);
      }
      const key = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      await bucket.put(`logos/${key}`, bytes, {
        httpMetadata: { contentType: file.type },
      });
      return jsonResponse({
        ok: true,
        storage: "r2",
        url: `/api/logos/${key}`,
      });
    }

    // Graceful fallback when R2 bucket is not bound yet
    if (bytes.byteLength > MAX_FALLBACK_BYTES) {
      return jsonError(
        "Cloudflare R2 is not bound yet. Please upload a smaller image (<150 KB) or paste a logo URL.",
        400
      );
    }

    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const dataUrl = `data:${file.type};base64,${btoa(binary)}`;

    return jsonResponse({
      ok: true,
      storage: "inline",
      url: dataUrl,
    });
  } catch (error) {
    console.error("POST /api/admin/upload-logo error:", error);
    return jsonError("Failed to upload logo image.", 500);
  }
};
