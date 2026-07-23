CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"msisdn" text NOT NULL,
	"event_type" text NOT NULL,
	"is_resend" boolean,
	"success" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "otp_requests" CASCADE;--> statement-breakpoint
DROP TABLE "subscription_events" CASCADE;--> statement-breakpoint
DROP TABLE "verifications" CASCADE;