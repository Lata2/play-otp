/**
 * ANALYTICS STORE — backed by PostgreSQL via Drizzle (separate tables).
 * Tracks PIN requests (incl. resends), verification outcomes, and
 * subscription-activation outcomes so the admin panel can show
 * per-user + overall stats. All functions are async since they
 * hit the database.
 */

import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { otpRequests, verifications, subscriptionEvents } from '@/lib/db/schema';

export async function recordOtpRequest(msisdn: string, isResend: boolean) {
  await db.insert(otpRequests).values({ msisdn, isResend });
}

export async function recordVerification(msisdn: string, success: boolean, failReason?: string) {
  await db.insert(verifications).values({ msisdn, success, failReason: failReason ?? null });
}

// Call this wherever subscription activation happens, after a successful PIN verification.
export async function recordSubscriptionOutcome(msisdn: string, success: boolean, failReason?: string) {
  await db.insert(subscriptionEvents).values({ msisdn, success, failReason: failReason ?? null });
}

export type UserStat = {
  msisdn: string;
  otpRequests: number;
  resends: number;
  verifySuccess: number;
  verifyFailed: number;
  lastOtpAt: number;
  lastVerifyAt: number | null;
  pinFailed: number;
  subscriptionFailed: number;
  lastVerifyFailReason: string | null;
  lastSubscriptionFailReason: string | null;
};

export type AnalyticsSummary = {
  totalOtpRequests: number;
  totalResends: number;
  totalVerifications: number;
  totalSuccess: number;
  totalFailed: number;
  uniqueUsers: number;
  totalPinFailed: number;
  totalSubscriptionFailed: number;
  users: UserStat[];
};

export async function getStats(fromTs?: number, toTs?: number): Promise<AnalyticsSummary> {
  const fromDate = fromTs !== undefined ? new Date(fromTs) : undefined;
  const toDate = toTs !== undefined ? new Date(toTs) : undefined;

  const otpDateFilter = and(
    fromDate ? gte(otpRequests.createdAt, fromDate) : undefined,
    toDate ? lte(otpRequests.createdAt, toDate) : undefined
  );
  const verifyDateFilter = and(
    fromDate ? gte(verifications.createdAt, fromDate) : undefined,
    toDate ? lte(verifications.createdAt, toDate) : undefined
  );
  const subDateFilter = and(
    fromDate ? gte(subscriptionEvents.createdAt, fromDate) : undefined,
    toDate ? lte(subscriptionEvents.createdAt, toDate) : undefined
  );

  const [otpRows, verifyRows, subRows] = await Promise.all([
    db.select().from(otpRequests).where(otpDateFilter),
    db.select().from(verifications).where(verifyDateFilter),
    db.select().from(subscriptionEvents).where(subDateFilter),
  ]);

  const byUser = new Map<string, UserStat>();

  function ensureUser(msisdn: string): UserStat {
    let u = byUser.get(msisdn);
    if (!u) {
      u = {
        msisdn,
        otpRequests: 0,
        resends: 0,
        verifySuccess: 0,
        verifyFailed: 0,
        lastOtpAt: 0,
        lastVerifyAt: null,
        pinFailed: 0,
        subscriptionFailed: 0,
        lastVerifyFailReason: null,
        lastSubscriptionFailReason: null,
      };
      byUser.set(msisdn, u);
    }
    return u;
  }

  for (const e of otpRows) {
    const u = ensureUser(e.msisdn);
    u.otpRequests += 1;
    if (e.isResend) u.resends += 1;
    const ts = e.createdAt.getTime();
    if (ts > u.lastOtpAt) u.lastOtpAt = ts;
  }

  // Oldest -> newest, so the last write wins and ends up holding the latest reason.
  const sortedVerifyRows = [...verifyRows].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
  const sortedSubRows = [...subRows].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  for (const e of sortedVerifyRows) {
    const u = ensureUser(e.msisdn);
    if (e.success) {
      u.verifySuccess += 1;
    } else {
      u.verifyFailed += 1;
      u.pinFailed += 1;
      u.lastVerifyFailReason = e.failReason ?? null;
    }
    const ts = e.createdAt.getTime();
    if (!u.lastVerifyAt || ts > u.lastVerifyAt) u.lastVerifyAt = ts;
  }

  for (const e of sortedSubRows) {
    const u = ensureUser(e.msisdn);
    if (!e.success) {
      u.subscriptionFailed += 1;
      u.lastSubscriptionFailReason = e.failReason ?? null;
    }
  }

  const users = Array.from(byUser.values()).sort((a, b) => b.lastOtpAt - a.lastOtpAt);

  return {
    totalOtpRequests: otpRows.length,
    totalResends: otpRows.filter((e) => e.isResend).length,
    totalVerifications: verifyRows.length,
    totalSuccess: verifyRows.filter((e) => e.success).length,
    totalFailed: verifyRows.filter((e) => !e.success).length,
    uniqueUsers: byUser.size,
    totalPinFailed: verifyRows.filter((e) => !e.success).length,
    totalSubscriptionFailed: subRows.filter((e) => !e.success).length,
    users,
  };
}

// Full timeline for one user: every OTP request/resend, every PIN try
// (with reason), and every subscription event (with reason). Used by the
// admin dashboard's expandable per-user detail view.
export type UserActivityEvent = {
  type: 'otp_request' | 'verification' | 'subscription';
  success?: boolean;
  isResend?: boolean;
  failReason?: string | null;
  createdAt: number;
};

export async function getUserActivity(msisdn: string): Promise<UserActivityEvent[]> {
  const [otpRows, verifyRows, subRows] = await Promise.all([
    db.select().from(otpRequests).where(eq(otpRequests.msisdn, msisdn)),
    db.select().from(verifications).where(eq(verifications.msisdn, msisdn)),
    db.select().from(subscriptionEvents).where(eq(subscriptionEvents.msisdn, msisdn)),
  ]);

  const events: UserActivityEvent[] = [
    ...otpRows.map((e) => ({
      type: 'otp_request' as const,
      isResend: e.isResend,
      createdAt: e.createdAt.getTime(),
    })),
    ...verifyRows.map((e) => ({
      type: 'verification' as const,
      success: e.success,
      failReason: e.failReason,
      createdAt: e.createdAt.getTime(),
    })),
    ...subRows.map((e) => ({
      type: 'subscription' as const,
      success: e.success,
      failReason: e.failReason,
      createdAt: e.createdAt.getTime(),
    })),
  ];

  events.sort((a, b) => b.createdAt - a.createdAt); // newest first
  return events;
}