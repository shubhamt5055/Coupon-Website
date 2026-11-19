import { getEnv } from "./cloudflare";

export const SESSION_COOKIE_NAME = "couponhub_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function constantTimeEqual(a: string, b: string): boolean {
  const bytesA = encoder.encode(a);
  const bytesB = encoder.encode(b);
  if (bytesA.length !== bytesB.length) return false;
  let diff = 0;
  for (let i = 0; i < bytesA.length; i += 1) {
    diff |= bytesA[i] ^ bytesB[i];
  }
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
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  return base64UrlEncode(new Uint8Array(signature));
}

export function getAuthConfig() {
  const env = getEnv();
  const username = env.ADMIN_USERNAME?.trim();
  const password = env.ADMIN_PASSWORD?.trim();
  const secret = env.SESSION_SECRET?.trim();
  return {
    configured: Boolean(username && password && secret),
    username: username ?? "",
    password: password ?? "",
    secret: secret ?? "",
  };
}

export function verifyAdminCredentials(username: string, password: string): {
  ok: boolean;
  reason?: string;
} {
  const config = getAuthConfig();
  if (!config.configured) {
    return {
      ok: false,
      reason: "Admin credentials are not configured in Cloudflare environment secrets.",
    };
  }
  const userMatch = constantTimeEqual(username.trim(), config.username);
  const passMatch = constantTimeEqual(password, config.password);
  if (!userMatch || !passMatch) {
    return { ok: false, reason: "Invalid username or password." };
  }
  return { ok: true };
}

export async function createSessionToken(username: string): Promise<string> {
  const config = getAuthConfig();
  if (!config.secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }
  const payload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await signPayload(payloadB64, config.secret);
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(token: string | undefined): Promise<{
  valid: boolean;
  username?: string;
}> {
  if (!token) return { valid: false };
  const config = getAuthConfig();
  if (!config.secret) return { valid: false };

  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };
  const [payloadB64, receivedSig] = parts;

  try {
    const expectedSig = await signPayload(payloadB64, config.secret);
    if (!constantTimeEqual(receivedSig, expectedSig)) {
      return { valid: false };
    }
    const decoded = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as {
      sub?: string;
      exp?: number;
    };
    if (!decoded.sub || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }
    return { valid: true, username: decoded.sub };
  } catch {
    return { valid: false };
  }
}

export function extractCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    if (key === name) {
      return decodeURIComponent(pair.slice(idx + 1).trim());
    }
  }
  return undefined;
}

export async function getAuthenticatedAdmin(request: Request): Promise<{
  authenticated: boolean;
  username?: string;
}> {
  const token = extractCookie(request.headers.get("cookie"), SESSION_COOKIE_NAME);
  const result = await verifySessionToken(token);
  return { authenticated: result.valid, username: result.username };
}

export function buildSessionCookie(token: string, requestUrl: string): string {
  const isHttps = requestUrl.startsWith("https://");
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (isHttps) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function buildClearSessionCookie(requestUrl: string): string {
  const isHttps = requestUrl.startsWith("https://");
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (isHttps) {
    parts.push("Secure");
  }
  return parts.join("; ");
}
