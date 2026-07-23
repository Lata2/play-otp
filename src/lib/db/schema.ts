import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

// One row per PIN (OTP) request, including resends.
export const otpRequests = pgTable('otp_requests', {
  id: serial('id').primaryKey(),
  msisdn: text('msisdn').notNull(),
  isResend: boolean('is_resend').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// One row per PIN verification attempt.
export const verifications = pgTable('verifications', {
  id: serial('id').primaryKey(),
  msisdn: text('msisdn').notNull(),
  success: boolean('success').notNull(),
  failReason: text('fail_reason'), // NOT_FOUND | EXPIRED | TOO_MANY_ATTEMPTS | INVALID_PIN | null (when success)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// One row per subscription-activation attempt.
export const subscriptionEvents = pgTable('subscription_events', {
  id: serial('id').primaryKey(),
  msisdn: text('msisdn').notNull(),
  success: boolean('success').notNull(),
  failReason: text('fail_reason'), // populated once subscription-activation logic exists
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});