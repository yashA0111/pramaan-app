import { cn } from "@/lib/utils";

/**
 * Pramaan mark — a credential square sealed with a vermilion check.
 * Evidence (the document) becoming trust (the seal).
 */
export function PramaanMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("size-6", className)} aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4.5"
        className="stroke-foreground"
        strokeWidth="2"
      />
      <path
        d="M8 12.4l2.7 2.7L16.3 9"
        className="stroke-accent"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
