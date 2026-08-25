import { FileSearch } from "lucide-react";

import { CredentialStatusBadge } from "@/components/product/credential-status-badge";
import { StateView } from "@/components/product/state-view";
import { CredentialReveal } from "@/components/showcase/credential-reveal";
import { cn } from "@/lib/utils";
import type { VerificationSession } from "@/types/verification-session";

interface CredentialResultProps {
  session: VerificationSession;
  className?: string;
}

const OUTCOME_COPY: Record<
  VerificationSession["credentialOutcome"],
  { title: string; body: string } | null
> = {
  unknown: null,
  valid: {
    title: "Credential evidence",
    body: "The credential itself passed registry validation. This is evidence about the document — not yet about the person holding it.",
  },
  invalid: {
    title: "Credential did not validate",
    body: "The signature on this credential could not be verified. Treat the document as unproven.",
  },
  expired: {
    title: "Credential has expired",
    body: "This credential exists in the registry, but its validity period has ended.",
  },
  revoked: {
    title: "Credential was revoked",
    body: "The issuing authority withdrew this credential. It must not be accepted.",
  },
  unavailable: {
    title: "Credential could not be checked",
    body: "The registry did not answer. Nothing about this credential has been established either way.",
  },
};

/**
 * The credential leg presented as evidence. Uses the Phase-A credential
 * document; failures are stated in words, not implied by color alone.
 */
export function CredentialResult({ session, className }: CredentialResultProps) {
  const copy = OUTCOME_COPY[session.credentialOutcome];
  if (!copy) return null;

  const failedCheck = session.checks.find((check) => check.state === "failure");

  return (
    <section aria-label="Credential result" className={cn("min-w-0", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
        <h2 className="font-display text-section-title text-foreground">{copy.title}</h2>
        <CredentialStatusBadge status={session.credentialStatus} />
      </div>
      <p className="mt-1.5 max-w-prose text-body-sm text-foreground-muted">{copy.body}</p>

      <div className="mt-5">
        {session.credential ? (
          <CredentialReveal
            credential={session.credential}
            status={session.credentialStatus}
            replayKey={session.checks.length}
          />
        ) : (
          <StateView
            icon={FileSearch}
            title="No credential document to show"
            body={
              failedCheck?.detail ??
              "The reference did not resolve to a credential record in the registry."
            }
          />
        )}
      </div>

      {failedCheck && session.credential && (
        <p className="mt-3 rounded-md border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-body-sm text-danger-soft-foreground">
          {failedCheck.label}: {failedCheck.detail}
        </p>
      )}
    </section>
  );
}
