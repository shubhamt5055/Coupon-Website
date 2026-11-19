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
  "bg-[#581C87]",
  "bg-[#9333EA]",
  "bg-[#EC4899]",
  "bg-[#14B8A6]",
  "bg-[#38BDF8]",
  "bg-[#7C3AED]",
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

export interface StoreBrandTheme {
  bgGradient: string;
  badgeColor: string;
  accentText: string;
  borderHover: string;
  brandTagline: string;
  brandColorHex: string;
}

export function getStoreBrandTheme(slugOrName: string): StoreBrandTheme {
  const key = slugOrName.toLowerCase().trim();
  if (key.includes("amazon")) {
    return {
      bgGradient: "from-amber-500/10 via-amber-500/5 to-white",
      badgeColor: "bg-amber-50 text-amber-900 border-amber-200/90",
      accentText: "group-hover:text-amber-800",
      borderHover: "hover:border-amber-400 hover:shadow-amber-950/5",
      brandTagline: "Electronics, Daily Essentials & Prime Savings",
      brandColorHex: "#ff9900",
    };
  }
  if (key.includes("flipkart")) {
    return {
      bgGradient: "from-blue-600/10 via-blue-500/5 to-white",
      badgeColor: "bg-blue-50 text-blue-900 border-blue-200/90",
      accentText: "group-hover:text-blue-700",
      borderHover: "hover:border-blue-400 hover:shadow-blue-950/5",
      brandTagline: "Big Billion Days, SuperCoins & Gadgets",
      brandColorHex: "#2874f0",
    };
  }
  if (key.includes("zomato")) {
    return {
      bgGradient: "from-rose-600/10 via-red-500/5 to-white",
      badgeColor: "bg-rose-50 text-rose-900 border-rose-200/90",
      accentText: "group-hover:text-rose-700",
      borderHover: "hover:border-rose-400 hover:shadow-rose-950/5",
      brandTagline: "Restaurant Delivery, Gold & Dining Out",
      brandColorHex: "#e23744",
    };
  }
  if (key.includes("swiggy")) {
    return {
      bgGradient: "from-orange-500/10 via-amber-500/5 to-white",
      badgeColor: "bg-orange-50 text-orange-900 border-orange-200/90",
      accentText: "group-hover:text-orange-700",
      borderHover: "hover:border-orange-400 hover:shadow-orange-950/5",
      brandTagline: "Food Delivery, Instamart & Dineout Offers",
      brandColorHex: "#fc8019",
    };
  }
  if (key.includes("myntra")) {
    return {
      bgGradient: "from-fuchsia-600/10 via-pink-500/5 to-white",
      badgeColor: "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200/90",
      accentText: "group-hover:text-fuchsia-700",
      borderHover: "hover:border-fuchsia-400 hover:shadow-fuchsia-950/5",
      brandTagline: "Top Fashion Brands, Footwear & Apparel",
      brandColorHex: "#ff3f6c",
    };
  }
  if (key.includes("makemytrip")) {
    return {
      bgGradient: "from-red-600/10 via-sky-500/5 to-white",
      badgeColor: "bg-sky-50 text-sky-900 border-sky-200/90",
      accentText: "group-hover:text-sky-700",
      borderHover: "hover:border-sky-400 hover:shadow-sky-950/5",
      brandTagline: "Domestic & International Flights & Hotels",
      brandColorHex: "#eb2026",
    };
  }
  if (key.includes("nykaa")) {
    return {
      bgGradient: "from-pink-600/10 via-rose-500/5 to-white",
      badgeColor: "bg-pink-50 text-pink-900 border-pink-200/90",
      accentText: "group-hover:text-pink-700",
      borderHover: "hover:border-pink-400 hover:shadow-pink-950/5",
      brandTagline: "Luxury Cosmetics, Skincare & Fragrances",
      brandColorHex: "#fc2779",
    };
  }
  if (key.includes("croma")) {
    return {
      bgGradient: "from-teal-600/10 via-emerald-500/5 to-white",
      badgeColor: "bg-teal-50 text-teal-900 border-teal-200/90",
      accentText: "group-hover:text-teal-700",
      borderHover: "hover:border-teal-400 hover:shadow-teal-950/5",
      brandTagline: "Tata Electronics, Appliances & Laptops",
      brandColorHex: "#00b5b8",
    };
  }
  return {
    bgGradient: "from-purple-500/10 via-pink-500/5 to-white",
    badgeColor: "bg-purple-50 text-[#581C87] border-[#9333EA]/30",
    accentText: "group-hover:text-[#9333EA]",
    borderHover: "hover:border-[#9333EA] hover:shadow-purple-950/5",
    brandTagline: "Verified Online Coupons & Promo Codes",
    brandColorHex: "#9333EA",
  };
}

export interface CategoryTheme {
  bgGradient: string;
  iconBg: string;
  badgeBg: string;
  hoverBorder: string;
  textColor: string;
}

export function getCategoryTheme(slugOrName: string): CategoryTheme {
  const key = slugOrName.toLowerCase().trim();
  if (key.includes("food") || key.includes("dining")) {
    return {
      bgGradient: "from-amber-500/10 via-orange-500/5 to-white",
      iconBg: "bg-amber-100 text-amber-800 group-hover:bg-amber-500 group-hover:text-white",
      badgeBg: "bg-amber-50 text-amber-900 border-amber-200/80 group-hover:bg-amber-100",
      hoverBorder: "hover:border-amber-400 hover:shadow-amber-950/5",
      textColor: "group-hover:text-amber-800",
    };
  }
  if (key.includes("fashion") || key.includes("apparel") || key.includes("clothing")) {
    return {
      bgGradient: "from-rose-500/10 via-pink-500/5 to-white",
      iconBg: "bg-rose-100 text-rose-800 group-hover:bg-rose-500 group-hover:text-white",
      badgeBg: "bg-rose-50 text-rose-900 border-rose-200/80 group-hover:bg-rose-100",
      hoverBorder: "hover:border-rose-400 hover:shadow-rose-950/5",
      textColor: "group-hover:text-rose-800",
    };
  }
  if (key.includes("electronic") || key.includes("gadget") || key.includes("mobile")) {
    return {
      bgGradient: "from-blue-500/10 via-indigo-500/5 to-white",
      iconBg: "bg-blue-100 text-blue-800 group-hover:bg-blue-500 group-hover:text-white",
      badgeBg: "bg-blue-50 text-blue-900 border-blue-200/80 group-hover:bg-blue-100",
      hoverBorder: "hover:border-blue-400 hover:shadow-blue-950/5",
      textColor: "group-hover:text-blue-800",
    };
  }
  if (key.includes("travel") || key.includes("hotel") || key.includes("flight")) {
    return {
      bgGradient: "from-sky-500/10 via-cyan-500/5 to-white",
      iconBg: "bg-sky-100 text-sky-800 group-hover:bg-sky-500 group-hover:text-white",
      badgeBg: "bg-sky-50 text-sky-900 border-sky-200/80 group-hover:bg-sky-100",
      hoverBorder: "hover:border-sky-400 hover:shadow-sky-950/5",
      textColor: "group-hover:text-sky-800",
    };
  }
  if (key.includes("shop") || key.includes("grocer")) {
    return {
      bgGradient: "from-emerald-500/10 via-teal-500/5 to-white",
      iconBg: "bg-emerald-100 text-emerald-800 group-hover:bg-emerald-500 group-hover:text-white",
      badgeBg: "bg-emerald-50 text-emerald-900 border-emerald-200/80 group-hover:bg-emerald-100",
      hoverBorder: "hover:border-emerald-400 hover:shadow-emerald-950/5",
      textColor: "group-hover:text-emerald-800",
    };
  }
  if (key.includes("beauty") || key.includes("health") || key.includes("personal")) {
    return {
      bgGradient: "from-purple-500/10 via-pink-500/5 to-white",
      iconBg: "bg-purple-100 text-purple-800 group-hover:bg-purple-500 group-hover:text-white",
      badgeBg: "bg-purple-50 text-purple-900 border-purple-200/80 group-hover:bg-purple-100",
      hoverBorder: "hover:border-purple-400 hover:shadow-purple-950/5",
      textColor: "group-hover:text-purple-800",
    };
  }
  return {
    bgGradient: "from-purple-500/10 via-pink-500/5 to-white",
    iconBg: "bg-purple-50 text-[#581C87] group-hover:bg-[#9333EA] group-hover:text-white",
    badgeBg: "bg-purple-50 text-[#581C87] border-[#9333EA]/30 group-hover:bg-purple-100",
    hoverBorder: "hover:border-[#9333EA] hover:shadow-purple-950/5",
    textColor: "group-hover:text-[#9333EA]",
  };
}
