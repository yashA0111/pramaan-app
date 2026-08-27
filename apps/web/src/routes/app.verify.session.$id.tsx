import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clock3, ServerCrash } from "lucide-react";

import { StateView } from "@/components/product/state-view";
import { VerificationProgress } from "@/components/product/verification-progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CredentialResult } from "@/features/verification/components/credential-result";
import { IdentityPanel } from "@/features/verification/components/identity-panel";
import { OfficialConfirmationPanel } from "@/features/verification/components/official-confirmation-panel";
import { useVerificationFlow } from "@/features/verification/use-verification-flow";
import type { VerificationSession } from "@/types/verification-session";

export const Route = createFileRoute("/app/verify/session/$id")({
  head: () => ({
    meta: [
      { title: "Verification in progress — Pramaan" },
      {
        name: "description",
        content:
          "Follow a live verification: credential validation, identity match, and official confirmation.",
      },
      { property: "og:title", content: "Verification in progress — Pramaan" },
      {
        property: "og:description",
        content:
          "Follow a live verification: credential validation, identity match, and official confirmation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SessionPage,
});

/** States where nothing more can happen in this session. */
const TERMINAL: VerificationSession["state"][] = [
  "credential_failed",
  "identity_failed",
  "confirmation_resolved",
  "confirmation_failed",
  "final_verified",
  "service_unavailable",
];

function SessionPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const flow = useVerificationFlow(id);
  const session = flow.session;

  const handleSkipConfirmation = () => {
    flow.skipConfirmation.mutate(undefined, {
      onSuccess: () => {
        void navigate({
          to: "/app/verify/receipt/$id",
          params: { id },
        });
      },
    });
  };

  if (flow.query.isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-label="Loading session">
        <Skeleton className="h-9 w-2/3 rounded-md" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (flow.query.isError || !session) {
    return (
      <StateView
        className="mx-auto max-w-xl"
        icon={ServerCrash}
        title="This session could not be opened"
        body="Verification sessions are short-lived and held only for this device. Start a new one."
        action={<StartOverLink />}
      />
    );
  }

  if (session.state === "session_expired") {
    return (
      <StateView
        className="mx-auto max-w-xl"
        icon={Clock3}
        title="This session expired"
        body={
          session.error?.message ??
          "Sessions expire quickly by design. Nothing from this session was verified."
        }
        action={<StartOverLink />}
      />
    );
  }

  const identityAvailable = session.credentialOutcome === "valid";
  const identitySettled =
    session.identity?.matchResult === "match" || session.identity?.matchResult === "mismatch";
  const confirmationAvailable = session.identity !== null && session.identity.status !== "matching";
  const terminal = TERMINAL.includes(session.state);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] lg:gap-10">
      <div className="min-w-0 space-y-8">
        <header>
          <p className="text-label uppercase text-foreground-subtle">
            Session <span className="font-display tracking-wide">{session.sessionId}</span>
            {session.demo && " · demo reference"}
          </p>
          <h1 className="mt-1 font-display text-page-title text-foreground">
            Verifying {session.credentialReference}
          </h1>
          <p className="mt-2 max-w-prose text-body text-foreground-muted">
            Each stage below establishes one thing only. Nothing later is assumed from anything
            earlier.
          </p>
        </header>

        <CredentialResult session={session} />

        {identityAvailable && (
          <IdentityPanel
            result={session.identity}
            busy={flow.identity.isPending}
            disabled={session.state === "validating"}
            onVerify={(input) => flow.identity.mutate(input)}
          />
        )}

        {identityAvailable && (
          <OfficialConfirmationPanel
            confirmation={session.confirmation}
            available={confirmationAvailable}
            polling={flow.isPolling}
            requesting={flow.requestConfirmation.isPending}
            skipping={flow.skipConfirmation.isPending}
            onRequest={() => flow.requestConfirmation.mutate()}
            onSkip={handleSkipConfirmation}
          />
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
          {(terminal || identitySettled) && (
            <Link
              to="/app/verify/receipt/$id"
              params={{ id: session.sessionId }}
              className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-body-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
            >
              View trust receipt
            </Link>
          )}
          <StartOverLink quiet />
        </div>
      </div>

      <aside
        aria-label="Verification progress"
        className="h-fit rounded-lg border border-border bg-surface-strong p-5 shadow-elev-1 lg:sticky lg:top-6"
      >
        <h2 className="text-label uppercase text-foreground-subtle">Pipeline</h2>
        <VerificationProgress steps={session.steps} compact className="mt-4" />
        <p className="mt-4 border-t border-border pt-3 text-metadata text-foreground-subtle">
          Session expires {new Date(session.expiresAt).toLocaleTimeString("en-IN")}.
        </p>
      </aside>
    </div>
  );
}

function StartOverLink({ quiet = false }: { quiet?: boolean }) {
  return (
    <Link
      to="/app/verify"
      className={
        quiet
          ? "text-body-sm font-medium text-foreground-muted underline decoration-border-strong underline-offset-4 hover:text-foreground"
          : "inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface-strong px-4 text-body-sm font-medium text-foreground hover:bg-muted"
      }
    >
      Start a new verification
    </Link>
  );
}
