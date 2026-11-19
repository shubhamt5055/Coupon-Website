import type { APIRoute } from "astro";
import { getDb } from "../../../lib/cloudflare";
import { createCoupon } from "../../../lib/db";
import { getAuthenticatedUser } from "../../../lib/auth";
import { validateCouponInput } from "../../../lib/validation";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user ?? (await getAuthenticatedUser(request));

    if (!user) {
      return Response.json(
        { error: "You must be signed in to submit a coupon." },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    let body: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      body = (await request.json()) as Record<string, unknown>;
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }

    const validation = validateCouponInput({
      ...body,
      user_id: user.id,
      is_active: 0, // Inactive until verified and approved by admin
    });

    if (!validation.ok || !validation.data) {
      return Response.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const id = await createCoupon(getDb(), validation.data);
    return Response.json(
      { ok: true, id, status: "pending_verification" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/coupons/submit error:", error);
    return Response.json(
      { error: "Failed to submit coupon. Please check that store and category are valid." },
      { status: 500 }
    );
  }
};
