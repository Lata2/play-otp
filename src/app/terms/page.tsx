import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions — Play",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FB] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-semibold text-slate-900">
            Terms and Conditions
          </h1>
          <p className="mb-6 text-sm text-slate-500">Play — Etisalat UAE</p>

          <div className="space-y-5 text-sm leading-relaxed text-slate-600">
            <section>
              <h2 className="mb-1 font-semibold text-slate-900">1. About the service</h2>
              <p>
                Play is a subscription content service offered to Etisalat
                UAE subscribers. By subscribing, you agree to these terms.
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-slate-900">2. Subscription and billing</h2>
              <p>
                The service is billed at AED 3.25 per day (VAT inclusive) and
                renews automatically until you unsubscribe. Charges are
                applied directly to your Etisalat mobile account.
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-slate-900">3. How to subscribe</h2>
              <p>
                Enter your Etisalat mobile number and confirm the 4-digit PIN
                sent to you by SMS. Confirming the PIN activates your
                subscription.
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-slate-900">4. How to unsubscribe</h2>
              <p>
                You can cancel at any time by sending{" "}
                <span className="font-medium text-slate-900">C HP1</span> to{" "}
                <span className="font-medium text-slate-900">1111</span>. No
                further charges will apply once your cancellation is
                processed.
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-slate-900">5. Eligibility</h2>
              <p>
                This service is available to active Etisalat UAE prepaid and
                postpaid subscribers only.
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-slate-900">6. Changes to these terms</h2>
              <p>
                These terms may be updated from time to time. Continued use of
                the service after changes are posted constitutes acceptance
                of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-slate-900">7. Contact</h2>
              <p>
                For support, contact Etisalat customer care or reach out
                through the official Etisalat channels.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
