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

// Base SELECT query joining store and category
const COUPON_SELECT = `
  SELECT
    c.id, c.title, c.code, c.description, c.terms, c.discount_text,
    c.store_id, c.category_id, c.affiliate_or_store_url, c.expiry_date,
    c.is_active, c.click_count, c.worked_count, c.didnt_work_count,
    c.created_at, c.updated_at,
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

// Generic query helpers for D1
async function queryAll<T>(db: D1Database, sql: string, params: unknown[] = []): Promise<T[]> {
  const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  const { results } = await stmt.all<T>();
  return results ?? [];
}

async function queryFirst<T>(db: D1Database, sql: string, params: unknown[] = []): Promise<T | null> {
  const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  const row = await stmt.first<T>();
  return row ?? null;
}

async function runInsert(db: D1Database, sql: string, params: unknown[], invalidate = false): Promise<number> {
  const res = await db.prepare(sql).bind(...params).run();
  if (invalidate) await invalidateCouponCache();
  return Number(res.meta.last_row_id);
}

async function runUpdate(db: D1Database, sql: string, params: unknown[], invalidate = true): Promise<boolean> {
  const res = await db.prepare(sql).bind(...params).run();
  if (invalidate) await invalidateCouponCache();
  return (res.meta.changes ?? 0) > 0;
}

// ========================
// Coupon Queries
// ========================

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
    if (!filters.includeInactive) conditions.push("c.is_active = 1");
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

  const results = await queryAll<CouponWithRelations>(db, sql, [...params, ...orderParams]);

  if (isDefaultPublicList) {
    await setCachedJson(CACHE_KEYS.HOME_ACTIVE, results, 60);
  }

  return results;
}

export async function getTopCouponsToday(db: D1Database, limit = 4): Promise<CouponWithRelations[]> {
  const cached = await getCachedJson<CouponWithRelations[]>(CACHE_KEYS.TOP_COUPONS);
  if (cached) return cached.slice(0, limit);

  const today = getTodayIsoDate();
  const sql = `${COUPON_SELECT} WHERE c.is_active = 1 AND c.expiry_date >= ? ORDER BY c.click_count DESC, c.worked_count DESC LIMIT ?`;
  const results = await queryAll<CouponWithRelations>(db, sql, [today, Math.min(limit, 12)]);

  await setCachedJson(CACHE_KEYS.TOP_COUPONS, results, 60);
  return results;
}

export async function getCouponById(db: D1Database, id: number): Promise<CouponWithRelations | null> {
  return queryFirst<CouponWithRelations>(db, `${COUPON_SELECT} WHERE c.id = ? LIMIT 1`, [id]);
}

export async function getRelatedCoupons(
  db: D1Database,
  couponId: number,
  categoryId: number,
  storeId: number,
  limit = 3
): Promise<CouponWithRelations[]> {
  const today = getTodayIsoDate();
  const sql = `${COUPON_SELECT}
    WHERE c.id != ? AND c.is_active = 1 AND c.expiry_date >= ?
      AND (c.store_id = ? OR c.category_id = ?)
    ORDER BY (c.store_id = ?) DESC, c.click_count DESC
    LIMIT ?`;
  return queryAll<CouponWithRelations>(db, sql, [couponId, today, storeId, categoryId, storeId, limit]);
}

export async function createCoupon(db: D1Database, input: CouponInput): Promise<number> {
  const sql = `INSERT INTO coupons (
    title, code, description, terms, discount_text,
    store_id, category_id, affiliate_or_store_url, expiry_date, is_active
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  return runInsert(db, sql, [
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
  ], true);
}

export async function updateCoupon(db: D1Database, id: number, input: CouponInput): Promise<boolean> {
  const sql = `UPDATE coupons
    SET title = ?, code = ?, description = ?, terms = ?, discount_text = ?,
        store_id = ?, category_id = ?, affiliate_or_store_url = ?, expiry_date = ?,
        is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`;
  return runUpdate(db, sql, [
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
    id,
  ]);
}

export async function setCouponActiveStatus(db: D1Database, id: number, isActive: number): Promise<boolean> {
  return runUpdate(db, `UPDATE coupons SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [isActive ? 1 : 0, id]);
}

export async function deleteCoupon(db: D1Database, id: number): Promise<boolean> {
  return runUpdate(db, `DELETE FROM coupons WHERE id = ?`, [id]);
}

export async function incrementCouponClick(db: D1Database, id: number): Promise<{ click_count: number } | null> {
  await db.prepare(`UPDATE coupons SET click_count = click_count + 1 WHERE id = ?`).bind(id).run();
  await invalidateCouponCache();
  return queryFirst<{ click_count: number }>(db, `SELECT click_count FROM coupons WHERE id = ?`, [id]);
}

export async function recordCouponVote(
  db: D1Database,
  id: number,
  vote: "worked" | "didnt_work"
): Promise<{ worked_count: number; didnt_work_count: number } | null> {
  const column = vote === "worked" ? "worked_count" : "didnt_work_count";
  await db.prepare(`UPDATE coupons SET ${column} = ${column} + 1 WHERE id = ?`).bind(id).run();
  return queryFirst<{ worked_count: number; didnt_work_count: number }>(
    db,
    `SELECT worked_count, didnt_work_count FROM coupons WHERE id = ?`,
    [id]
  );
}

// ========================
// Category Queries
// ========================

export async function getCategoriesWithCounts(db: D1Database): Promise<Category[]> {
  const today = getTodayIsoDate();
  const sql = `SELECT
      cat.id, cat.name, cat.slug, cat.icon, cat.created_at,
      COUNT(CASE WHEN c.is_active = 1 AND c.expiry_date >= ? THEN 1 END) AS active_coupon_count,
      COUNT(c.id) AS total_coupon_count
    FROM categories cat
    LEFT JOIN coupons c ON c.category_id = cat.id
    GROUP BY cat.id
    ORDER BY active_coupon_count DESC, cat.name ASC`;
  return queryAll<Category>(db, sql, [today]);
}

export async function getCategoryBySlug(db: D1Database, slug: string): Promise<Category | null> {
  return queryFirst<Category>(db, `SELECT id, name, slug, icon, created_at FROM categories WHERE slug = ? LIMIT 1`, [
    slug.trim().toLowerCase(),
  ]);
}

export async function createCategory(db: D1Database, input: CategoryInput): Promise<number> {
  return runInsert(db, `INSERT INTO categories (name, slug, icon) VALUES (?, ?, ?)`, [
    input.name,
    input.slug,
    input.icon,
  ]);
}

export async function deleteCategory(db: D1Database, id: number): Promise<boolean> {
  return runUpdate(db, `DELETE FROM categories WHERE id = ?`, [id]);
}

// ========================
// Store Queries
// ========================

export async function getStoresWithCounts(db: D1Database): Promise<Store[]> {
  const today = getTodayIsoDate();
  const sql = `SELECT
      s.id, s.name, s.slug, s.logo_url, s.website_url, s.description, s.created_at,
      COUNT(CASE WHEN c.is_active = 1 AND c.expiry_date >= ? THEN 1 END) AS active_coupon_count,
      COUNT(c.id) AS total_coupon_count
    FROM stores s
    LEFT JOIN coupons c ON c.store_id = s.id
    GROUP BY s.id
    ORDER BY active_coupon_count DESC, s.name ASC`;
  return queryAll<Store>(db, sql, [today]);
}

export async function getStoreBySlug(db: D1Database, slug: string): Promise<Store | null> {
  return queryFirst<Store>(
    db,
    `SELECT id, name, slug, logo_url, website_url, description, created_at FROM stores WHERE slug = ? LIMIT 1`,
    [slug.trim().toLowerCase()]
  );
}

export async function createStore(db: D1Database, input: StoreInput): Promise<number> {
  return runInsert(
    db,
    `INSERT INTO stores (name, slug, logo_url, website_url, description) VALUES (?, ?, ?, ?, ?)`,
    [input.name, input.slug, input.logo_url, input.website_url, input.description]
  );
}

export async function updateStore(db: D1Database, id: number, input: StoreInput): Promise<boolean> {
  return runUpdate(
    db,
    `UPDATE stores SET name = ?, slug = ?, logo_url = ?, website_url = ?, description = ? WHERE id = ?`,
    [input.name, input.slug, input.logo_url, input.website_url, input.description, id]
  );
}

export async function deleteStore(db: D1Database, id: number): Promise<boolean> {
  return runUpdate(db, `DELETE FROM stores WHERE id = ?`, [id]);
}

// ========================
// Stats & Aggregations
// ========================

export async function getAdminStats(db: D1Database): Promise<AdminStats> {
  const today = getTodayIsoDate();
  const [couponStats, storeCount, categoryCount] = await Promise.all([
    queryFirst<{
      total: number;
      active: number;
      expired: number;
      inactive: number;
      clicks: number;
    }>(
      db,
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN is_active = 1 AND expiry_date >= ? THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN expiry_date < ? THEN 1 ELSE 0 END) AS expired,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive,
        COALESCE(SUM(click_count), 0) AS clicks
      FROM coupons`,
      [today, today]
    ),
    queryFirst<{ count: number }>(db, `SELECT COUNT(*) AS count FROM stores`),
    queryFirst<{ count: number }>(db, `SELECT COUNT(*) AS count FROM categories`),
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
