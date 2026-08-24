import { Check, Minus, X } from "lucide-react";

import { STAGE_STATE, TONE_CLASSES } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { VerificationStepModel } from "@/types/verification";

interface VerificationProgressProps {
  steps: VerificationStepModel[];
  /** Compact hides detail text — used in dense panels. */
  compact?: boolean;
  className?: string;
}

/**
 * The verification cascade: SCAN → VALIDATE → RESOLVE → ISSUER → STATUS →
 * MATCH → CONFIRM → RECEIPT. Renders exactly the states it is given; it
 * never assumes a later step succeeded.
 */
export function VerificationProgress({
  steps,
  compact = false,
  className,
}: VerificationProgressProps) {
  return (
    <ol aria-label="Verification progress" className={cn("flex flex-col", className)}>
      {steps.map((step, index) => (
        <VerificationStep
          key={step.id}
          step={step}
          isLast={index === steps.length - 1}
          compact={compact}
        />
      ))}
    </ol>
  );
}

function VerificationStep({
  step,
  isLast,
  compact,
}: {
  step: VerificationStepModel;
  isLast: boolean;
  compact: boolean;
}) {
  const state = STAGE_STATE[step.state];
  const tone = TONE_CLASSES[state.tone];

  return (
    <li
      className="relative flex gap-3"
      aria-current={step.state === "current" ? "step" : undefined}
    >
      {/* connector */}
      {!isLast && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px",
            step.state === "success" ? "bg-success/40" : "bg-border",
          )}
        />
      )}

      <StepNode state={step.state} />

      <div className={cn("min-w-0 pb-5", isLast && "pb-0")}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "text-body-sm font-medium leading-6",
              step.state === "pending" || step.state === "skipped"
                ? "text-foreground-subtle"
                : "text-foreground",
            )}
          >
            {step.label}
          </span>
          {!compact && (
            <span
              className={cn(
                "text-metadata",
                tone.icon === "text-muted-foreground" ? "text-foreground-subtle" : tone.icon,
              )}
            >
              {state.label}
            </span>
          )}
        </div>
        {!compact && step.detail && (
          <p className="mt-0.5 text-metadata text-foreground-muted">{step.detail}</p>
        )}
      </div>
    </li>
  );
}

function StepNode({ state }: { state: VerificationStepModel["state"] }) {
  const tone = TONE_CLASSES[STAGE_STATE[state].tone];

  const base =
    "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-surface-strong";

  if (state === "success") {
    return (
      <span className={cn(base, "border-success/40 bg-success-soft")}>
        <Check className="size-3.5 text-success" strokeWidth={2.5} aria-hidden="true" />
      </span>
    );
  }
  if (state === "failure") {
    return (
      <span className={cn(base, "border-danger/40 bg-danger-soft")}>
        <X className="size-3.5 text-danger" strokeWidth={2.5} aria-hidden="true" />
      </span>
    );
  }
  if (state === "warning") {
    return (
      <span className={cn(base, "border-warning/40 bg-warning-soft")}>
        <Minus className="size-3.5 text-warning" strokeWidth={2.5} aria-hidden="true" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className={cn(base, tone.ring)}>
        <span
          className="size-2 rounded-full bg-accent motion-safe:animate-pulse"
          aria-hidden="true"
        />
        <span className="sr-only">In progress</span>
      </span>
    );
  }
  if (state === "skipped") {
    return (
      <span className={cn(base, "border-border")}>
        <Minus className="size-3.5 text-foreground-subtle" aria-hidden="true" />
      </span>
    );
  }
  // pending
  return <span className={cn(base, "border-border")} aria-hidden="true" />;
}
