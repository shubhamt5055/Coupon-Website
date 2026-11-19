import type {
  AdminStats,
  Category,
  CategoryInput,
  CouponInput,
  CouponQueryFilters,
  CouponWithRelations,
  Store,
  StoreInput,
} from "./types";
import {
  CACHE_KEYS,
  getCachedJson,
  invalidateCouponCache,
  setCachedJson,
} from "./cloudflare";
import { getTodayIsoDate } from "./format";

const COUPON_SELECT = `
  SELECT
    c.id,
    c.title,
    c.code,
    c.description,
    c.terms,
    c.discount_text,
    c.store_id,
    c.category_id,
    c.affiliate_or_store_url,
    c.expiry_date,
    c.is_active,
    c.click_count,
    c.worked_count,
    c.didnt_work_count,
    c.created_at,
    c.updated_at,
    s.name AS store_name,
    s.slug AS store_slug,
    s.logo_url AS store_logo_url,
    s.website_url AS store_website_url,
    cat.name AS category_name,
    cat.slug AS category_slug,
    cat.icon AS category_icon
  FROM coupons c
  INNER JOIN stores s ON s.id = c.store_id
  INNER JOIN categories cat ON cat.id = c.category_id
`;

export async function getCoupons(
  db: D1Database,
  filters: CouponQueryFilters = {}
): Promise<CouponWithRelations[]> {
  const today = getTodayIsoDate();
  const isDefaultPublicList =
    !filters.search &&
    !filters.categorySlug &&
    !filters.storeSlug &&
    !filters.categoryId &&
    !filters.storeId &&
    !filters.status &&
    !filters.includeExpired &&
    !filters.includeInactive &&
    (!filters.sort || filters.sort === "newest") &&
    !filters.limit;

  if (isDefaultPublicList) {
    const cached = await getCachedJson<CouponWithRelations[]>(CACHE_KEYS.HOME_ACTIVE);
    if (cached) return cached;
  }

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.status === "active") {
    conditions.push("c.is_active = 1 AND c.expiry_date >= ?");
    params.push(today);
  } else if (filters.status === "inactive") {
    conditions.push("c.is_active = 0");
  } else if (filters.status === "expired") {
    conditions.push("c.expiry_date < ?");
    params.push(today);
  } else {
    if (!filters.includeInactive) {
      conditions.push("c.is_active = 1");
    }
    if (!filters.includeExpired) {
      conditions.push("c.expiry_date >= ?");
      params.push(today);
    }
  }

  if (filters.categorySlug) {
    conditions.push("cat.slug = ?");
    params.push(filters.categorySlug.trim().toLowerCase());
  }

  if (filters.storeSlug) {
    conditions.push("s.slug = ?");
    params.push(filters.storeSlug.trim().toLowerCase());
  }

  if (filters.categoryId) {
    conditions.push("c.category_id = ?");
    params.push(filters.categoryId);
  }

  if (filters.storeId) {
    conditions.push("c.store_id = ?");
    params.push(filters.storeId);
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim().toLowerCase()}%`;
    conditions.push(
      "(LOWER(c.title) LIKE ? OR LOWER(c.code) LIKE ? OR LOWER(c.description) LIKE ? OR LOWER(s.name) LIKE ? OR LOWER(cat.name) LIKE ?)"
    );
    params.push(term, term, term, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy = "ORDER BY (c.expiry_date < ?) ASC, c.created_at DESC, c.id DESC";
  const orderParams: unknown[] = [today];

  if (filters.sort === "popular") {
    orderBy = "ORDER BY (c.expiry_date < ?) ASC, c.click_count DESC, c.id DESC";
  } else if (filters.sort === "expiring") {
    orderBy = "ORDER BY (c.expiry_date < ?) ASC, c.expiry_date ASC, c.id DESC";
  }

  const limitClause = filters.limit && filters.limit > 0 ? `LIMIT ${Math.min(filters.limit, 200)}` : "";

  const sql = `${COUPON_SELECT} ${whereClause} ${orderBy} ${limitClause}`;
  const { results } = await db
    .prepare(sql)
    .bind(...params, ...orderParams)
    .all<CouponWithRelations>();

  if (isDefaultPublicList) {
    await setCachedJson(CACHE_KEYS.HOME_ACTIVE, results, 60);
  }

  return results;
}

export async function getTopCouponsToday(
  db: D1Database,
  limit = 4
): Promise<CouponWithRelations[]> {
  const cached = await getCachedJson<CouponWithRelations[]>(CACHE_KEYS.TOP_COUPONS);
  if (cached) return cached.slice(0, limit);

  const today = getTodayIsoDate();
  const { results } = await db
    .prepare(
      `${COUPON_SELECT}
       WHERE c.is_active = 1 AND c.expiry_date >= ?
       ORDER BY c.click_count DESC, c.worked_count DESC
       LIMIT ?`
    )
    .bind(today, Math.min(limit, 12))
    .all<CouponWithRelations>();

  await setCachedJson(CACHE_KEYS.TOP_COUPONS, results, 60);
  return results;
}

export async function getCouponById(
  db: D1Database,
  id: number
): Promise<CouponWithRelations | null> {
  const row = await db
    .prepare(`${COUPON_SELECT} WHERE c.id = ? LIMIT 1`)
    .bind(id)
    .first<CouponWithRelations>();
  return row ?? null;
}

export async function getRelatedCoupons(
  db: D1Database,
  couponId: number,
  categoryId: number,
  storeId: number,
  limit = 3
): Promise<CouponWithRelations[]> {
  const today = getTodayIsoDate();
  const { results } = await db
    .prepare(
      `${COUPON_SELECT}
       WHERE c.id != ? AND c.is_active = 1 AND c.expiry_date >= ?
         AND (c.store_id = ? OR c.category_id = ?)
       ORDER BY (c.store_id = ?) DESC, c.click_count DESC
       LIMIT ?`
    )
    .bind(couponId, today, storeId, categoryId, storeId, limit)
    .all<CouponWithRelations>();
  return results;
}

export async function createCoupon(db: D1Database, input: CouponInput): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO coupons (
        title, code, description, terms, discount_text,
        store_id, category_id, affiliate_or_store_url, expiry_date, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.title,
      input.code,
      input.description,
      input.terms,
      input.discount_text,
      input.store_id,
      input.category_id,
      input.affiliate_or_store_url,
      input.expiry_date,
      input.is_active
    )
    .run();

  await invalidateCouponCache();
  return Number(result.meta.last_row_id);
}

export async function updateCoupon(
  db: D1Database,
  id: number,
  input: CouponInput
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE coupons
       SET title = ?, code = ?, description = ?, terms = ?, discount_text = ?,
           store_id = ?, category_id = ?, affiliate_or_store_url = ?, expiry_date = ?,
           is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(
      input.title,
      input.code,
      input.description,
      input.terms,
      input.discount_text,
      input.store_id,
      input.category_id,
      input.affiliate_or_store_url,
      input.expiry_date,
      input.is_active,
      id
    )
    .run();

  await invalidateCouponCache();
  return (result.meta.changes ?? 0) > 0;
}

export async function setCouponActiveStatus(
  db: D1Database,
  id: number,
  isActive: number
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE coupons SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    )
    .bind(isActive ? 1 : 0, id)
    .run();
  await invalidateCouponCache();
  return (result.meta.changes ?? 0) > 0;
}

export async function deleteCoupon(db: D1Database, id: number): Promise<boolean> {
  const result = await db.prepare(`DELETE FROM coupons WHERE id = ?`).bind(id).run();
  await invalidateCouponCache();
  return (result.meta.changes ?? 0) > 0;
}

export async function incrementCouponClick(
  db: D1Database,
  id: number
): Promise<{ click_count: number } | null> {
  await db
    .prepare(`UPDATE coupons SET click_count = click_count + 1 WHERE id = ?`)
    .bind(id)
    .run();
  await invalidateCouponCache();
  const row = await db
    .prepare(`SELECT click_count FROM coupons WHERE id = ?`)
    .bind(id)
    .first<{ click_count: number }>();
  return row ?? null;
}

export async function recordCouponVote(
  db: D1Database,
  id: number,
  vote: "worked" | "didnt_work"
): Promise<{ worked_count: number; didnt_work_count: number } | null> {
  const column = vote === "worked" ? "worked_count" : "didnt_work_count";
  await db
    .prepare(`UPDATE coupons SET ${column} = ${column} + 1 WHERE id = ?`)
    .bind(id)
    .run();
  const row = await db
    .prepare(`SELECT worked_count, didnt_work_count FROM coupons WHERE id = ?`)
    .bind(id)
    .first<{ worked_count: number; didnt_work_count: number }>();
  return row ?? null;
}

export async function getCategoriesWithCounts(db: D1Database): Promise<Category[]> {
  const today = getTodayIsoDate();
  const { results } = await db
    .prepare(
      `SELECT
        cat.id,
        cat.name,
        cat.slug,
        cat.icon,
        cat.created_at,
        COUNT(CASE WHEN c.is_active = 1 AND c.expiry_date >= ? THEN 1 END) AS active_coupon_count,
        COUNT(c.id) AS total_coupon_count
      FROM categories cat
      LEFT JOIN coupons c ON c.category_id = cat.id
      GROUP BY cat.id
      ORDER BY active_coupon_count DESC, cat.name ASC`
    )
    .bind(today)
    .all<Category>();
  return results;
}

export async function getCategoryBySlug(db: D1Database, slug: string): Promise<Category | null> {
  const row = await db
    .prepare(`SELECT id, name, slug, icon, created_at FROM categories WHERE slug = ? LIMIT 1`)
    .bind(slug.trim().toLowerCase())
    .first<Category>();
  return row ?? null;
}

export async function createCategory(db: D1Database, input: CategoryInput): Promise<number> {
  const res = await db
    .prepare(`INSERT INTO categories (name, slug, icon) VALUES (?, ?, ?)`)
    .bind(input.name, input.slug, input.icon)
    .run();
  return Number(res.meta.last_row_id);
}

export async function deleteCategory(db: D1Database, id: number): Promise<boolean> {
  const res = await db.prepare(`DELETE FROM categories WHERE id = ?`).bind(id).run();
  await invalidateCouponCache();
  return (res.meta.changes ?? 0) > 0;
}

export async function getStoresWithCounts(db: D1Database): Promise<Store[]> {
  const today = getTodayIsoDate();
  const { results } = await db
    .prepare(
      `SELECT
        s.id,
        s.name,
        s.slug,
        s.logo_url,
        s.website_url,
        s.description,
        s.created_at,
        COUNT(CASE WHEN c.is_active = 1 AND c.expiry_date >= ? THEN 1 END) AS active_coupon_count,
        COUNT(c.id) AS total_coupon_count
      FROM stores s
      LEFT JOIN coupons c ON c.store_id = s.id
      GROUP BY s.id
      ORDER BY active_coupon_count DESC, s.name ASC`
    )
    .bind(today)
    .all<Store>();
  return results;
}

export async function getStoreBySlug(db: D1Database, slug: string): Promise<Store | null> {
  const row = await db
    .prepare(
      `SELECT id, name, slug, logo_url, website_url, description, created_at
       FROM stores WHERE slug = ? LIMIT 1`
    )
    .bind(slug.trim().toLowerCase())
    .first<Store>();
  return row ?? null;
}

export async function createStore(db: D1Database, input: StoreInput): Promise<number> {
  const res = await db
    .prepare(
      `INSERT INTO stores (name, slug, logo_url, website_url, description)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(input.name, input.slug, input.logo_url, input.website_url, input.description)
    .run();
  return Number(res.meta.last_row_id);
}

export async function updateStore(db: D1Database, id: number, input: StoreInput): Promise<boolean> {
  const res = await db
    .prepare(
      `UPDATE stores
       SET name = ?, slug = ?, logo_url = ?, website_url = ?, description = ?
       WHERE id = ?`
    )
    .bind(input.name, input.slug, input.logo_url, input.website_url, input.description, id)
    .run();
  await invalidateCouponCache();
  return (res.meta.changes ?? 0) > 0;
}

export async function deleteStore(db: D1Database, id: number): Promise<boolean> {
  const res = await db.prepare(`DELETE FROM stores WHERE id = ?`).bind(id).run();
  await invalidateCouponCache();
  return (res.meta.changes ?? 0) > 0;
}

export async function getAdminStats(db: D1Database): Promise<AdminStats> {
  const today = getTodayIsoDate();
  const [couponStats, storeCount, categoryCount] = await Promise.all([
    db
      .prepare(
        `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN is_active = 1 AND expiry_date >= ? THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN expiry_date < ? THEN 1 ELSE 0 END) AS expired,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive,
          COALESCE(SUM(click_count), 0) AS clicks
        FROM coupons`
      )
      .bind(today, today)
      .first<{
        total: number;
        active: number;
        expired: number;
        inactive: number;
        clicks: number;
      }>(),
    db.prepare(`SELECT COUNT(*) AS count FROM stores`).first<{ count: number }>(),
    db.prepare(`SELECT COUNT(*) AS count FROM categories`).first<{ count: number }>(),
  ]);

  return {
    totalCoupons: couponStats?.total ?? 0,
    activeCoupons: couponStats?.active ?? 0,
    expiredCoupons: couponStats?.expired ?? 0,
    inactiveCoupons: couponStats?.inactive ?? 0,
    totalClicks: couponStats?.clicks ?? 0,
    totalStores: storeCount?.count ?? 0,
    totalCategories: categoryCount?.count ?? 0,
  };
}
