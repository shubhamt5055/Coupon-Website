/**
 * Returns today's date in YYYY-MM-DD format (UTC).
 */
export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Checks whether a YYYY-MM-DD expiry date is strictly before today.
 */
export function isCouponExpired(expiryDate: string | null | undefined): boolean {
  if (!expiryDate) return false;
  const normalized = expiryDate.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return false;
  return normalized < getTodayIsoDate();
}

/**
 * Number of days remaining until expiry (negative if already expired).
 */
export function getDaysUntilExpiry(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;
  const normalized = expiryDate.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const today = new Date(`${getTodayIsoDate()}T00:00:00Z`).getTime();
  const target = new Date(`${normalized}T00:00:00Z`).getTime();
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "No expiry";
  const normalized = dateStr.trim().slice(0, 10);
  const parsed = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function maskCouponCode(code: string): string {
  const clean = code.trim();
  if (clean.length <= 3) return "•••";
  return `${"•".repeat(Math.min(clean.length - 2, 6))}${clean.slice(-2)}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function safeExternalUrl(url: string | null | undefined): string {
  if (!url) return "#";
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return "#";
  } catch {
    return "#";
  }
}

export function safeImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("/api/logos/")) return trimmed;
  if (trimmed.startsWith("data:image/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return "";
  } catch {
    return "";
  }
}

const STORE_COLORS = [
  "bg-[#0499FA]",
  "bg-[#FF7A18]",
  "bg-[#081126]",
  "bg-[#10B981]",
  "bg-[#3B82F6]",
  "bg-[#F59E0B]",
];

export function getStoreColorClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return STORE_COLORS[hash % STORE_COLORS.length];
}

export function getStoreInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ST";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
