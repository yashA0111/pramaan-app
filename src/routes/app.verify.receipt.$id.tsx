import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleSlash, Info, ReceiptText, ServerCrash } from "lucide-react";

import { CredentialCard } from "@/components/product/credential-card";
import { StateView } from "@/components/product/state-view";
import { TrustSignal } from "@/components/product/trust-signal";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionQueries } from "@/features/verification/session-service";
import { TONE_CLASSES } from "@/lib/status";
import { cn } from "@/lib/utils";
import type {
  FinalTrustState,
  TrustReceiptViewModel,
  VerificationMethodResult,
} from "@/types/verification-session";
import type { TrustLevel } from "@/types/verification";

export const Route = createFileRoute("/app/verify/receipt/$id")({
  head: () => ({
    meta: [
      { title: "Trust receipt — Pramaan" },
      {
        name: "description",
        content:
          "What this verification established, what it did not, and the limits of the result.",
      },
      { property: "og:title", content: "Trust receipt — Pramaan" },
      {
        property: "og:description",
        content:
          "What this verification established, what it did not, and the limits of the result.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReceiptPage,
});

const FINAL_STATE_TONE: Record<FinalTrustState, keyof typeof TONE_CLASSES> = {
  final_verified: "success",
  identity_matched_only: "info",
  credential_valid_only: "warning",
  not_verified: "danger",
};

const FINAL_STATE_TRUST: Record<FinalTrustState, TrustLevel> = {
  // Only a live official response earns the strongest label.
  final_verified: "officially_confirmed",
  identity_matched_only: "verified",
  credential_valid_only: "provisional",
  not_verified: "unverified",
};

const OUTCOME_PRESENTATION: Record<
  VerificationMethodResult["outcome"],
  { label: string; tone: keyof typeof TONE_CLASSES }
> = {
  passed: { label: "Established", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  inconclusive: { label: "Inconclusive", tone: "warning" },
  not_performed: { label: "Not performed", tone: "neutral" },
};

function ReceiptPage() {
  const { id } = Route.useParams();
  const receipt = useQuery(sessionQueries.receipt(id));

  if (receipt.isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-4" aria-label="Loading receipt">
        <Skeleton className="h-9 w-2/3 rounded-md" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    );
  }

  if (receipt.isError || !receipt.data) {
    return (
      <StateView
        className="mx-auto max-w-xl"
        icon={ServerCrash}
        title="This receipt is no longer available"
        body="Receipts live only as long as their session on this device. Nothing was stored elsewhere."
        action={
          <Link
            to="/app/verify"
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface-strong px-4 text-body-sm font-medium text-foreground hover:bg-muted"
          >
            Start a new verification
          </Link>
        }
      />
    );
  }

  return <Receipt receipt={receipt.data} />;
}

function Receipt({ receipt }: { receipt: TrustReceiptViewModel }) {
  const tone = TONE_CLASSES[FINAL_STATE_TONE[receipt.finalState]];

  return (
    <article className="mx-auto max-w-2xl">
      <header>
        <p className="flex items-center gap-2 text-label uppercase text-foreground-subtle">
          <ReceiptText className="size-3.5" aria-hidden="true" />
          Trust receipt · {receipt.sessionId}
        </p>
        <h1 className="mt-1.5 font-display text-page-title text-foreground">{receipt.headline}</h1>
        <p className="mt-2 text-body text-foreground-muted">{receipt.summary}</p>
        <p className="mt-3 text-metadata text-foreground-subtle">
          Reference <span className="font-display tracking-wide">{receipt.credentialReference}</span>{" "}
          · {new Date(receipt.occurredAt).toLocaleString("en-IN")}
        </p>
      </header>

      <TrustSignal
        className="mt-6"
        signal={{
          level: FINAL_STATE_TRUST[receipt.finalState],
          label: receipt.headline,
          detail: receipt.summary,
        }}
      />

      {receipt.subject ? (
        <div className="mt-6">
          <CredentialCard credential={receipt.subject} status={receipt.status} />
        </div>
      ) : (
        <StateView
          className="mt-6"
          icon={CircleSlash}
          title="No credential record was resolved"
          body="This reference never produced a credential document, so there is no subject to show."
        />
      )}

      <section aria-label="What was checked" className="mt-8">
        <h2 className="font-display text-section-title text-foreground">What was checked</h2>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface-strong">
          {receipt.methods.map((method) => {
            const presentation = OUTCOME_PRESENTATION[method.outcome];
            return (
              <li key={method.id} className="px-4 py-3.5 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-body-sm font-semibold text-foreground">
                    {method.label}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-label uppercase",
                      TONE_CLASSES[presentation.tone].badge,
                    )}
                  >
                    {presentation.label}
                  </span>
                </div>
                <p className="mt-1 text-body-sm text-foreground-muted">{method.detail}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-label="Limits of this result"
        className={cn("mt-8 rounded-lg border bg-surface-strong p-4 sm:p-5", tone.ring)}
      >
        <h2 className="flex items-center gap-2 font-display text-card-title text-foreground">
          <Info className="size-4" aria-hidden="true" />
          What this receipt does not prove
        </h2>
        <ul className="mt-3 space-y-2">
          {receipt.limitations.map((limitation) => (
            <li key={limitation} className="flex gap-2.5 text-body-sm text-foreground-muted">
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-current" />
              {limitation}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
        <Link
          to="/app/verify"
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-body-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
        >
          Verify someone else
        </Link>
        <Link
          to="/app/activity"
          className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface-strong px-4 text-body-sm font-medium text-foreground hover:bg-muted"
        >
          See all activity
        </Link>
      </div>
    </article>
  );
}
