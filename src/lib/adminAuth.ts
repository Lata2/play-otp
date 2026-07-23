import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const SESSION_SECRET = process.env.SESSION_SECRET!;

export function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  return { username, password };
}

export function verifyCredentials(username: string, password: string): boolean {
  const creds = getAdminCredentials();
  return username === creds.username && password === creds.password;
}

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export function createSession(): string {
  const createdAt = Date.now().toString();
  const nonce = randomBytes(8).toString("hex");
  const payload = `${createdAt}.${nonce}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function isValidSession(token: string | undefined | null): boolean {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [createdAtStr, nonce, sig] = parts;

  const payload = `${createdAtStr}.${nonce}`;
  const expectedSig = sign(payload);

  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return false; // tampered / invalid
  }

  const createdAt = Number(createdAtStr);
  if (!createdAt || Date.now() - createdAt > SESSION_TTL_MS) {
    return false; // expired
  }

  return true;
}

