import { NextRequest, NextResponse } from "next/server";
import { validatePin } from "@/lib/mockPinStore";

/**
 * MOCK endpoint — simulates the "PIN Validation API" from the service spec.
 * Does NOT call any real carrier/billing system and does not enroll anyone
 * in a real subscription. Local, in-memory validation only.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const msisdn = typeof body?.msisdn === "string" ? body.msisdn.trim() : "";
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";

  if (!msisdn || !pin) {
    return NextResponse.json(
      { response: "Fail", errorMessage: "Mobile number and PIN are required" },
      { status: 400 }
    );
  }

  const result = validatePin(msisdn, pin);

  if (result.ok) {
    return NextResponse.json({ response: "SUCCESS", errorMessage: "SUCCESS" });
  }

  const messages: Record<string, string> = {
    NOT_FOUND: "No PIN request found for this number. Request a new PIN.",
    EXPIRED: "This PIN has expired. Request a new one.",
    TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Request a new PIN.",
    INVALID_PIN: "Incorrect PIN. Please try again.",
  };

  return NextResponse.json(
    { response: "Fail", errorMessage: messages[result.reason] ?? "Validation failed" },
    { status: 400 }
  );
}
