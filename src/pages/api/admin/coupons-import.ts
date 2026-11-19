import type { APIRoute } from "astro";
import { getDb } from "../../../lib/cloudflare";
import {
  createCoupon,
  getCategoriesWithCounts,
  getStoresWithCounts,
} from "../../../lib/db";
import { parseCsv, validateCouponInput } from "../../../lib/validation";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as { csv?: string };
    const csvText = String(body.csv ?? "");

    if (!csvText.trim()) {
      return Response.json({ error: "CSV content is empty." }, { status: 400 });
    }

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      return Response.json(
        { error: "No data rows found in CSV. Ensure a header row and at least one data row." },
        { status: 400 }
      );
    }

    if (rows.length > 200) {
      return Response.json(
        { error: "Maximum 200 coupons allowed per CSV upload." },
        { status: 400 }
      );
    }

    const db = getDb();
    const [stores, categories] = await Promise.all([
      getStoresWithCounts(db),
      getCategoriesWithCounts(db),
    ]);

    const storeLookup = new Map<string, number>();
    stores.forEach((s) => {
      storeLookup.set(s.slug.toLowerCase(), s.id);
      storeLookup.set(s.name.toLowerCase(), s.id);
      storeLookup.set(String(s.id), s.id);
    });

    const categoryLookup = new Map<string, number>();
    categories.forEach((c) => {
      categoryLookup.set(c.slug.toLowerCase(), c.id);
      categoryLookup.set(c.name.toLowerCase(), c.id);
      categoryLookup.set(String(c.id), c.id);
    });

    let imported = 0;
    const rowErrors: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      const rowNum = i + 2; // 1-indexed + header row

      const storeKey = (r.store || r.store_slug || r.store_name || r.store_id || "").toLowerCase();
      const categoryKey = (
        r.category ||
        r.category_slug ||
        r.category_name ||
        r.category_id ||
        ""
      ).toLowerCase();

      const storeId = storeLookup.get(storeKey);
      const categoryId = categoryLookup.get(categoryKey);

      if (!storeId) {
        rowErrors.push({
          row: rowNum,
          reason: `Unknown store "${r.store || r.store_slug || r.store_name || ""}". Add store first.`,
        });
        continue;
      }

      if (!categoryId) {
        rowErrors.push({
          row: rowNum,
          reason: `Unknown category "${r.category || r.category_slug || r.category_name || ""}". Add category first.`,
        });
        continue;
      }

      const validation = validateCouponInput({
        title: r.title,
        code: r.code || r.coupon_code,
        description: r.description || "",
        terms: r.terms || "",
        discount_text: r.discount_text || r.discount,
        store_id: storeId,
        category_id: categoryId,
        affiliate_or_store_url: r.affiliate_or_store_url || r.url || r.link,
        expiry_date: r.expiry_date,
        is_active: r.is_active === undefined || r.is_active === "" ? 1 : r.is_active,
      });

      if (!validation.ok || !validation.data) {
        rowErrors.push({ row: rowNum, reason: validation.errors.join(" ") });
        continue;
      }

      await createCoupon(db, validation.data);
      imported += 1;
    }

    return Response.json({
      ok: true,
      totalRows: rows.length,
      imported,
      failed: rowErrors.length,
      rowErrors,
    });
  } catch (error) {
    console.error("POST /api/admin/coupons-import error:", error);
    return Response.json({ error: "Failed to import CSV." }, { status: 500 });
  }
};
