# Play — Subscription UI (Demo)

A Next.js (App Router) + TypeScript + Tailwind CSS clone of the Etisalat
"Enter your mobile number to receive an OTP" subscription screen for the
**Play** service, wired up to a mocked PIN generation / validation flow.

## Important — this is a mock, not a real billing integration

The original spec (UAE Etisalat Play) describes a real carrier PIN-billing
flow: a live pingen.php / pinval.php endpoint that charges the subscriber
AED 3.25/day once they confirm the PIN.

This project does NOT call that real endpoint. Instead:

- src/app/api/pingen/route.ts and src/app/api/pinval/route.ts are local,
  in-memory mock API routes.
- No SMS is sent, no real network/carrier is contacted, and nobody is charged
  anything.
- The generated PIN is returned directly in the API response (devPin) and shown
  on screen, purely so the flow can be tested without a real SMS gateway.

If you plan to connect this UI to the real billing endpoints, that's a
business/compliance decision for you and Etisalat/your ad network to make —
this repo intentionally stops at the UI + mock layer.

## Test number

Use 8827563077 — a tappable "Use test number" link is provided on the phone
screen, and this number always resolves to a fixed test PIN: 1234.
Any other number also works and generates a random 4-digit PIN, shown on screen
in demo mode.

## Getting started

    npm install
    npm run dev

Open http://localhost:3000

## Project structure

    src/
      app/
        api/
          pingen/route.ts   # mock PIN generation endpoint
          pinval/route.ts   # mock PIN validation endpoint
        terms/page.tsx      # Terms and Conditions page
        privacy/page.tsx    # Privacy Policy page
        layout.tsx
        page.tsx
        globals.css
      components/
        PhoneCheckIcon.tsx    # icon matching the reference design
        SubscriptionFlow.tsx  # phone -> OTP -> success flow, all UI + client logic
      lib/
        mockPinStore.ts       # in-memory PIN store (resets on server restart)

## Flow

1. Phone step — enter a UAE mobile number (or tap "Use test number").
   Continue calls /api/pingen.
2. OTP step — enter the 4-digit code (shown on screen in demo mode).
   Verify calls /api/pinval.
3. Success step — confirmation screen.
4. Terms and Conditions / Privacy Policy links open real pages at /terms
   and /privacy.

## Notes

- Built with create-next-app (App Router, TypeScript, Tailwind CSS v4, src/ dir).
- Uses system fonts (no external font fetch), so it builds fully offline.
- Design is a clean, single-accent (blue) professional light theme.
- npm run build has been verified to complete successfully.
