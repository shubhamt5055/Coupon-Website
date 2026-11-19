import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { recordCouponVote } from "../../../../lib/db";
import { jsonError, jsonResponse, parseBody, parseId } from "../../../../lib/api";

export const POST: APIRoute = async ({ params, request }) => {
  const id = parseId(params.id);
  if (!id) return jsonError("Invalid coupon ID.", 400);

  try {
    const body = await parseBody<{ vote?: string }>(request);
    if (body.vote !== "worked" && body.vote !== "didnt_work") {
      return jsonError("Vote must be 'worked' or 'didnt_work'.", 400);
    }

    const counts = await recordCouponVote(getDb(), id, body.vote);
    if (!counts) return jsonError("Coupon not found.", 404);

    return jsonResponse({ ok: true, ...counts });
  } catch (error) {
    console.error("POST /api/coupons/[id]/vote error:", error);
    return jsonError("Failed to record vote.", 500);
  }
};
