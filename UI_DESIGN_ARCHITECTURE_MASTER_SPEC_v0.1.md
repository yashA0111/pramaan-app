# Government Identity Verification Platform
# UI Design Architecture Master Specification v0.1

**Status:** Pre-implementation UI constitution  
**Primary consumer:** Lovable (initial implementation), then Cursor/other frontend agents  
**Design benchmark:** Split application engineering/design maturity and coherence  
**Functional reference:** Existing SIH prototype supplied by the team  
**Primary UI target:** Mobile-first, production-minded, polished hackathon application  
**Implementation principle:** Build the frontend as a stable product surface that can be wired to a real backend without redesigning the information architecture or state model.

---

## 0. PURPOSE

This document is the single source of truth for the first UI build. It compresses the intended content of:

- `DESIGN.md`
- `docs/design/VISUAL_LANGUAGE.md`
- `docs/design/DESIGN_TOKENS.md`
- `docs/design/MOTION_RULES.md`
- `docs/design/COMPONENT_RULES.md`
- `docs/design/SHOWCASE_ART_DIRECTION.md`
- frontend-facing parts of the architecture and product-flow specifications

The goal is not to copy the visual style of Split. The goal is to reproduce the **level of authorship, coherence, cleanliness, visual specificity, and engineering discipline** visible in that application, while creating an original visual identity for this product.

The product is a secure identity/credential verification and public-safety platform. It must feel trustworthy, modern, calm, highly intentional, and technologically credible without looking like a generic government portal or generic AI dashboard.

The UI must support:

1. Citizen identity/credential verification.
2. Government-official credential inspection.
3. QR scanning and verification.
4. Face comparison / identity matching flow.
5. Official-assisted verification fallback.
6. Verification result and trust receipt.
7. SOS/emergency assistance.
8. Nearest police station discovery.
9. Scam/SMS/message detection.
10. Incident/scam reporting.
11. Privacy and security communication.
12. Demo/showcase storytelling.
13. Mobile-first usage.
14. High-quality desktop presentation.

---

# 1. NON-NEGOTIABLE DESIGN PRINCIPLES

## 1.1 Mobile first is a hard requirement

The primary mental model is a person holding a phone in a real-world situation.

Design for approximately:

- 360px wide as a lower-bound stress case.
- 390–430px as the primary mobile design range.
- 768px tablet as an intermediate breakpoint.
- 1024px+ desktop.
- 1440px+ showcase/large-screen presentation.

Do not design desktop first and then collapse it to mobile.

Every major experience must be designed mobile-first, then composed into desktop layouts.

Mobile must preserve the important task flow without requiring horizontal scrolling, dense tables, tiny controls, or precision interactions.

## 1.2 Security must be visible without becoming visually loud

The product handles sensitive identity-related information. Trust should be communicated through:

- precision
- clarity
- verification states
- restrained color use
- clear provenance
- deliberate transitions
- concise security explanations

Do not rely on:

- hacker aesthetics
- excessive shields
- neon green “security” styling
- sci-fi HUDs
- fake encryption animations
- “government” clichés

## 1.3 The UI must have a distinct point of view

The interface must not look like an unmodified Tailwind/shadcn starter.

The design system should establish a recognizable visual language before feature implementation expands.

The core conceptual metaphor is:

> **Evidence → Verification → Trust**

Alternative supporting language:

> Unknown → Checked → Confirmed

The metaphor should be present subtly in compositions, transitions, cards, diagrams, and showcase moments.

## 1.4 Information is the design

Sensitive identity UI should prioritize real information rather than ornament.

A credential card should feel like a trustworthy digital document, not a generic profile card.

A verification result should communicate what was checked, not merely say “Success.”

## 1.5 Motion must have a reason

Animation should communicate:

- scanning
- progress
- state transition
- verification
- spatial relationship
- feedback

Avoid animations that exist only because an animation library exists.

## 1.6 Originality over component novelty

Use shadcn/Radix for stable primitives.
Use 21st.dev for high-quality component references and selected starting points.
Use MotionSites for motion/composition inspiration.
Use bespoke React/SVG/CSS where the product needs signature visual behavior.

Do not compose a page by stacking unrelated catalog components.

## 1.7 Accessibility is a visual quality requirement

Every important interaction must be understandable without relying exclusively on color, animation, iconography, or sound.

Keyboard focus, reduced motion, readable text, adequate touch targets, and clear status labels are mandatory.

---

# 2. VISUAL THESIS

## 2.1 Product feeling

The product should feel like:

**calm + precise + protective + credible + contemporary**

It should not feel like:

**bureaucratic + cyberpunk + generic SaaS + AI-generated concept art + medical dashboard + banking clone**

## 2.2 Signature metaphor

The product visually moves from evidence to certainty.

Examples:

- a credential begins as a data object and becomes a verified identity.
- a QR scan resolves into trustworthy credential metadata.
- a face match moves from “checking” to “confirmed.”
- an official confirmation changes a provisional state into authoritative confirmation.

Use this metaphor to inspire visual transitions rather than explaining it literally on every screen.

## 2.3 Visual composition principles

Prefer:

- generous negative space.
- large but disciplined typography.
- high information clarity.
- editorial hierarchy.
- asymmetric compositions where useful.
- one strong visual idea per section.
- subtle borders.
- restrained shadows.
- authentic-looking data blocks.
- custom illustrations and diagrams.

Avoid:

- card-grid everything.
- identical cards repeated endlessly.
- excessive rounded rectangles.
- excessive glassmorphism.
- gratuitous gradients.
- random floating blobs.
- purple/blue “AI glow” clichés.
- fake technical labels.
- decorative server-room imagery.

---

# 3. PRODUCT SURFACES

The UI is not one screen. It consists of several coherent surfaces.

## 3.1 Public showcase / landing experience

Purpose: communicate the product concept quickly, beautifully, and credibly.

Required sections:

1. Hero: evidence becoming trust.
2. Core verification workflow.
3. Credential visualization.
4. “How verification works” explanation.
5. Identity/face verification visualization.
6. Official-assisted verification.
7. Public-safety tools.
8. Privacy/security philosophy.
9. Technical credibility / architecture explanation.
10. Final product CTA.

The landing page is allowed to be expressive.

## 3.2 Citizen application

Primary features:

- Home.
- Verify official.
- Scan credential.
- Verification session.
- Face match.
- Official confirmation.
- Verification result.
- Verification history/status.
- SOS.
- Nearest police station.
- Scam detection.
- Report incident.
- Safety/privacy information.

## 3.3 Official-side experience

For prototype purposes, this can be a distinct route/interface that simulates the official receiving and approving a verification request.

It must feel like the same product family, but the information architecture should make it obvious that the user role is different.

## 3.4 Demo/support surfaces

Include sensible states and tools for demonstration:

- mocked credential registry status.
- simulated verification requests.
- controlled test personas.
- clear test/demo indication where required.

Do not expose internal debug tools in the normal citizen UI.

---

# 4. INFORMATION ARCHITECTURE

## 4.1 Primary citizen navigation

Mobile recommendation:

- Home
- Verify
- Safety
- Activity/Profile

Use a bottom navigation or similarly thumb-friendly navigation structure.

Do not place 8–10 primary actions in a bottom nav.

Desktop can expand into a top/side navigation pattern without changing information hierarchy.

## 4.2 Home screen priority

The home screen must prioritize:

1. Verify an official.
2. SOS / emergency action.
3. Recent verification state.
4. Scam/message detection.
5. Supporting safety tools.

The primary verification action should visually dominate.

SOS must be discoverable but should not become an accidental tap hazard.

## 4.3 Verification flow hierarchy

The central flow is:

```text
Start verification
→ Scan QR
→ Validate credential
→ Show credentials
→ Ask user to compare person
→ Optional face comparison
→ If uncertain, request official confirmation
→ Verification result
```

The UI must preserve the logical state machine and must never imply verification before the backend confirms it.

---

# 5. UI STATE MODEL

All major features must visually support the complete state lifecycle.

Generic state vocabulary:

- `idle`
- `ready`
- `loading`
- `scanning`
- `processing`
- `pending`
- `verified`
- `rejected`
- `mismatch`
- `expired`
- `revoked`
- `invalid`
- `no_face`
- `multiple_faces`
- `requires_review`
- `timeout`
- `offline`
- `error`

Never collapse all failure scenarios into one generic red error.

Examples:

### QR

`ready → scanning → processing → verified`

or

`scanning → invalid`

or

`processing → expired`

### Face

`ready → camera active → detecting → matching → match`

or

`detecting → no_face`

or

`detecting → multiple_faces`

or

`matching → mismatch → official_confirmation_available`

### Official confirmation

`request_created → sent → pending → accepted`

or

`pending → rejected`

or

`pending → expired/no_response`

The UI should make these state transitions visually legible.

---

# 6. DESIGN TOKENS

The exact token values may be refined during visual exploration, but all final values must be centralized.

## 6.1 Color roles

Create semantic tokens, not one-off hex values.

Required roles:

- `background`
- `backgroundElevated`
- `surface`
- `surfaceStrong`
- `surfaceMuted`
- `foreground`
- `foregroundMuted`
- `foregroundSubtle`
- `border`
- `borderStrong`
- `accent`
- `accentForeground`
- `success`
- `successSoft`
- `warning`
- `warningSoft`
- `danger`
- `dangerSoft`
- `info`
- `infoSoft`
- `focus`

The palette should be restrained and professional.

Do not introduce new colors in individual components without adding a semantic token.

## 6.2 Typography

Use a high-quality contemporary sans-serif with strong numeric readability.

Define:

- display
- hero
- page title
- section title
- card title
- body
- body small
- label
- metadata
- numeric/credential data
- button

Large display typography should be used deliberately, primarily in showcase/hero areas.

Operational interfaces should favor readability and density control over theatrical typography.

## 6.3 Spacing

Use a compact spacing scale such as 4/8-based increments.

No arbitrary “magic” values unless a signature composition genuinely requires them and the exception is documented.

## 6.4 Radius

Define small, medium, large and pill radii.

Do not make every surface pill-shaped or excessively rounded.

## 6.5 Elevation

Prefer subtle elevation.

Most surfaces should be separated by:

1. spacing,
2. background contrast,
3. thin borders,
4. only then shadow.

---

# 7. COMPONENT ARCHITECTURE

## 7.1 Primitive layer

Use shadcn/Radix primitives for:

- Button
- Input
- Label
- Dialog
- Sheet
- Drawer
- Dropdown
- Tooltip
- Tabs
- Accordion
- Alert
- Toast
- Command
- Select
- Checkbox
- Switch
- Progress
- Skeleton
- Separator

Do not reinvent accessibility-sensitive primitives without a strong reason.

## 7.2 Product component layer

Build custom components that represent product concepts:

- `CredentialCard`
- `CredentialField`
- `CredentialStatusBadge`
- `VerificationProgress`
- `VerificationStep`
- `VerificationReceipt`
- `TrustSignal`
- `IssuerIdentity`
- `FaceMatchPanel`
- `FaceMatchResult`
- `VerificationRequestCard`
- `OfficialApprovalPanel`
- `VerificationTimeline`
- `SecuritySummary`
- `AuditEventPreview`
- `SOSAction`
- `LocationCard`
- `PoliceStationCard`
- `ScamRiskIndicator`
- `MessageAnalysisCard`
- `IncidentReportForm`

These should remain backend-neutral and consume typed props/view models.

## 7.3 Signature/showcase layer

Create bespoke components for visually distinctive sections.

Potential examples:

- `EvidenceToTrustHero`
- `CredentialReveal`
- `VerificationCascade`
- `TrustReceiptShowcase`
- `IdentityMatchStory`
- `OfficialConfirmationMoment`
- `SafetyNetworkVisualization`

These components are where the visual identity can become unique.

Do not force standard shadcn cards into these sections.

---

# 8. COMPONENT RULES

1. Components must have one understandable responsibility.
2. Reuse existing components before creating new ones.
3. Do not duplicate nearly identical components.
4. Keep stateful business logic out of pure visual primitives.
5. Separate data fetching from presentation.
6. Components should accept typed data/state props.
7. Avoid backend calls from deep leaf components.
8. Every reusable component should support loading/error/empty states where appropriate.
9. Every interactive component must have keyboard/focus behavior.
10. Every destructive action must have an intentional confirmation pattern.
11. Never use icons as unexplained text replacements.
12. Do not use emoji as primary UI iconography.
13. Icons must come from one coherent icon family.
14. Avoid excessive nested cards.
15. Never introduce a component solely to avoid writing a few lines of markup unless it improves consistency or readability.

---

# 9. MOBILE-FIRST RULES

## 9.1 Touch

Interactive controls should generally target at least ~44px touch size.

## 9.2 Layout

On mobile:

- one primary column by default.
- content should fit the viewport without horizontal scrolling.
- important actions should remain thumb-accessible.
- long credential information should be grouped and scannable.
- avoid dense multi-column layouts.

## 9.3 Camera flows

Camera-based flows are first-class mobile experiences.

The screen should prioritize:

- camera frame
- instruction
- current verification state
- single primary action
- clear fallback/error message

Do not surround the camera with unrelated UI.

## 9.4 Desktop

Desktop is a presentation and operational enhancement, not a different product.

Use wider layouts for:

- side-by-side credential + verification status.
- official/citizen panels.
- larger showcase compositions.
- architecture diagrams.
- multi-column safety tools.

Desktop should feel intentionally composed, not simply “mobile UI stretched out.”

---

# 10. VERIFICATION UX

This is the most important product interaction.

## 10.1 Start

Primary CTA should explain the action in plain language.

Good examples:

- “Verify an official”
- “Scan government credential”

Avoid generic:

- “Start”
- “Proceed”
- “Verify” without context

## 10.2 Scan

The scanner must provide:

- clear scan boundary.
- concise instruction.
- subtle scanning feedback.
- permission/error states.
- retry path.

## 10.3 Verified credential

The result should show only the necessary information.

Suggested hierarchy:

1. Verification state.
2. Person photo.
3. Name.
4. Designation.
5. Department/authority.
6. Badge/credential identifier where appropriate.
7. Posting/location where appropriate.
8. Validity.
9. Issuer/trust information.
10. privacy explanation.

Do not visually overwhelm the user with raw machine data.

## 10.4 Face comparison

The UI should clearly distinguish:

- the reference credential portrait.
- the person currently being viewed.
- the system's matching state.

Do not show a misleading “98.7%” as though it represents absolute identity certainty.

If confidence metrics are displayed, label them appropriately and explain their meaning.

## 10.5 Uncertain/mismatch

Never make the user feel punished for an imperfect camera condition.

Examples:

“No clear face detected.”
“Multiple faces detected. Ask only the official to remain in frame.”
“Unable to confidently match the person. You can request official verification.”

Provide a safe next action.

## 10.6 Official confirmation

The official request should communicate:

- who is requesting.
- what is being requested.
- what information will be shared.
- expiration of request.
- official's response state.

## 10.7 Final result

A verified result should feel like a **trust receipt** rather than a success toast.

It should communicate:

- Verified / not verified.
- What was verified.
- Who/which authority issued it.
- When the verification occurred.
- Which verification methods succeeded.
- Any important limitations.

---

# 11. EXTRA FEATURES UX

These are not secondary throw-ins. They must feel like part of the same product.

## 11.1 Nearest police station

Flow:

`permission → detect location → find stations → show list/map → navigate/contact`

Mobile priority:

- closest station.
- distance.
- open/availability if known.
- call/contact.
- directions.

## 11.2 SOS

SOS is high consequence.

Use a deliberate press-and-confirm pattern to reduce accidental activation.

Show:

- what will happen.
- location being shared.
- destination/authority.
- countdown/cancel where appropriate.
- sent/acknowledged status.

Never simulate that emergency services were contacted unless the UI explicitly indicates this is a demo/mock integration.

## 11.3 Scam/message detection

Flow:

`paste/receive message → analyzing → risk classification → explanation → safe action`

Results should be understandable to a non-technical user.

Do not present model output as absolute truth.

Use language like:

- likely scam
- suspicious
- appears safe
- needs caution

Provide the indicators that caused the result.

## 11.4 Reporting

Flow:

`incident details → evidence → review → submit → confirmation`

Make reporting less intimidating than a government form.

---

# 12. MOTION SYSTEM

## 12.1 Motion principles

Motion should be:

- fast enough to feel responsive.
- restrained.
- spatially coherent.
- consistent.
- purposeful.

## 12.2 Motion categories

Define three levels:

### Micro

Button feedback, toggles, status changes.

### Interaction

Dialogs, drawers, verification steps, scanner transitions.

### Showcase

Hero storytelling, scroll choreography, credential transformations.

Showcase motion can be more expressive than operational UI.

## 12.3 Verification motion

Good examples:

- QR scan line.
- credential data resolving.
- issuer check completing.
- face frame locking onto one subject.
- verified state collapsing into a trust mark.

Do not use:

- endless spinning.
- fake data streams.
- meaningless particle effects.

## 12.4 Reduced motion

Support `prefers-reduced-motion` and provide a clear non-animated equivalent.

---

# 13. SHOWCASE / ART DIRECTION

This is the part that prevents the marketing UI from feeling like a generic SaaS landing page.

## 13.1 Art direction goal

Create custom visuals that explain the product rather than merely decorate it.

Every major image/illustration should answer:

> “What idea from the product does this visual make easier to understand or remember?”

## 13.2 Recommended visual categories

### Product-native visuals

- credential cards.
- QR/signature visualization.
- identity comparison.
- verification cascades.
- audit trails.
- safety networks.

These should usually be built in React/SVG/CSS.

### Generated editorial imagery

Possible subjects:

- person verifying an official in a realistic environment.
- phone-centered safety scenes.
- urban public-service contexts.
- carefully staged identity/credential moments.

These must feel art-directed, not like stock images.

### Technical illustrations

- trust boundaries.
- credential issuer → holder → verifier.
- verification pipeline.
- emergency response flow.

## 13.3 Image rules

Avoid:

- generic “AI woman holding smartphone.”
- generic server room.
- random cybersecurity hooded hacker.
- fake government buildings as decoration.
- neon cyberpunk imagery.
- overly synthetic 3D blobs.

Use cohesive art direction:

- consistent lighting.
- consistent color relationship to the design system.
- plausible environments.
- realistic composition.
- enough negative space for typography.

## 13.4 Asset naming

All showcase assets should have descriptive names tied to purpose, not generation order.

Example:

`hero-evidence-to-trust.webp`
`official-verification-scene.webp`
`identity-match-editorial.webp`

---

# 14. 21ST.DEV USAGE RULES

21st.dev is a component/reference source, not the design authority.

Use it for:

- navigation patterns.
- polished controls.
- advanced forms.
- command/search patterns.
- status components.
- interaction ideas.
- occasionally a sophisticated section treatment.

Workflow:

1. Search.
2. Inspect multiple options.
3. Select one appropriate pattern.
4. Adapt it to project tokens.
5. Remove unnecessary styling.
6. Integrate into the design system.

Do not blindly copy a full page.

Do not install a component if an existing internal component already solves the problem.

The current free plan limits should be respected; the free tier should be treated as a limited discovery/installation resource rather than something to exhaustively consume.

---

# 15. MOTIONSITES USAGE RULES

Use MotionSites for:

- interaction inspiration.
- transition references.
- section composition ideas.
- scroll storytelling references.

Do not copy another site's identity.

For each reference, capture:

- what interaction is useful.
- why it belongs in this product.
- what must be changed.

Do not make MotionSites-derived motion a dependency of core functionality.

---

# 16. LIBRARIES AND IMPLEMENTATION GUIDANCE

Preferred frontend foundation:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix primitives where applicable
- Motion for React / Framer Motion as the default motion layer
- GSAP only when a genuinely complex timeline requires it
- TanStack Query for server state
- React Hook Form + Zod for forms/validation
- Lucide or one coherent icon family

Three.js / React Three Fiber should be used only when the 3D object materially improves the storytelling. It should not become the default visual vocabulary.

Prefer SVG/Canvas/CSS for diagrams where they are simpler and more robust.

---

# 17. BACKEND-WIRING CONTRACT

The UI must be designed so that backend integration does not require page rewrites.

## 17.1 Typed boundaries

Every feature should expect typed data/view models.

Example concept:

```ts
interface CredentialVerificationViewModel {
  status: VerificationStatus;
  credential: CredentialSummary | null;
  checks: VerificationCheck[];
  sessionId: string;
  expiresAt: string;
  limitation?: string;
}
```

The exact interface will be finalized with the backend/API contract.

## 17.2 Backend-neutral components

A component should not care whether data currently comes from:

- local mock data.
- a JSON fixture.
- a REST API.
- a future government API.

The component consumes a contract/view model.

## 17.3 Mock data must be replaceable

Use a data-access abstraction or API client layer.

Do not hardcode fake credentials inside visual components.

Do not put mock API URLs throughout the UI.

## 17.4 Explicit async states

Every API-backed view must account for:

- loading.
- success.
- empty.
- unauthorized.
- forbidden.
- validation error.
- timeout.
- network error.
- service unavailable.
- expired session.

---

# 18. DEMO DATA RULES

The hackathon environment must use synthetic/demo identities.

The UI should have clear demo affordances where necessary, but the application should still look like a serious product.

Do not use real government credentials or real citizen biometric information.

Demo identities should be internally consistent:

- photo.
- name.
- designation.
- department.
- credential ID.
- issuer.
- issue/expiry dates.
- credential status.

Use realistic but explicitly synthetic data.

---

# 19. SECURITY-RELEVANT UI RULES

1. Never imply verification before the backend state is confirmed.
2. Never show a success state merely because a QR was decoded.
3. Never expose unnecessary personal information.
4. Never present hidden/internal identifiers unless intentionally required.
5. Do not put secrets/tokens into rendered text.
6. Do not persist biometric images in browser storage.
7. Do not log sensitive data in the frontend console in production paths.
8. Make session expiry visible when it affects the workflow.
9. Distinguish `verified`, `matched`, and `officially confirmed`.
10. Do not treat an AI classification as an authoritative fact.
11. Display demo/mock boundaries honestly where they matter.
12. Never create a fake visual that suggests a real police/government request has been transmitted if it has not.

---

# 20. RESPONSIVE COMPOSITION SYSTEM

## Mobile

- single-column base.
- strong hierarchy.
- sticky/fixed primary action only when necessary.
- bottom sheets preferred for contextual actions.
- full-screen camera mode when scanning.
- progressive disclosure for secondary details.

## Tablet

- introduce two-column layouts selectively.
- allow credential summary + verification state side-by-side.

## Desktop

Use composed layouts such as:

```text
[Credential] [Verification State]

[Primary workflow] [Context / explanation]
```

## Large desktop

Add:

- wider hero compositions.
- technical diagrams.
- visual storytelling.
- controlled multi-column marketing sections.

Never simply stretch content to full width.

---

# 21. PERFORMANCE RULES

The visual experience must remain fast.

Avoid:

- giant unoptimized images.
- unnecessary client-side JavaScript.
- rendering entire libraries for one component.
- massive animation timelines on page load.
- video backgrounds unless genuinely valuable.

Prefer:

- optimized images.
- lazy loading.
- responsive image sizes.
- CSS transitions for simple motion.
- component-level code splitting where useful.

The hero should feel immediate even if richer sections load afterward.

---

# 22. PAGE-BY-PAGE UI SCOPE

The first implementation should cover the complete UI surface, not only the QR happy path.

## Marketing/showcase

- Landing page.
- Product story.
- Verification explainer.
- Safety feature showcase.
- Privacy/security section.
- Architecture/trust section.

## Citizen application

- Welcome/onboarding.
- Home.
- QR scanner.
- Scan processing.
- Credential verified.
- Credential invalid/expired/revoked.
- Face comparison.
- No face.
- Multiple faces.
- Match.
- Mismatch.
- Official verification request.
- Pending request.
- Accepted.
- Rejected/no response.
- Final verification receipt.
- History/activity.
- Safety tools hub.
- Police station list.
- Police station detail.
- SOS confirmation.
- SOS sent/acknowledged.
- Scam detection input.
- Scam analysis.
- Scam result.
- Incident report.
- Report submitted.
- Profile/settings.
- Privacy/security explanation.

## Official-side application

- Official login/demo entry.
- Incoming verification request.
- Request detail.
- Approve.
- Reject.
- Expired request.
- Confirmation.

## System states

- offline.
- maintenance/service unavailable.
- unauthorized.
- forbidden.
- not found.
- unexpected error.

---

# 23. DESIGN REVIEW CHECKLIST

Every major page should be reviewed against:

## Visual

- Is there a clear focal point?
- Does the page have a distinct composition?
- Are repeated patterns controlled?
- Does it look intentionally authored?
- Are there any generic AI motifs?
- Are tokens consistent?

## UX

- Is the primary action obvious?
- Is the state understandable?
- Is the next step obvious?
- Are errors actionable?
- Is sensitive information minimized?

## Mobile

- Does it work at 360px?
- Are touch targets comfortable?
- Is horizontal scrolling absent?
- Is important content above the fold or clearly reachable?
- Does the camera flow feel native?

## Desktop

- Does it feel intentionally composed?
- Is whitespace used well?
- Is the screen too empty or too dense?

## Motion

- Does every animation serve a purpose?
- Is it fast enough?
- Does reduced-motion behave correctly?

## Engineering

- Does this reuse the design system?
- Is state separated from presentation?
- Can real backend data replace the mock data without redesign?
- Are errors and async states represented?

---

# 24. LOVABLE IMPLEMENTATION RULES

Lovable has creative freedom **within the design constitution**.

It may:

- explore visual compositions.
- choose between multiple typography/layout treatments within the token system.
- create tasteful custom illustrations.
- create bespoke SVG/React visualizations.
- decide where a 21st.dev component is genuinely useful.
- propose alternative hero compositions.
- create responsive layout refinements.

It may not:

- change the core information architecture without documenting the reason.
- invent a new visual system on a per-page basis.
- introduce arbitrary colors.
- introduce generic AI visual clichés.
- create duplicate primitives unnecessarily.
- hardwire API/database logic into visual components.
- assume a verification result without an explicit state.
- remove error/edge states because they are less visually attractive.
- sacrifice mobile usability for desktop showcase aesthetics.

When uncertain, prefer the existing design system over invention.

When a design decision is genuinely unresolved, Lovable may select the strongest option, but should record the decision in a short implementation/design note rather than silently changing the system.

---

# 25. FRONTEND DIRECTORY TARGET

The final structure should move toward something like:

```text
src/
├── app/
│   ├── (marketing)/
│   ├── (citizen)/
│   ├── (official)/
│   └── api-client-boundary/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── product/
│   ├── showcase/
│   └── visualization/
│
├── features/
│   ├── verification/
│   ├── credentials/
│   ├── identity/
│   ├── official-verification/
│   ├── emergency/
│   ├── scam-detection/
│   └── reporting/
│
├── design/
│   ├── tokens/
│   ├── typography/
│   └── motion/
│
├── visuals/
│   ├── generated/
│   ├── illustrations/
│   └── diagrams/
│
├── lib/
│   ├── api/
│   ├── validation/
│   └── utils/
│
└── types/
```

The final structure may evolve during implementation, but it must remain understandable and feature-oriented.

---

# 26. IMPLEMENTATION SEQUENCE

Do not build every page independently.

Recommended sequence:

### Phase 1 — Design foundation

- tokens.
- typography.
- base primitives.
- navigation.
- layout system.
- core motion primitives.
- accessibility patterns.

### Phase 2 — Signature visual language

- hero.
- credential visualization.
- evidence-to-trust composition.
- custom status/verification language.

### Phase 3 — Core verification application

- home.
- scan.
- credential result.
- face match.
- mismatch/failure.
- official confirmation.
- final trust receipt.

### Phase 4 — Safety features

- safety hub.
- police station.
- SOS.
- scam detection.
- reporting.

### Phase 5 — Official interface

- request list.
- request detail.
- approve/reject.

### Phase 6 — Showcase / polish

- marketing pages.
- architecture/trust storytelling.
- custom imagery.
- motion choreography.
- responsive refinement.

### Phase 7 — Backend wiring preparation

- typed API models.
- mock service layer.
- loading/error states.
- state synchronization.
- contract alignment.

### Phase 8 — QA

- mobile QA.
- desktop QA.
- accessibility.
- visual consistency.
- performance.
- end-to-end flow checks.

---

# 27. DEFINITION OF DONE FOR UI V0.1

The UI build is not complete when the happy-path screens exist.

It is complete when:

- the full citizen flow exists.
- the official flow exists.
- all major verification states exist.
- extra safety features exist.
- mobile is the primary supported experience.
- desktop is intentionally composed.
- a coherent design system is implemented.
- shadcn/Radix primitives are centralized.
- no arbitrary component-level visual systems exist.
- signature visual components are bespoke and product-specific.
- custom showcase imagery is integrated intentionally.
- animations are purposeful and accessible.
- mock data is isolated from presentation components.
- backend contracts can replace mocks without redesigning the UI.
- major error/edge states are represented.
- accessibility basics are implemented.
- the UI does not look like a generic AI-generated dashboard.

---

# 28. NON-GOALS

Do not spend early time on:

- Kubernetes.
- multi-region deployment UI.
- overly complex state-management frameworks.
- excessive 3D.
- building every possible settings page.
- speculative integrations.
- decorative animations with no product purpose.
- perfect desktop dashboards before mobile is stable.

The application can be ambitious without becoming cluttered.

---

# 29. OPEN DESIGN QUESTIONS FOR EXPLORATION

Lovable may explore these and propose directions:

1. Exact color palette.
2. Typeface pairing.
3. Shape/radius language.
4. Hero composition.
5. Credential-card visual treatment.
6. Verification-progress visual language.
7. Trust-receipt visual form.
8. Illustrative style for public-safety features.
9. Exact mobile navigation treatment.
10. Desktop shell treatment.

The selected direction must then be consolidated into the token/design system and reused consistently.

---

# 30. FINAL DESIGN DIRECTIVE

Build this application as though a highly disciplined product/design team created the system before implementation began.

The result should communicate:

> **“This is a real product with serious engineering behind it.”**

Do not imitate Split visually.

Do not produce a generic AI SaaS interface.

Do not design a government portal.

Do not turn security into a visual gimmick.

Instead:

**Build a distinctive, calm, evidence-driven identity product whose interface makes trust understandable.**

The design should be memorable enough that a judge can recognize it after seeing it once, while remaining usable enough that a person can complete the verification workflow under real-world pressure.

When a choice exists between visual novelty and clarity, choose clarity.

When a choice exists between generic familiarity and product-specific meaning, choose product-specific meaning.

When a choice exists between a clever animation and a useful state transition, choose the useful transition.

When a choice exists between adding another component and improving an existing one, improve the existing one.

When a choice exists between making a demo look finished and making the UI truthful about its security state, choose truth.

**This document is the UI constitution. Treat it as a contract, not as optional inspiration.**
