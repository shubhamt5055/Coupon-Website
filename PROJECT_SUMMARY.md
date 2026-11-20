# CouponHub — Project Summary & Development Report

> **Project Name:** CouponHub  
> **Brand Slogan:** Save On Everything  
> **Platform Type:** Verified Discount Coupons & Daily Deals Marketplace  
> **Design Inspiration:** GrabOn (https://www.grabon.in/)  
> **Target Deployment:** Cloudflare Pages / Cloudflare Workers  
> **Framework:** Astro 5 (SSR) + Tailwind CSS v4 + TypeScript + Cloudflare D1 (SQLite)  
> **Date:** November 2026  

---

## 1. Executive Summary

CouponHub is a high-performance, mobile-responsive, community-driven discount coupon and deals platform tailored for Indian and global online shoppers.

Inspired by industry leaders like **GrabOn**, CouponHub combines a clean, trust-building visual aesthetic with robust server-side rendering, cryptographic user authentication, real-time community verification, and a complete admin management portal.

---

## 2. Architecture & Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Framework** | **Astro 5 (SSR)** | Server-side rendering using `@astrojs/cloudflare` adapter. Fast page loads, zero client JS bloat, and full SEO metadata. |
| **Styling** | **Tailwind CSS v4** | Modern utility-first CSS with customized GrabOn design tokens (Primary `#2491ef`, Accent `#60a600`, Navy `#191f2e`). |
| **Language** | **TypeScript (Strict)** | End-to-end type safety for models, bindings, API routes, and database entities. |
| **Database** | **Cloudflare D1 (SQLite)** | Serverless edge SQL database executing queries with sub-10ms global latency. |
| **Session Cache** | **Cloudflare KV** | Edge key-value storage (`SESSION` & `COUPON_CACHE`) for signed user sessions and response caching. |
| **Asset Storage** | **Cloudflare R2** | S3-compatible zero-egress bucket (`STORE_LOGOS`) for merchant logo uploads and fast delivery. |
| **Security & Auth** | **WebCrypto API** | HMAC-SHA256 session token signatures, PBKDF2 password hashing (100,000 rounds) with cryptographically random salts. |
| **Edge Deployment** | **Wrangler** | Direct single-command build and edge deployment (`npm run deploy`). |

---

## 3. GrabOn UI/UX Design System Transformation

Following a deep visual and interaction inspection of **https://www.grabon.in/**, the entire CouponHub UI was redesigned to replicate GrabOn’s high-converting, clean aesthetic:

### A. Color Palette & Visual Tokens
- **Primary Brand Blue (`#2491ef`)**: Used for primary action buttons, hover states, active links, and search buttons.
- **Primary Blue Hover (`#129fea`)**: Smooth active and hover feedback for buttons.
- **Smile & Verified Green (`#60a600` / `#10b981`)**: Used for the CouponHub smile arc under the logo, *"SAVE ON EVERYTHING"* tagline, verified checkmarks, and positive vote badges.
- **Midnight Navy (`#191f2e`)**: Used for top announcement strips, dark footer background, and high-impact festival pills.
- **Clean Page Background (`#f4f7fb`)**: Crisp light grayish-blue background providing high contrast against pure white cards.
- **Card Background (`#ffffff`)**: Rounded cards (`10px`–`12px`) with subtle borders (`#e2e8f0`) and soft elevation.
- **Pre-Footer Container (`#eef5ff`)**: Pale ice-blue background for newsletter subscription.
- **Flash Deal Ribbon (`#e65100` / `#ff5722`)**: Vibrant burnt orange for urgent flash deals and top discounts.

### B. Header (3-Tier Navigation Architecture)
1. **Tier 1 (Top Announcement Strip)**:
   - Deep navy background (`#191f2e`) with live deal counter badge (`LIVE`), site announcement, *"Trending Offers"* link, and `+ Share & Earn` button.
2. **Tier 2 (Main White Navbar)**:
   - **CouponHub Logo**: Distinctive wordmark with GrabOn's signature green smile curve underneath and `"SAVE ON EVERYTHING"` slogan.
   - **Central Global Search Bar**: Large rounded search bar with soft border and brand blue Search CTA.
   - **Right User Controls**: `+ Submit Coupon` button, authenticated user avatar with name, single universal Logout button, and Sign In / Sign Up buttons.
3. **Tier 3 (Category & Deals Bar)**:
   - Sub-navigation links: `Top Stores`, `Categories`, `All Coupons`, `🔥 Deals Of The Day`.
   - Dark navy campaign capsule pill: `⚡ Festival Mega Deals (UP TO 80% OFF)`.

### C. Coupon Card Anatomy (High-Converting Cards)
- **Top / Left Ribbon Badge**: `RECOMMENDED` in royal navy (`#191f2e`) or `FLASH DEAL` in vibrant orange (`#ff5722`).
- **Store & Discount Identity**: Store logo in a rounded box, store title, category badge, and prominent discount tag (`e.g. 50% OFF`).
- **Social Proof & Verification Strip**:
  - `✔ Verified` in green (`#60a600`)
  - `• 96% Success`
  - `• XX Uses Today`
- **Bottom Code Action Box**: Dashed coupon code preview with masked code (`SWIG•••`) and GrabOn blue button `SHOW CODE >`.

### D. 2-Step Coupon Reveal Modal
- **Success Banner**: Green checkmark icon with `"Code Successfully Copied!"`
- **Dashed Code Container**: Huge uppercase coupon code (`letter-spacing: 2px`) with `Copy Again` button.
- **Store Redirect Button**: Direct button `"Go to Store & Apply Coupon ↗"` in `#2491ef` (opens merchant in new tab).
- **Community Feedback Voting**: `"Did this coupon work for you?"` with `[ 👍 Yes, Worked! ]` and `[ 👎 No, Expired ]` buttons directly connected to the API.

### E. Pre-Footer & Footer Directory
- **Pre-Footer Newsletter Banner**: Ice-blue container (`#eef5ff`) with email input and `SUBSCRIBE NOW` button.
- **Main Dark Footer (`#191f2e`)**: CouponHub logo, 4-column directory with lime-green headers (`#c2f03e`), affiliate FTC disclosure, and copyright strip.

---

## 4. Complete Features Implemented

### 1. Public Visitor Features
- **Homepage (`/`)**: Hero banner, live stats, popular store quick pills, 3 Trust Value Cards, Top Stores grid, Category grid, Trending deals feed, and Shopper FAQ guide.
- **Search & Multi-criteria Filter (`/coupons`)**: Search by store name, deal title, or promo code; filter by category, store, sort order (`newest`, `popular`, `expiring`), and include expired archive toggle.
- **Store Directory (`/stores`) & Store Pages (`/stores/[slug]`)**: Alphabetical search filter, store logo display, verified merchant tag, active offer count, and direct merchant website links.
- **Categories Directory (`/categories`) & Category Pages (`/categories/[slug]`)**: Icon grid with active deal counts and instant category search.
- **Coupon Details Page (`/coupons/[id]`)**: SEO breadcrumbs, coupon description, validity period, terms & conditions, working/didn't work voting widget, and related deal recommendations.
- **1-Click Auto-Copy & Affiliate Redirect**: Clicking `SHOW CODE` automatically copies the promo code to the clipboard, tracks the click in Cloudflare D1, and redirects the shopper to the merchant's checkout page in a background tab.

### 2. Community & User Account Features
- **Visitor Registration (`/login?mode=register` or `/register`)**: Create an account with name, email, and password.
- **Cryptographic Security**: PBKDF2 password hashing with 100,000 iterations and cryptographic random salt. Signed session cookies (`couponhub_user_session`) via WebCrypto HMAC-SHA256.
- **Single Universal Logout**: Consolidated logout button in desktop header and mobile menu with instant session invalidation.
- **Submit Working Coupons (`/submit-coupon`)**: Authenticated users can submit new coupons with store, category, code, discount, URL, expiry date, and terms.
- **User Dashboard (`/my-coupons`)**: Track total coupons submitted, pending review, approved live deals, total clicks, and delete submitted coupons with one click.

### 3. Admin Panel & Editorial Operations
- **Protected Routes (`/admin/*`)**: Middleware-enforced server-side authentication with session tokens.
- **Dashboard (`/admin`)**: Real-time KPI stats (Total coupons, pending review, active live, expired, total clicks, stores, categories).
- **Coupon Moderation & CRUD (`/admin/coupons/new`, `/admin/coupons/[id]/edit`)**: Create, edit, delete, and toggle coupons between Active and Inactive without redeployment.
- **Store Management (`/admin/stores`)**: Add stores, define custom slugs, and upload store logos directly to Cloudflare R2.
- **Category Management (`/admin/categories`)**: Add categories, custom slugs, and emoji icons.
- **Bulk CSV Import (`/admin/import`)**: Bulk-upload hundreds of coupons via CSV file or copy-paste with server-side validation and downloadable sample template.

---

## 5. Code Audit & Dead Code Clean-up Report

To ensure the application is 100% production-ready and lightweight, a comprehensive line-by-line audit was conducted:

| Removed Item | Location | Reason for Removal | Impact |
|---|---|---|---|
| **Legacy Theme Tables** | `src/lib/format.ts` | 173 lines of hardcoded brand styles (`StoreBrandTheme`, `CategoryTheme`, `getStoreBrandTheme`, `getCategoryTheme`) left over from previous prototypes. | Saved 173 lines of dead code; zero runtime dependency. |
| **Obsolete Punch-hole CSS** | `src/styles/global.css` | `.ticket-notch-left` and `.ticket-notch-right` rules (23 lines) from an old ticket design. | CSS bundle size reduced. |
| **Unused Ticket Dashed CSS** | `src/styles/global.css` | `.ticket-dashed-line` and `.ticket-dashed-vertical` (9 lines) replaced by standard Tailwind utility classes (`border-dashed`). | CSS file simplified to 33 lines of clean code. |
| **Unused Theme Imports** | `src/pages/categories/[slug].astro` | Unused `getCategoryTheme` import and unused `theme` variable declaration. | Clean template frontmatter. |
| **Unused Store Theme Imports** | `src/pages/stores/[slug].astro` | Unused `getStoreBrandTheme` import and fallback simplified to static clean string. | Clean template frontmatter. |
| **Redundant Dark Overlays** | `src/pages/index.astro`, `src/pages/login.astro`, `src/pages/submit-coupon.astro` | Heavy dark background image overlays removed in favor of GrabOn's clean light-mode aesthetic. | Modern, fast-rendering UI. |
| **Total Lines Cleaned** | Entire Codebase | **Over 230 lines of dead code removed.** | Faster build, lower memory, zero feature loss. |

---

## 6. Verification & Build Status

- **Type Check & Build**: `npm run build` executed and verified.
- **Result**: **Exit code 0 (`[build] Complete! in 6.11s`)** without errors or warnings.
- **Git Commit**: All modifications safely committed to branch `main`.

---

## 7. Local Development & Deployment Guide

### Local Development
```bash
# Install dependencies
npm install

# Apply database migrations to local D1
npx wrangler d1 migrations apply coupon_db --local

# Seed initial stores and categories
npx wrangler d1 execute coupon_db --local --file=./db/seed.sql

# Start development server
npm run dev
```

### Production Deployment to Cloudflare
```bash
# Apply migrations to remote production Cloudflare D1
npx wrangler d1 migrations apply coupon_db --remote

# Build and deploy application
npm run deploy
```
