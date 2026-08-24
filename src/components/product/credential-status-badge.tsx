import { VERIFICATION_STATUS, TONE_CLASSES } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/types/verification";

interface CredentialStatusBadgeProps {
  status: VerificationStatus;
  className?: string;
}

/**
 * Pill badge for any verification lifecycle state. Label + icon + tone —
 * color is never the only signal.
 */
export function CredentialStatusBadge({ status, className }: CredentialStatusBadgeProps) {
  const descriptor = VERIFICATION_STATUS[status];
  const tone = TONE_CLASSES[descriptor.tone];
  const Icon = descriptor.icon;

  return (
    <span
      role="status"
      aria-label={`Status: ${descriptor.label}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-label uppercase",
        tone.badge,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" strokeWidth={2.25} />
      {descriptor.label}
    </span>
  );
}
