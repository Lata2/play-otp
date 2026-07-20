/**
 * MOCK PIN STORE — for local demo/testing only.
 *
 * This simulates the PIN generation + validation behaviour described in the
 * service spec (PIN Generation API / PIN Validation API) WITHOUT calling any
 * real carrier billing endpoint. Nothing here sends an SMS, charges a
 * subscriber, or talks to an operator network. It only exists so the UI flow
 * can be exercised end-to-end in development.
 *
 * Data lives in memory and resets whenever the dev server restarts.
 */

type PinRecord = {
  pin: string;
  createdAt: number;
  attempts: number;
};

const PIN_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

// A fixed test number + fixed PIN so QA can test the flow without reading logs.
export const TEST_MSISDN = "8827563077";
export const TEST_PIN = "1234";

declare global {
  // eslint-disable-next-line no-var
  var __mockPinStore: Map<string, PinRecord> | undefined;
}

function getStore(): Map<string, PinRecord> {
  if (!global.__mockPinStore) {
    global.__mockPinStore = new Map();
  }
  return global.__mockPinStore;
}

function normalizeMsisdn(msisdn: string): string {
  return msisdn.replace(/\D/g, "");
}

export function generatePin(msisdn: string): string {
  const key = normalizeMsisdn(msisdn);
  const pin = key === TEST_MSISDN ? TEST_PIN : String(Math.floor(1000 + Math.random() * 9000));

  getStore().set(key, {
    pin,
    createdAt: Date.now(),
    attempts: 0,
  });

  // Demo-only convenience: log the generated PIN since there's no real SMS gateway.
  console.log(`[mock-pin] generated PIN ${pin} for ${key}`);

  return pin;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "EXPIRED" | "TOO_MANY_ATTEMPTS" | "INVALID_PIN" };

export function validatePin(msisdn: string, pin: string): ValidationResult {
  const key = normalizeMsisdn(msisdn);
  const record = getStore().get(key);

  if (!record) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (Date.now() - record.createdAt > PIN_TTL_MS) {
    getStore().delete(key);
    return { ok: false, reason: "EXPIRED" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "TOO_MANY_ATTEMPTS" };
  }

  if (record.pin !== pin) {
    record.attempts += 1;
    return { ok: false, reason: "INVALID_PIN" };
  }

  getStore().delete(key);
  return { ok: true };
}
