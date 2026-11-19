-- Migration 0001: Initial relational schema for CouponHub
-- Tables: categories, stores, coupons

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '🏷️',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT DEFAULT '',
  website_url TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  terms TEXT NOT NULL DEFAULT '',
  discount_text TEXT NOT NULL,
  store_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  affiliate_or_store_url TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  click_count INTEGER NOT NULL DEFAULT 0,
  worked_count INTEGER NOT NULL DEFAULT 0,
  didnt_work_count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON coupons(store_id);
CREATE INDEX IF NOT EXISTS idx_coupons_category_id ON coupons(category_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active_expiry ON coupons(is_active, expiry_date);
CREATE INDEX IF NOT EXISTS idx_coupons_click_count ON coupons(click_count DESC);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
