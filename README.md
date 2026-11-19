# CouponHub — Discount Coupon & Deals Platform

A fast, mobile-first, SEO-friendly **Coupon Website** built with **Astro (SSR)**, **Tailwind CSS v4**, **TypeScript**, and **Cloudflare D1**, designed for deployment on **Cloudflare Workers / Pages**.

Visitors can browse, search, filter, reveal/copy coupon codes, and vote on coupon accuracy. Authorized admins can log in securely and add, edit, activate/deactivate, delete, or bulk-import coupons via CSV — with changes reflected live immediately without redeploying.

---

## Features Implemented

### Public Side (Visitors)
- **Home Page (`/`)**: Displays active deals, **Top Coupons Today** (ranked by click count), category shortcuts, and popular stores.
- **Browse & Search (`/coupons`)**: Search by store name, title, description, or coupon code; filter by category/store; sort by newest, most popular, or expiring soon; toggle expired coupons.
- **Categories (`/categories`, `/categories/[slug]`)** & **Stores (`/stores`, `/stores/[slug]`)**: Dedicated SEO-friendly pages per category and store.
- **Coupon Details (`/coupons/[id]`)**: Full title, store info, discount badge, code, expiry date, terms & conditions, related deals, and community voting.
- **Reveal & Copy Flow**: Clicking **Reveal & Copy** reveals the code, copies it to clipboard, increments `click_count` in D1, opens the store/affiliate link in a new tab, and displays a quick feedback modal.
- **Automatic Expiry Handling**: Expired coupons (`expiry_date < today`) are automatically hidden from active feeds and clearly marked with an **EXPIRED** badge when viewed in archive/detail pages.

### Admin Panel (Authorized Team)
- **Server-Side Protected Routes (`src/middleware.ts`)**: All `/admin/*` pages and `/api/admin/*` routes verify a signed `HttpOnly` HMAC-SHA256 session cookie on the server (never UI-only).
- **Coupon CRUD (`/admin`, `/admin/coupons/new`, `/admin/coupons/[id]/edit`)**: Create, edit, delete, search, filter by status/store/category, and toggle **Active / Inactive** live.
- **Store & Category Management (`/admin/stores`, `/admin/categories`)**: Add and delete stores and categories without touching code.
- **Live Updates**: Every change writes directly to Cloudflare D1 and invalidates optional KV cache immediately — no redeploy required.

### Bonus Features Included
- **Top Coupons Today**: Ranked live by `click_count`.
- **Coupon Worked / Didn't Work Voting**: Visitors can vote on coupon validity with live success-rate indicators.
- **Dark Mode**: System-aware light/dark toggle persisted in `localStorage` with zero flash on page load.
- **Bulk CSV Upload (`/admin/import`)**: Upload or paste CSV rows with server-side validation, downloadable sample CSV, and per-row import report.
- **Cloudflare R2 Logo Upload (`/api/admin/upload-logo`, `/api/logos/[key]`)**: Automatically stores uploaded store logos in Cloudflare R2 when the `STORE_LOGOS` binding is configured (with an automatic lightweight fallback when R2 is not bound yet).
- **Optional Cloudflare KV Caching**: Automatically caches popular and homepage lists when `COUPON_CACHE` is bound and invalidates cache on admin updates.

---

## Tech Stack

| Purpose | Technology |
|---|---|
| Framework | Astro (SSR via `@astrojs/cloudflare`) |
| Hosting | Cloudflare Workers / Pages |
| Backend API | Astro Server API Routes (`src/pages/api/*`) |
| Database | Cloudflare D1 (SQLite) |
| Caching (Optional) | Cloudflare KV (`COUPON_CACHE`) |
| Logo Storage (Optional) | Cloudflare R2 (`STORE_LOGOS`) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript (strict) |
| CLI | Wrangler |

---

## Database Schema & Improvements

Defined in [`db/migrations/0001_initial_schema.sql`](./db/migrations/0001_initial_schema.sql):

1. **`categories`**: `id, name, slug, icon, created_at`
2. **`stores`**: `id, name, slug, logo_url, website_url, description, created_at`
3. **`coupons`**: `id, title, code, description, terms, discount_text, store_id, category_id, affiliate_or_store_url, expiry_date, is_active, click_count, worked_count, didnt_work_count, created_at, updated_at`

### Changes Made Beyond Suggested Schema
- Added `terms` to `coupons` so visitors can read full Terms & Conditions on `/coupons/[id]`.
- Added `worked_count` and `didnt_work_count` to `coupons` to power the bonus "Coupon worked / didn't work" voting feature.
- Added `icon` to `categories` and `description` to `stores` for richer category/store cards.
- Added indexes on `store_id`, `category_id`, `(is_active, expiry_date)`, `click_count DESC`, and slugs for fast filtering and sorting.
- Enforced `FOREIGN KEY ... ON DELETE CASCADE` and `CHECK (is_active IN (0, 1))` for data integrity.

---

## Folder Structure

```text
coupon-website/
├── db/
│   ├── migrations/0001_initial_schema.sql
│   ├── seed.sql
│   └── reset.sql
├── public/
├── src/
│   ├── components/    # Navbar, Footer, CouponCard, CategoryCard, StoreCard, SearchBar, AdminCouponForm
│   ├── layouts/       # MainLayout, AdminLayout
│   ├── lib/           # types, cloudflare, db, auth, validation, format
│   ├── pages/         # Public routes, Admin routes, API routes
│   ├── styles/        # global.css (Tailwind v4 + dark mode)
│   └── middleware.ts  # Server-side admin route protection
├── .dev.vars.example
├── astro.config.mjs
└── wrangler.jsonc
```

---

## Environment Variables & Secrets

Never commit secrets to GitHub. Copy `.dev.vars.example` to `.dev.vars` (gitignored) for local development:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password
SESSION_SECRET=a-long-random-secret-key-at-least-32-chars
```

For production on Cloudflare, set them securely using Wrangler:

```bash
npx wrangler secret put ADMIN_USERNAME
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
```

---

## Local Setup & Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create `.dev.vars`**
   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars with your local admin credentials and session secret
   ```

3. **Run D1 Migrations & Seed Data (Local)**
   ```bash
   npm run db:migrate:local
   npm run db:seed:local
   ```
   *(If upgrading from an older test schema on local D1, run `npx wrangler d1 execute coupon-db --local --file=./db/reset.sql` first.)*

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   - Public site: `http://localhost:4321`
   - Admin panel: `http://localhost:4321/admin`

---

## Deployment to Cloudflare

1. **Login to Cloudflare via Wrangler**
   ```bash
   npx wrangler login
   ```

2. **Apply D1 Migrations & Optional Seed to Remote Database**
   ```bash
   npm run db:migrate:remote
   npm run db:seed:remote
   ```
   *(If your remote D1 database has an older test table, run `npx wrangler d1 execute coupon-db --remote --file=./db/reset.sql` before migrating.)*

3. **Set Production Secrets**
   ```bash
   npx wrangler secret put ADMIN_USERNAME
   npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put SESSION_SECRET
   ```

4. **Build & Deploy**
   ```bash
   npm run deploy
   ```

### Enabling Optional KV Cache & R2 Logo Storage
1. Create a KV namespace: `npx wrangler kv namespace create COUPON_CACHE` and uncomment the `kv_namespaces` block in `wrangler.jsonc`.
2. Create an R2 bucket: `npx wrangler r2 bucket create coupon-store-logos` and uncomment the `r2_buckets` block in `wrangler.jsonc`.
3. Redeploy with `npm run deploy`.

---

## Known Limitations & Future Improvements
- **Rate Limiting**: Public `/click` and `/vote` endpoints use browser `localStorage` for repeat-vote checks; adding Cloudflare Rate Limiting / Turnstile or IP hashing in KV can further harden against automated spam.
- **Multi-Admin Accounts & Roles**: Currently supports a single team admin login via environment secrets; can be extended with a `users` table + PBKDF2 password hashing or Cloudflare Access Zero Trust.
- **Sitemap & Dynamic OG Images**: Adding `@astrojs/sitemap` and auto-generated store OG cards can boost organic SEO further.
- **Scheduled Click Analytics**: Tracking daily click buckets (`coupon_daily_clicks`) would make "Top Coupons Today" strictly rolling 24-hour clicks rather than cumulative clicks.
