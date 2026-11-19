# CouponHub — Discount Coupon & Deals Platform

A fast, mobile-first, SEO-friendly **Coupon Website** built with **Astro (SSR)**, **Tailwind CSS v4**, **TypeScript**, and **Cloudflare D1**, designed for deployment on **Cloudflare Workers / Pages**.

Visitors can browse, search, filter, reveal/copy coupon codes, vote on coupon accuracy, and **sign up to upload their own working discount coupons**. Authorized admins can log in securely and add, edit, activate/deactivate, delete, or bulk-import coupons via CSV — with changes reflected live immediately without redeploying.

---

## Features Implemented

### Public Side (Visitors & Community)
- **Home Page (`/`)**: Displays active deals, **Top Coupons Today** (ranked by click count), category shortcuts, popular stores, and community submission callout.
- **Browse & Search (`/coupons`)**: Search by store name, title, description, or coupon code; filter by category/store; sort by newest, most popular, or expiring soon; toggle expired coupons.
- **Categories (`/categories`, `/categories/[slug]`)** & **Stores (`/stores`, `/stores/[slug]`)**: Dedicated SEO-friendly pages per category and store.
- **Coupon Details (`/coupons/[id]`)**: Full title, store info, discount badge, code, expiry date, terms & conditions, related deals, and community voting.
- **Reveal & Copy Flow**: Clicking **Reveal & Copy** reveals the code, copies it to clipboard, increments `click_count` in D1, opens the store/affiliate link in a new tab, and displays a quick feedback modal.
- **Automatic Expiry Handling**: Expired coupons (`expiry_date < today`) are automatically hidden from active feeds and clearly marked with an **EXPIRED** badge when viewed in archive/detail pages.
- **Visitor Account & Coupon Upload (`/register`, `/login`, `/submit-coupon`, `/my-coupons`)**:
  - Visitors **must create an account / sign in** before they can upload a coupon.
  - PBKDF2 password hashing with 100,000 iterations and cryptographic random salt.
  - Secure signed session cookies (`couponhub_user_session`) with server-side protection in `middleware.ts`.
  - Logged-in visitors can share working coupons via `/submit-coupon` (store, category, title, code, discount, store link, expiry, terms).
  - Users can track their submitted coupons, click counts, and upvotes on `/my-coupons`.

### Admin Panel (Authorized Team)
- **Server-Side Protected Routes (`src/middleware.ts`)**: All `/admin/*` pages and `/api/admin/*` routes verify a signed `HttpOnly` HMAC-SHA256 session cookie on the server (never UI-only).
- **Coupon CRUD (`/admin`, `/admin/coupons/new`, `/admin/coupons/[id]/edit`)**: Create, edit, delete, search, filter by status/store/category, and toggle **Active / Inactive** live.
- **User Submission Visibility**: Admin dashboard displays whether a coupon was added by an Admin or submitted by a community user (`👤 User: Name`).
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

## Database Schema & Migrations

Defined in `db/migrations/`:

1. **`0001_initial_schema.sql`**:
   - `categories`: `id, name, slug, icon, created_at`
   - `stores`: `id, name, slug, logo_url, website_url, description, created_at`
   - `coupons`: `id, title, code, description, terms, discount_text, store_id, category_id, affiliate_or_store_url, expiry_date, is_active, click_count, worked_count, didnt_work_count, created_at, updated_at`
2. **`0002_user_auth_and_submissions.sql`**:
   - `users`: `id, name, email, password_hash, password_salt, role, created_at`
   - `coupons.user_id`: Foreign key link identifying which registered user submitted the coupon.

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
   ```

3. **Run D1 Migrations & Seed Data (Local)**
   ```bash
   npm run db:migrate:local
   npm run db:seed:local
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   - Public site: `http://localhost:4321`
   - Submit coupon (requires sign-in): `http://localhost:4321/submit-coupon`
   - My submitted coupons: `http://localhost:4321/my-coupons`
   - Admin panel: `http://localhost:4321/admin`

---

## Deployment to Cloudflare

1. **Login to Cloudflare via Wrangler**
   ```bash
   npx wrangler login
   ```

2. **Apply D1 Migrations to Remote Database**
   ```bash
   npm run db:migrate:remote
   npm run db:seed:remote
   ```

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
