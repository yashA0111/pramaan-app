import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "primary" | "secondary" | "quiet";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  busy?: boolean;
  children: ReactNode;
}

const TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-accent text-accent-foreground hover:bg-accent-strong",
  secondary:
    "border border-border-strong bg-surface-strong text-foreground hover:bg-muted",
  quiet:
    "text-foreground-muted underline decoration-border-strong underline-offset-4 hover:text-foreground",
};

/**
 * The single action affordance for the verification flow. Thumb-safe height,
 * one tone vocabulary, no gradients.
 */
export function ActionButton({
  tone = "primary",
  busy = false,
  children,
  className,
  disabled,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled ?? busy}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-body-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    >
      {busy && <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
