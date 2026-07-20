"use client";

import { useState } from "react";
import { PhoneCheckIcon } from "@/components/PhoneCheckIcon";

type Step = "phone" | "otp" | "success";

const COUNTRY_CODE = "971";
const TEST_MSISDN = "8827563077";

export function SubscriptionFlow() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devPin, setDevPin] = useState<string | null>(null);

  const fullMsisdn = phone.trim();
  const isPhoneValid = /^\d{7,15}$/.test(fullMsisdn);
  const isOtpValid = /^\d{4}$/.test(otp);

  async function handleContinue() {
    if (!isPhoneValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pingen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msisdn: fullMsisdn }),
      });
      const data = await res.json();
      if (!res.ok || data.response !== "SUCCESS") {
        throw new Error(data.errorMessage || "Something went wrong");
      }
      setDevPin(data.devPin ?? null);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!isOtpValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pinval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msisdn: fullMsisdn, pin: otp }),
      });
      const data = await res.json();
      if (!res.ok || data.response !== "SUCCESS") {
        throw new Error(data.errorMessage || "Incorrect PIN");
      }
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect PIN");
    } finally {
      setLoading(false);
    }
  }

  function handleUseTestNumber() {
    setPhone(TEST_MSISDN);
    setError(null);
  }

  function handleBack() {
    setStep("phone");
    setOtp("");
    setError(null);
    setDevPin(null);
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] px-4 py-10">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        {/* Header */}
        <p className="text-center text-[15px] leading-relaxed text-slate-500">
          Enter your Etisalat mobile number to receive an OTP
        </p>

        {/* Main card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6">
            <PhoneCheckIcon />

            {step !== "success" && (
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-xl font-semibold text-slate-900">
                  {step === "phone" ? "Enter your phone number" : "Enter the code"}
                </h1>
                <p className="text-sm text-slate-500">
                  {step === "phone"
                    ? "We'll text you a 4-digit code to confirm your subscription."
                    : `We sent a 4-digit code to +${COUNTRY_CODE} ${fullMsisdn}`}
                </p>
              </div>
            )}

            {step === "phone" && (
              <>
                <div className="flex w-full items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-slate-400">
                    <path
                      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="font-medium text-slate-900">{COUNTRY_CODE}</span>
                  <span className="h-5 w-px bg-slate-300" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="5XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleUseTestNumber}
                  className="-mt-2 text-xs font-medium text-blue-600 hover:underline"
                >
                  Use test number ({TEST_MSISDN})
                </button>

                <button
                  type="button"
                  disabled={!isPhoneValid || loading}
                  onClick={handleContinue}
                  className="w-full rounded-xl bg-blue-600 py-3.5 text-center font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {loading ? "Sending code..." : "Continue"}
                </button>

                <p className="text-center text-xs text-slate-400">
                  Free for 24 hours, then AED 3.25/day (VAT inclusive)
                </p>
              </>
            )}

            {step === "otp" && (
              <>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1234"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-center text-2xl font-semibold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />

                {devPin && (
                  <p className="-mt-2 text-center text-xs text-slate-400">
                    Demo mode: your code is <span className="font-semibold text-slate-600">{devPin}</span>
                  </p>
                )}

                <button
                  type="button"
                  disabled={!isOtpValid || loading}
                  onClick={handleVerify}
                  className="w-full rounded-xl bg-blue-600 py-3.5 text-center font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {loading ? "Verifying..." : "Verify & Subscribe"}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600"
                >
                  Use a different number
                </button>
              </>
            )}

            {step === "success" && (
              <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="text-xl font-semibold text-slate-900">You&apos;re subscribed</h1>
                <p className="text-sm text-slate-500">
                  +{COUNTRY_CODE} {fullMsisdn} is confirmed for Play.
                </p>
                <button
                  type="button"
                  onClick={handleBack}
                  className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                >
                  Start over
                </button>
              </div>
            )}

            {error && (
              <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Info line */}
        <p className="text-center text-sm text-slate-500">
          After clicking &quot;Subscribe&quot; you will receive a PIN message to confirm your
          subscription.
        </p>

        {/* T&C card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-base font-semibold text-slate-900">Terms and Conditions</h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-500">
            By clicking Subscribe, you agree to the below terms and conditions:
          </p>
          <div className="flex flex-wrap gap-1 text-sm">
            <a href="/terms" className="text-blue-600 underline underline-offset-2 hover:text-blue-800">
              Terms and Conditions
            </a>
            <span className="text-slate-500">&amp;</span>
            <a href="/privacy" className="text-blue-600 underline underline-offset-2 hover:text-blue-800">
              Privacy Policy
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs leading-relaxed text-slate-400">
          Play is a subscription service of Etisalat UAE that automatically renews for
          AED 3.25/day. You can unsubscribe at any time by sending{" "}
          <span className="font-medium">C HP1</span> to <span className="font-medium">1111</span>.
        </p>
      </div>
    </div>
  );
}
