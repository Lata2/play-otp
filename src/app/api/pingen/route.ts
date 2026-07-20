import { NextRequest, NextResponse } from "next/server";
import { generatePin, TEST_MSISDN } from "@/lib/mockPinStore";

/**
 * MOCK endpoint — simulates the "PIN Generation API" from the service spec.
 * Does NOT call any real carrier/billing system. No SMS is sent, no charge
 * is made. It only generates and stores a local PIN so the front-end flow
 * can be demoed and tested.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const msisdn = typeof body?.msisdn === "string" ? body.msisdn.trim() : "";

  if (!/^\d{7,15}$/.test(msisdn)) {
    return NextResponse.json(
      { response: "Fail", errorMessage: "Enter a valid mobile number" },
      { status: 400 }
    );
  }

  const pin = generatePin(msisdn);

  return NextResponse.json({
    response: "SUCCESS",
    errorMessage: "SUCCESS",
    // Demo-only field — a real PIN-gen API would never return the PIN in the
    // response, it would be delivered by SMS. Exposed here purely so this
    // mock can be tested without a real SMS gateway. Always populated for
    // the fixed test number.
    devPin: pin,
    testMsisdn: TEST_MSISDN,
  });
}
