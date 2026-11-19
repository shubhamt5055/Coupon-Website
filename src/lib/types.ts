export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  created_at: string;
  active_coupon_count?: number;
  total_coupon_count?: number;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
  website_url: string;
  description: string;
  created_at: string;
  active_coupon_count?: number;
  total_coupon_count?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  role: "user" | "admin";
  created_at: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface Coupon {
  id: number;
  title: string;
  code: string;
  description: string;
  terms: string;
  discount_text: string;
  store_id: number;
  category_id: number;
  affiliate_or_store_url: string;
  expiry_date: string;
  is_active: number;
  click_count: number;
  worked_count: number;
  didnt_work_count: number;
  created_at: string;
  updated_at: string;
  user_id?: number | null;
}

export interface CouponWithRelations extends Coupon {
  store_name: string;
  store_slug: string;
  store_logo_url: string;
  store_website_url: string;
  category_name: string;
  category_slug: string;
  category_icon: string;
  submitted_by_name?: string | null;
  submitted_by_email?: string | null;
}

export interface CouponQueryFilters {
  search?: string;
  categorySlug?: string;
  storeSlug?: string;
  categoryId?: number;
  storeId?: number;
  userId?: number;
  status?: "all" | "active" | "inactive" | "expired" | "pending";
  includeExpired?: boolean;
  includeInactive?: boolean;
  sort?: "newest" | "popular" | "expiring";
  limit?: number;
}

export interface CouponInput {
  title: string;
  code: string;
  description: string;
  terms: string;
  discount_text: string;
  store_id: number;
  category_id: number;
  affiliate_or_store_url: string;
  expiry_date: string;
  is_active: number;
  user_id?: number | null;
}

export interface StoreInput {
  name: string;
  slug: string;
  logo_url: string;
  website_url: string;
  description: string;
}

export interface CategoryInput {
  name: string;
  slug: string;
  icon: string;
}

export interface AdminStats {
  totalCoupons: number;
  activeCoupons: number;
  pendingCoupons: number;
  expiredCoupons: number;
  inactiveCoupons: number;
  totalClicks: number;
  totalStores: number;
  totalCategories: number;
}

export interface AppBindings {
  coupon_db: D1Database;
  COUPON_CACHE?: KVNamespace;
  STORE_LOGOS?: R2Bucket;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
}
