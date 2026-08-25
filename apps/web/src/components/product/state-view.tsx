import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface StateViewProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

/** Shared empty / error / unavailable presentation — one vocabulary everywhere. */
export function StateView({ icon: Icon, title, body, action, className }: StateViewProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed border-border-strong bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full border border-border bg-surface-muted">
        <Icon className="size-5 text-foreground-muted" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-card-title font-semibold text-foreground">{title}</h2>
      {body && <p className="mt-1.5 max-w-sm text-body-sm text-foreground-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
