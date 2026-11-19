import type { CategoryInput, CouponInput, StoreInput } from "./types";
import { slugify } from "./format";

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  errors: string[];
}

export function sanitizeText(value: unknown, maxLength = 500): string {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMultilineText(value: unknown, maxLength = 2000): string {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function validateHttpUrl(value: unknown, fieldName: string): { url: string; error?: string } {
  const raw = sanitizeText(value, 500);
  if (!raw) {
    return { url: "", error: `${fieldName} is required.` };
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { url: "", error: `${fieldName} must start with http:// or https://.` };
    }
    return { url: parsed.href };
  } catch {
    return { url: "", error: `${fieldName} must be a valid URL.` };
  }
}

export function validateOptionalLogoUrl(value: unknown): { url: string; error?: string } {
  const raw = String(value ?? "").trim();
  if (!raw) return { url: "" };
  if (raw.startsWith("/api/logos/")) {
    return { url: raw.slice(0, 300) };
  }
  if (raw.startsWith("data:image/")) {
    if (raw.length > 250_000) {
      return { url: "", error: "Uploaded logo data URL is too large (max ~180KB)." };
    }
    return { url: raw };
  }
  return validateHttpUrl(raw, "Logo URL");
}

export function validateCouponInput(raw: Record<string, unknown>): ValidationResult<CouponInput> {
  const errors: string[] = [];

  const title = sanitizeText(raw.title, 140);
  if (title.length < 3) {
    errors.push("Title must be at least 3 characters long.");
  }

  const code = sanitizeText(raw.code, 40).toUpperCase().replace(/\s+/g, "");
  if (code.length < 2 || !/^[A-Z0-9_-]+$/.test(code)) {
    errors.push("Coupon code must be 2–40 characters (letters, numbers, hyphen, underscore only).");
  }

  const discount_text = sanitizeText(raw.discount_text, 40);
  if (discount_text.length < 2) {
    errors.push("Discount badge text is required (e.g. '20% OFF' or '₹150 OFF').");
  }

  const description = sanitizeMultilineText(raw.description, 1000);
  const terms = sanitizeMultilineText(raw.terms, 1500);

  const store_id = Number(raw.store_id);
  if (!Number.isInteger(store_id) || store_id <= 0) {
    errors.push("Please select a valid store.");
  }

  const category_id = Number(raw.category_id);
  if (!Number.isInteger(category_id) || category_id <= 0) {
    errors.push("Please select a valid category.");
  }

  const { url: affiliate_or_store_url, error: urlError } = validateHttpUrl(
    raw.affiliate_or_store_url,
    "Store / Affiliate URL"
  );
  if (urlError) errors.push(urlError);

  const expiry_date = sanitizeText(raw.expiry_date, 20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry_date)) {
    errors.push("Expiry date must be in YYYY-MM-DD format.");
  } else {
    const parsedDate = new Date(`${expiry_date}T00:00:00Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push("Expiry date is not a valid calendar date.");
    }
  }

  const isActiveRaw = raw.is_active;
  const is_active =
    isActiveRaw === true ||
    isActiveRaw === 1 ||
    isActiveRaw === "1" ||
    isActiveRaw === "true" ||
    isActiveRaw === "on"
      ? 1
      : 0;

  const user_id_raw = Number(raw.user_id);
  const user_id = Number.isInteger(user_id_raw) && user_id_raw > 0 ? user_id_raw : null;

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: [],
    data: {
      title,
      code,
      description,
      terms,
      discount_text,
      store_id,
      category_id,
      affiliate_or_store_url,
      expiry_date,
      is_active,
      user_id,
    },
  };
}

export function validateStoreInput(raw: Record<string, unknown>): ValidationResult<StoreInput> {
  const errors: string[] = [];

  const name = sanitizeText(raw.name, 80);
  if (name.length < 2) {
    errors.push("Store name must be at least 2 characters.");
  }

  const slug = slugify(sanitizeText(raw.slug, 80) || name);
  if (slug.length < 2) {
    errors.push("Store slug must contain letters or numbers.");
  }

  const { url: website_url, error: webErr } = validateHttpUrl(raw.website_url, "Website URL");
  if (webErr) errors.push(webErr);

  const { url: logo_url, error: logoErr } = validateOptionalLogoUrl(raw.logo_url);
  if (logoErr) errors.push(logoErr);

  const description = sanitizeMultilineText(raw.description, 400);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: [],
    data: { name, slug, logo_url, website_url, description },
  };
}

export function validateCategoryInput(raw: Record<string, unknown>): ValidationResult<CategoryInput> {
  const errors: string[] = [];

  const name = sanitizeText(raw.name, 60);
  if (name.length < 2) {
    errors.push("Category name must be at least 2 characters.");
  }

  const slug = slugify(sanitizeText(raw.slug, 60) || name);
  if (slug.length < 2) {
    errors.push("Category slug must contain letters or numbers.");
  }

  const icon = sanitizeText(raw.icon, 16) || "🏷️";

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: [],
    data: { name, slug, icon },
  };
}

/**
 * Lightweight RFC-4180 compliant CSV parser for bulk coupon upload.
 */
export function parseCsv(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  const clean = csvText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        currentField += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if (char === "\n") {
      currentRow.push(currentField.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).map((cols) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = cols[idx] ?? "";
    });
    return obj;
  });
}

export function validateEmail(email: unknown): { email: string; error?: string } {
  const clean = sanitizeText(email, 120).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!clean || !emailRegex.test(clean)) {
    return { email: "", error: "Please enter a valid email address." };
  }
  return { email: clean };
}

export function validateRegisterInput(raw: Record<string, unknown>): ValidationResult<{
  name: string;
  email: string;
  password: string;
}> {
  const errors: string[] = [];
  const name = sanitizeText(raw.name, 60);
  if (name.length < 2) {
    errors.push("Full Name must be at least 2 characters.");
  }
  const { email, error: emailErr } = validateEmail(raw.email);
  if (emailErr) errors.push(emailErr);

  const password = String(raw.password ?? "");
  const confirmPassword = String(raw.confirmPassword ?? raw.confirm_password ?? "");

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long.");
  }
  if (confirmPassword && password !== confirmPassword) {
    errors.push("Passwords do not match.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, errors: [], data: { name, email, password } };
}

export function validateLoginInput(raw: Record<string, unknown>): ValidationResult<{
  email: string;
  password: string;
}> {
  const errors: string[] = [];
  const { email, error: emailErr } = validateEmail(raw.email);
  if (emailErr) errors.push(emailErr);

  const password = String(raw.password ?? "");
  if (!password) {
    errors.push("Password is required.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, errors: [], data: { email, password } };
}
