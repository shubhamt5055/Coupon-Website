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
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return { url: "", error: `${fieldName} must have a valid domain (e.g. https://www.store.com/deal).` };
    }
    return { url: parsed.href };
  } catch {
    return { url: "", error: `${fieldName} must be a valid URL (e.g. https://www.store.com/deal).` };
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

  // 1. Title validation: 5 to 140 chars, allowed characters, cannot be only symbols/numbers
  const title = sanitizeText(raw.title, 140);
  if (title.length < 5) {
    errors.push("Title must be at least 5 characters long.");
  } else if (title.length > 140) {
    errors.push("Title cannot exceed 140 characters.");
  } else {
    // Allowed characters: letters, numbers, spaces, and standard punctuation/symbols
    const allowedCharsRegex = /^[\p{L}\p{N}\s.,!?&/()':;+₹$%#@*–—"\\-]+$/u;
    if (!allowedCharsRegex.test(title)) {
      errors.push("Title contains invalid characters. Only letters, numbers, and standard punctuation are allowed.");
    }
    // Must contain at least 2 letters (cannot be only symbols or numbers)
    const letterCount = (title.match(/\p{L}/gu) || []).length;
    if (letterCount < 2) {
      errors.push("Title cannot be only numbers or symbols. Please include descriptive words.");
    }
  }

  // 2. Promo Code validation: 2 to 30 characters, alphanumeric, hyphen, underscore
  const code = sanitizeText(raw.code, 30).toUpperCase().replace(/\s+/g, "");
  if (code.length < 2 || code.length > 30) {
    errors.push("Promo code must be between 2 and 30 characters.");
  } else if (!/^[A-Z0-9_-]+$/.test(code)) {
    errors.push("Promo code can only contain letters, numbers, hyphens, and underscores.");
  } else if (!/[A-Z0-9]/.test(code)) {
    errors.push("Promo code must contain at least one letter or number.");
  }

  // 3. Discount badge validation: <= 99% if percentage is present
  const discount_text = sanitizeText(raw.discount_text, 40);
  if (discount_text.length < 2) {
    errors.push("Discount badge text is required (e.g. '20% OFF' or '₹150 OFF').");
  } else {
    const pctMatch = discount_text.match(/(\d+(?:\.\d+)?)\s*%/);
    if (pctMatch) {
      const pctVal = parseFloat(pctMatch[1]);
      if (pctVal > 99) {
        errors.push("Discount percentage cannot exceed 99% (maximum allowed is 99% OFF).");
      } else if (pctVal <= 0) {
        errors.push("Discount percentage must be greater than 0%.");
      }
    }
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

  // 4. Deal / Store link validation
  const { url: affiliate_or_store_url, error: urlError } = validateHttpUrl(
    raw.affiliate_or_store_url,
    "Store / Deal link"
  );
  if (urlError) errors.push(urlError);

  // 5. Expiry Date validation: YYYY-MM-DD and cannot be in the past
  const expiry_date = sanitizeText(raw.expiry_date, 20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry_date)) {
    errors.push("Expiry date must be in YYYY-MM-DD format.");
  } else {
    const parsedDate = new Date(`${expiry_date}T00:00:00Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push("Expiry date is not a valid calendar date.");
    } else {
      const today = new Date().toISOString().slice(0, 10);
      if (expiry_date < today) {
        errors.push("Expiry date cannot be in the past. Please choose today or a future date.");
      }
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
