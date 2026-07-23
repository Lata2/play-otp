import { randomBytes } from "crypto";

export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type Session = { createdAt: number };

declare global {
  var __adminSessions: Map<string, Session> | undefined;
}

function getSessions(): Map<string, Session> {
  if (!global.__adminSessions) global.__adminSessions = new Map();
  return global.__adminSessions;
}

export function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  return { username, password };
}

export function verifyCredentials(username: string, password: string): boolean {
  const creds = getAdminCredentials();
  return username === creds.username && password === creds.password;
}

export function createSession(): string {
  const token = randomBytes(32).toString("hex");
  getSessions().set(token, { createdAt: Date.now() });
  return token;
}

export function isValidSession(token: string | undefined | null): boolean {
  if (!token) return false;
  const session = getSessions().get(token);
  if (!session) return false;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    getSessions().delete(token);
    return false;
  }
  return true;
}

export function destroySession(token: string | undefined | null) {
  if (!token) return;
  getSessions().delete(token);
}