import { Landmark } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CredentialSummary, VerificationStatus } from "@/types/verification";

import { CredentialStatusBadge } from "./credential-status-badge";

interface CredentialCardProps {
  credential: CredentialSummary;
  /** Current verification state of this credential in the active session. */
  status?: VerificationStatus | undefined;
  className?: string;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * A government credential rendered as a digital document — evidence
 * artifact, not a payment card. Hierarchy: identity → designation →
 * provenance → identifiers → verification state.
 */
export function CredentialCard({ credential, status, className }: CredentialCardProps) {
  return (
    <article
      aria-label={`Credential for ${credential.fullName}`}
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-surface-strong shadow-elev-1",
        className,
      )}
    >
      {/* vermilion document spine */}
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-accent" />

      <header className="flex items-center justify-between gap-3 border-b border-border py-2.5 pl-5 pr-4">
        <p className="flex min-w-0 items-center gap-1.5 text-label uppercase text-foreground-muted">
          <Landmark className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Official Government Credential</span>
        </p>
        {status && <CredentialStatusBadge status={status} />}
      </header>

      <div className="flex gap-4 pl-5 pr-4 pt-4">
        <img
          src={credential.photoUrl}
          alt={credential.photoAlt}
          width={640}
          height={768}
          loading="lazy"
          className="aspect-[5/6] w-20 shrink-0 rounded-md border border-border object-cover"
        />
        <div className="min-w-0">
          <h3 className="font-display text-card-title text-foreground">{credential.fullName}</h3>
          <p className="mt-0.5 text-body-sm font-medium text-foreground">
            {credential.designation}
          </p>
          <p className="text-body-sm text-foreground-muted">{credential.department}</p>
          <p className="mt-1 text-metadata text-foreground-subtle">{credential.posting}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4">
        <CredentialField label="Official ID" value={credential.credentialId} mono />
        <CredentialField label="Status" value={registryLabel(credential)} />
        <CredentialField label="Issued" value={formatDate(credential.issuedOn)} />
        <CredentialField label="Valid until" value={formatDate(credential.validUntil)} />
      </dl>

      <footer className="border-t border-border px-5 py-3">
        <p className="text-metadata text-foreground-muted">
          Issued by {credential.issuer.name} — {credential.issuer.authority}
        </p>
        <p className="mt-1 text-metadata text-foreground-subtle">
          Digital verification record.
        </p>
      </footer>
    </article>
  );
}

function registryLabel(credential: CredentialSummary): string {
  switch (credential.registryStatus) {
    case "active":
      return "Active";
    case "expired":
      return "Expired";
    case "revoked":
      return "Revoked";
    case "unknown":
      return "Not found";
  }
}

function CredentialField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-label uppercase text-foreground-subtle">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-foreground",
          mono ? "font-display text-credential tracking-wide" : "text-body-sm",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
