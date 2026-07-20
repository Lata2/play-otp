import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Play",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="mb-6 text-sm text-slate-500">Play — Etisalat UAE</p>

          <div className="space-y-5 text-sm leading-relaxed text-slate-600">
            <section>
              <h2 className="mb-1 font-semibold text-slate-900">1. Information we collect</h2>
              <p>
                We collect your mobile number and subscription status to
                provide and manage the Play service.
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-slate-900">2. How we use your information</h2>
              <p>
                Your information is used to activate, bill, and manage your
                subscription, and to provide customer support.
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-slate-900">3. Data sharing</h2>
              <p>
                Information may be shared with Etisalat for billing purposes
                as required to deliver the service.
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-slate-900">4. Your choices</h2>
              <p>
                You can unsubscribe at any time by sending{" "}
                <span className="font-medium text-slate-900">C HP1</span> to{" "}
                <span className="font-medium text-slate-900">1111</span>,
                which stops further data use for billing this service.
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-slate-900">5. Contact</h2>
              <p>
                For privacy-related questions, contact Etisalat customer
                care.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
