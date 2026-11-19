import { getEnv } from "./cloudflare";

export const SESSION_COOKIE_NAME = "couponhub_admin_session";
export const USER_SESSION_COOKIE_NAME = "couponhub_user_session";

const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
const USER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function b64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(a: string, b: string): boolean {
  const bA = encoder.encode(a);
  const bB = encoder.encode(b);
  if (bA.length !== bB.length) return false;
  let diff = 0;
  for (let i = 0; i < bA.length; i++) diff |= bA[i] ^ bB[i];
  return diff === 0;
}

async function signPayload(payloadB64: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  return b64UrlEncode(new Uint8Array(sig));
}

async function createSignedToken(payload: Record<string, unknown>, ttlSeconds: number, secret: string): Promise<string> {
  const data = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const b64 = b64UrlEncode(encoder.encode(JSON.stringify(data)));
  const sig = await signPayload(b64, secret);
  return `${b64}.${sig}`;
}

async function verifySignedToken<T extends { exp?: number }>(token: string | undefined, secret: string): Promise<T | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [b64, receivedSig] = parts;
  try {
    const expectedSig = await signPayload(b64, secret);
    if (!constantTimeEqual(receivedSig, expectedSig)) return null;
    const decoded = JSON.parse(decoder.decode(b64UrlDecode(b64))) as T;
    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

function buildCookie(name: string, value: string, maxAge: number, requestUrl: string): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (requestUrl.startsWith("https://")) parts.push("Secure");
  return parts.join("; ");
}

export function getAuthConfig() {
  const env = getEnv();
  const username = env.ADMIN_USERNAME?.trim();
  const password = env.ADMIN_PASSWORD?.trim();
  const secret = env.SESSION_SECRET?.trim() || "couponhub-default-fallback-session-secret-key-32chars";
  return {
    configured: Boolean(username && password && env.SESSION_SECRET?.trim()),
    username: username ?? "",
    password: password ?? "",
    secret,
  };
}

export async function hashPassword(
  password: string,
  saltHex?: string
): Promise<{ hash: string; salt: string }> {
  const saltBytes = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes as unknown as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return {
    hash: bytesToHex(new Uint8Array(derived)),
    salt: bytesToHex(saltBytes),
  };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const derived = await hashPassword(password, salt);
  return constantTimeEqual(derived.hash, hash);
}

export function verifyAdminCredentials(username: string, password: string): { ok: boolean; reason?: string } {
  const config = getAuthConfig();
  if (!config.configured) {
    return { ok: false, reason: "Admin credentials are not configured in Cloudflare environment secrets." };
  }
  const match = constantTimeEqual(username.trim(), config.username) && constantTimeEqual(password, config.password);
  return match ? { ok: true } : { ok: false, reason: "Invalid username or password." };
}

export async function createSessionToken(username: string): Promise<string> {
  return createSignedToken({ sub: username }, ADMIN_SESSION_TTL_SECONDS, getAuthConfig().secret);
}

export async function verifySessionToken(token: string | undefined): Promise<{ valid: boolean; username?: string }> {
  const res = await verifySignedToken<{ sub?: string }>(token, getAuthConfig().secret);
  return res && res.sub ? { valid: true, username: res.sub } : { valid: false };
}

export function extractCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const pair of cookieHeader.split(";")) {
    const idx = pair.indexOf("=");
    if (idx !== -1 && pair.slice(0, idx).trim() === name) {
      return decodeURIComponent(pair.slice(idx + 1).trim());
    }
  }
  return undefined;
}

export async function getAuthenticatedAdmin(request: Request): Promise<{ authenticated: boolean; username?: string }> {
  const token = extractCookie(request.headers.get("cookie"), SESSION_COOKIE_NAME);
  const result = await verifySessionToken(token);
  return { authenticated: result.valid, username: result.username };
}

export function buildSessionCookie(token: string, requestUrl: string): string {
  return buildCookie(SESSION_COOKIE_NAME, token, ADMIN_SESSION_TTL_SECONDS, requestUrl);
}

export function buildClearSessionCookie(requestUrl: string): string {
  return buildCookie(SESSION_COOKIE_NAME, "", 0, requestUrl);
}

export interface UserSessionPayload {
  id: number;
  sub: number;
  email: string;
  name: string;
  role: string;
  exp: number;
}

export async function createUserSessionToken(user: { id: number; email: string; name: string; role?: string }): Promise<string> {
  const payload = {
    id: user.id,
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "user",
  };
  return createSignedToken(payload, USER_SESSION_TTL_SECONDS, getAuthConfig().secret);
}

export async function verifyUserSessionToken(token: string | undefined): Promise<UserSessionPayload | null> {
  const decoded = await verifySignedToken<UserSessionPayload>(token, getAuthConfig().secret);
  if (!decoded) return null;
  const userId = Number(decoded.id ?? decoded.sub);
  if (!userId) return null;
  return { ...decoded, id: userId, sub: userId };
}

export async function getAuthenticatedUser(request: Request): Promise<UserSessionPayload | null> {
  const token = extractCookie(request.headers.get("cookie"), USER_SESSION_COOKIE_NAME);
  return verifyUserSessionToken(token);
}

export function buildUserSessionCookie(token: string, requestUrl: string): string {
  return buildCookie(USER_SESSION_COOKIE_NAME, token, USER_SESSION_TTL_SECONDS, requestUrl);
}

export function buildClearUserSessionCookie(requestUrl: string): string {
  return buildCookie(USER_SESSION_COOKIE_NAME, "", 0, requestUrl);
}
