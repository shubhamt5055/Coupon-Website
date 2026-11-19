import { env } from "cloudflare:workers";
import type { AppBindings } from "./types";

const CACHE_KEYS = {
  TOP_COUPONS: "coupons:top:v1",
  HOME_ACTIVE: "coupons:home:active:v1",
} as const;

export function getEnv(): AppBindings {
  return env as unknown as AppBindings;
}

export function getDb(): D1Database {
  const db = getEnv().coupon_db;
  if (!db) {
    throw new Error("Cloudflare D1 binding `coupon_db` is not configured.");
  }
  return db;
}

export function getR2Bucket(): R2Bucket | null {
  return getEnv().STORE_LOGOS ?? null;
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const kv = getEnv().COUPON_CACHE;
  if (!kv) return null;
  try {
    const raw = await kv.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCachedJson(
  key: string,
  value: unknown,
  ttlSeconds = 60
): Promise<void> {
  const kv = getEnv().COUPON_CACHE;
  if (!kv) return;
  try {
    await kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
  } catch {
    // Non-fatal cache write failure
  }
}

export async function invalidateCouponCache(): Promise<void> {
  const kv = getEnv().COUPON_CACHE;
  if (!kv) return;
  try {
    await Promise.all([
      kv.delete(CACHE_KEYS.TOP_COUPONS),
      kv.delete(CACHE_KEYS.HOME_ACTIVE),
    ]);
  } catch {
    // Non-fatal cache invalidation failure
  }
}

export { CACHE_KEYS };
