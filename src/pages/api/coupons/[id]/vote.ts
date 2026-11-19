import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/cloudflare";
import { recordCouponVote } from "../../../../lib/db";

export const POST: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid coupon ID." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { vote?: string };
    if (body.vote !== "worked" && body.vote !== "didnt_work") {
      return Response.json(
        { error: "Vote must be 'worked' or 'didnt_work'." },
        { status: 400 }
      );
    }

    const counts = await recordCouponVote(getDb(), id, body.vote);
    if (!counts) {
      return Response.json({ error: "Coupon not found." }, { status: 404 });
    }

    return Response.json({ ok: true, ...counts });
  } catch (error) {
    console.error("POST /api/coupons/[id]/vote error:", error);
    return Response.json({ error: "Failed to record vote." }, { status: 500 });
  }
};
