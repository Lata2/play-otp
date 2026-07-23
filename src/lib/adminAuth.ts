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
  if (!token) {
    console.log("[session] REJECTED: no cookie/token present");
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    console.log("[session] REJECTED: malformed token, parts =", parts.length);
    return false;
  }
  const [createdAtStr, nonce, sig] = parts;

  const payload = `${createdAtStr}.${nonce}`;
  const expectedSig = sign(payload);

  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expectedSig, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    console.log("[session] REJECTED: signature mismatch — SESSION_SECRET alag ho sakta hai");
    return false;
  }

  const createdAt = Number(createdAtStr);
  if (!createdAt || Date.now() - createdAt > SESSION_TTL_MS) {
    console.log("[session] REJECTED: expired");
    return false;
  }

  console.log("[session] OK");
  return true;
}
export function destroySession(_token: string | undefined | null) {
  // Stateless tokens can't be server-side revoked without a store.
  // Clearing the cookie client-side (in the logout route) is sufficient here.
}