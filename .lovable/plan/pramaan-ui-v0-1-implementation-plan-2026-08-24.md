# Pramaan — UI v0.1 Implementation Plan

Identity verification & public-safety platform. Concept: **Evidence → Verification → Trust**. Feeling: calm, precise, protective, credible, contemporary. The uploaded Master Spec v0.1 is the constitution; this plan sequences it.

## Locked design decisions (from your answers)

- **Name:** Pramaan
- **Palette — "Ledger Paper" (light-first):** warm paper `#FAF8F3`, ink `#1C2530`, vermilion seal accent `#C2492B`, deep green success `#1E6F4F`, plus supporting warning/danger/info roles derived from the same family
- **Type:** Space Grotesk (display, headings, credential numerals) + DM Sans (body, UI)
- **Cadence:** Foundation checkpoint first, then full expansion after your approval
- **Framework adaptation:** spec says Next.js; this project is fixed on TanStack Start (React 19 + Vite). All patterns translate 1:1 (file routes, server fns, Query).

## Build sequence

### Phase A — Foundation checkpoint (this build, then you review)

1. **Design tokens** in `src/styles.css`: full semantic palette (background/surface/foreground/border/accent/success/warning/danger/info + soft variants, oklch), type scale (display → metadata → credential-data), spacing on 4/8, radius (sm/md/lg/pill, restrained), elevation (borders first, shadows last), motion tokens (durations/easings, micro/interaction/showcase). Font loading via `<link>` in `__root.tsx`.
2. **Primitive layer:** install needed shadcn/Radix components (button, input, textarea, label, dialog, sheet, drawer, tooltip, tabs, accordion, alert, select, switch, checkbox, progress, skeleton, separator, badge, sonner) — restyled to the token system, not default shadcn look. Install `motion` (Motion for React) as the motion layer.
3. **Core product language:** `CredentialStatusBadge`, `VerificationStep`/`VerificationProgress` (the SCAN→VALIDATE→RESOLVE→ISSUER→STATUS→MATCH→CONFIRM→RECEIPT cascade), `TrustSignal`, status color/icon vocabulary covering the full state model (idle…verified…revoked, no_face, multiple_faces, timeout, offline…).
4. **App shells:** mobile-first citizen shell (bottom nav: Home / Verify / Safety / Activity; thumb-safe, ≥44px targets), desktop composed shell, minimal official-shell variant, marketing nav.
5. **Two signature anchors to validate the visual language:**
   - `EvidenceToTrustHero` — bespoke SVG/Motion composition: a raw credential data object resolving into a verified credential and trust mark.
   - `CredentialCard` + `CredentialReveal` — the trustworthy digital document treatment (photo, name, designation, issuer, validity, credential ID in Space Grotesk numerals) with data-resolve animation.
6. **Home screen** (`/app`) as the operational anchor: dominant "Verify an official" action, guarded SOS entry, recent verification state, scam-check entry.
7. **Landing hero + first showcase section** at `/` to validate marketing tone.

**→ Checkpoint: you review tokens, hero, credential card, verification cascade, home, and mobile shell before expansion.**

### Phase B — Core citizen verification (after approval)

- Onboarding/welcome, QR scanner (full-screen camera-first frame via `getUserMedia` with demo fallback; scan line, boundary, permission/error/retry states), processing state, verified credential result, invalid/expired/revoked variants, face comparison (reference portrait vs live frame; detecting/matching/match/mismatch/no_face/multiple_faces), official-confirmation request (sent/pending/accepted/rejected/timeout), **Trust Receipt** (what was verified, issuer, methods, timestamp, limitations).

### Phase C — Safety features

Safety hub, nearest police station (permission → detect → list/detail → call/directions), SOS (press-and-hold confirm, countdown/cancel, sent/acknowledged, honest demo labeling), scam detection (paste message → analyzing → risk classification with indicators and hedged language), incident reporting (details → evidence → review → submit → confirmation).

### Phase D — Official interface

Official demo entry, incoming request list, request detail with citizen context and expiry, approve/reject, expired request, confirmation state. Same design family, clearly different role IA.

### Phase E — Marketing/showcase completion + system states

Remaining landing sections (workflow explainer, face/identity story, official confirmation moment, safety network visualization, privacy/security philosophy, architecture/trust diagram, final CTA), plus system states: offline, service unavailable, unauthorized, forbidden, not found, unexpected error, empty, expired session — as reusable components wired to route error boundaries.

### Phase F — Polish & backend-wiring prep

Responsive refinement (360px stress → 1440px showcase), accessibility pass (focus, reduced-motion, labels, contrast), performance (image optimization, lazy sections), typed API client boundary + contract alignment notes.

## Route map (TanStack file routes)

```text
/                        marketing landing (all showcase sections)
/app                     citizen home
/app/onboarding          welcome
/app/verify              verify entry
/app/verify/scan         QR scanner
/app/verify/session/$id  verification session state machine (all result states)
/app/verify/receipt/$id  trust receipt
/app/activity            history
/app/safety              safety hub
/app/safety/police       stations list   /app/safety/police/$id  detail
/app/safety/sos          SOS flow
/app/safety/scam         scam detection
/app/safety/report       incident report
/app/profile             settings + privacy/security
/official                official entry
/official/requests       incoming list
/official/requests/$id   detail / approve / reject
```

## Architecture

```text
src/
  routes/                 route files per map above
  components/
    ui/                   shadcn primitives (token-restyled)
    layout/               shells, nav (mobile bottom nav, desktop shell)
    product/              CredentialCard, VerificationProgress, TrustReceipt,
                          FaceMatchPanel, SOSAction, PoliceStationCard,
                          ScamRiskIndicator, IncidentReportForm, …
    showcase/             EvidenceToTrustHero, CredentialReveal,
                          VerificationCascade, SafetyNetworkVisualization, …
  design/                 token/typography/motion references & docs
  features/               verification, identity, official-verification,
                          emergency, scam-detection, reporting (per-feature
                          view models + mock services)
  lib/api/                typed client boundary — the ONLY place mock data
                          is served from; swap point for a real backend
  types/                  shared view models (CredentialVerificationViewModel…)
```

**Backend-wiring rules enforced throughout:** components consume typed view models only; mock data isolated in `lib/api` + feature mock services with simulated latency; explicit async states (loading/success/empty/error/timeout/offline) everywhere; no database calls, no hardcoded data in visual components, no verification "truth" invented in the frontend. Synthetic demo personas only, clearly labeled as demo. No Lovable Cloud yet — that's the later real-backend phase.

**Verification state machine is sacred:** QR decoded ≠ credential valid ≠ identity matched ≠ officially confirmed. The UI renders exactly the state the (mock) service returns, never assumes success.

## Mobile-first strategy

Design at 390–430px primary, stress-test 360px; single column, bottom-nav, bottom sheets, full-screen camera mode, grouped scannable credential data. Desktop is a composed expansion (side-by-side credential + verification state, wider showcase compositions) — never stretched mobile.

## Technical notes

- Tokens in oklch in `src/styles.css` `@theme inline` (Tailwind v4); fonts via `<link>` in `__root.tsx`.
- New deps: `motion` (motion layer); shadcn components added via CLI. GSAP only if a timeline genuinely requires it.
- Icons: lucide-react only. One icon family, no emoji as iconography.
- Reduced-motion: every animated component ships a static equivalent.
- Every route gets unique `head()` metadata; root placeholder metadata replaced.
- Custom editorial imagery generated sparingly and art-directed (no stock-photo heroes, no server rooms, no hackers) — most signature visuals are React/SVG/CSS, not images.
- 21st.dev/MotionSites MCPs used as reference for selected interaction patterns only, adapted into the token system.
