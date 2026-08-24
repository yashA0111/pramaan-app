import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ScanLine } from "lucide-react";

import { TrustSignal } from "@/components/product/trust-signal";
import { VerificationProgress } from "@/components/product/verification-progress";
import { DemoFallback } from "@/features/verification/components/demo-fallback";
import { createSession } from "@/features/verification/session-service";
import { VERIFICATION_STAGES, type VerificationStepModel } from "@/types/verification";

const STAGE_LABELS: Record<(typeof VERIFICATION_STAGES)[number], string> = {
  scan: "Scan",
  validate: "Validate",
  resolve: "Resolve",
  issuer: "Issuer",
  status: "Status",
  match: "Match",
  confirm: "Confirm",
  receipt: "Receipt",
};

const PIPELINE_PREVIEW: VerificationStepModel[] = VERIFICATION_STAGES.map((id) => ({
  id,
  label: STAGE_LABELS[id],
  state: "pending",
}));

const CERTAINTY_LEVELS: { name: string; detail: string }[] = [
  {
    name: "Credential valid",
    detail: "The QR payload is well-formed, signed, found in the registry, and not revoked.",
  },
  {
    name: "Identity matched",
    detail: "The person in front of you matches the photo and details on the credential.",
  },
  {
    name: "Officially confirmed",
    detail: "The issuing department confirmed this posting live during your session.",
  },
];

export const Route = createFileRoute("/app/verify/")({
  head: () => ({
    meta: [
      { title: "Verify an official — Pramaan" },
      {
        name: "description",
        content: "Scan a government credential QR code and walk the verification pipeline.",
      },
      { property: "og:title", content: "Verify an official — Pramaan" },
      {
        property: "og:description",
        content: "Scan a government credential QR code and walk the verification pipeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyEntry,
});

function VerifyEntry() {
  const navigate = useNavigate();

  const startDemo = useMutation({
    mutationFn: (reference: string) => createSession(reference, { demo: true }),
    onSuccess: (session) =>
      navigate({ to: "/app/verify/session/$id", params: { id: session.sessionId } }),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12">
      <div className="max-w-xl">
        <header>
          <h1 className="font-display text-page-title text-foreground">Verify an official</h1>
          <p className="mt-2 text-body text-foreground-muted">
            Ask the official to show the QR code on their credential. Pramaan resolves it against
            the registry, checks the issuer and status, and — if you want more certainty — compares
            the person in front of you or requests live confirmation.
          </p>
        </header>

        <Link
          to="/app/verify/scan"
          className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-accent px-5 text-body font-semibold text-accent-foreground transition-colors hover:bg-accent-strong sm:w-auto"
        >
          <ScanLine className="size-5" aria-hidden="true" />
          Scan a credential
        </Link>
        <p className="mt-2.5 text-metadata text-foreground-subtle">
          Your camera is used only while the scanner is open. Nothing is uploaded.
        </p>

        <TrustSignal
          className="mt-8"
          signal={{
            level: "provisional",
            label: "A scan alone is not a verification",
            detail:
              "Pramaan separates credential validity, identity match, and official confirmation. You always see which level of certainty you hold.",
          }}
        />

        <DemoFallback
          className="mt-8"
          disabled={startDemo.isPending}
          onUseReference={(reference) => startDemo.mutate(reference)}
        />
        {startDemo.isError && (
          <p className="mt-2 text-body-sm text-danger">
            That demo session could not be started. Try again.
          </p>
        )}

        <section aria-label="Levels of certainty" className="mt-10 border-t border-border pt-6">
          <h2 className="text-label uppercase text-foreground-subtle">Levels of certainty</h2>
          <dl className="mt-4 divide-y divide-border">
            {CERTAINTY_LEVELS.map((level) => (
              <div
                key={level.name}
                className="grid gap-1 py-3.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4"
              >
                <dt className="font-display text-body-sm font-semibold text-foreground">
                  {level.name}
                </dt>
                <dd className="text-body-sm text-foreground-muted">{level.detail}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section
        aria-label="Verification pipeline"
        className="h-fit rounded-lg border border-border bg-surface-strong p-5 shadow-elev-1"
      >
        <h2 className="text-label uppercase text-foreground-subtle">
          Every verification walks this pipeline
        </h2>
        <VerificationProgress steps={PIPELINE_PREVIEW} compact className="mt-4" />
        <p className="mt-4 border-t border-border pt-3 text-metadata text-foreground-subtle">
          All stages idle — no session has been started.
        </p>
      </section>
    </div>
  );
}
