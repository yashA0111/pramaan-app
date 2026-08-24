import { BadgeCheck, CircleAlert, CircleDashed, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TrustSignalViewModel } from "@/types/verification";

const LEVEL_PRESENTATION = {
  officially_confirmed: {
    icon: BadgeCheck,
    classes: "border-success/35 bg-success-soft text-success-soft-foreground",
    iconClasses: "text-success",
  },
  verified: {
    icon: ShieldCheck,
    classes: "border-success/35 bg-success-soft text-success-soft-foreground",
    iconClasses: "text-success",
  },
  provisional: {
    icon: CircleDashed,
    classes: "border-warning/35 bg-warning-soft text-warning-soft-foreground",
    iconClasses: "text-warning",
  },
  unverified: {
    icon: CircleAlert,
    classes: "border-border bg-muted text-foreground-muted",
    iconClasses: "text-foreground-subtle",
  },
} as const;

interface TrustSignalProps {
  signal: TrustSignalViewModel;
  className?: string;
}

/**
 * Compact provenance row: how much trust this view carries and why.
 * Distinguishes verified / matched / officially confirmed explicitly.
 */
export function TrustSignal({ signal, className }: TrustSignalProps) {
  const presentation = LEVEL_PRESENTATION[signal.level];
  const Icon = presentation.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3.5 py-3",
        presentation.classes,
        className,
      )}
    >
      <Icon
        className={cn("mt-0.5 size-4.5 shrink-0", presentation.iconClasses)}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-body-sm font-semibold leading-5">{signal.label}</p>
        <p className="mt-0.5 text-metadata leading-4 opacity-90">{signal.detail}</p>
      </div>
    </div>
  );
}
