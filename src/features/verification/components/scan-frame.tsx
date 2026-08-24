import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface ScanFrameProps {
  /** Active scanning shows the sweep; a detected code freezes it. */
  scanning: boolean;
  detected?: boolean;
  guidance: string;
}

/**
 * Scanning frame: four brackets and a single restrained sweep. No HUD,
 * no reticles, no glow — the camera is the subject.
 */
export function ScanFrame({ scanning, detected = false, guidance }: ScanFrameProps) {
  const reduced = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "relative aspect-square w-[68%] max-w-72 rounded-md transition-colors duration-300",
            detected ? "bg-success/10" : "bg-transparent",
          )}
        >
          {(["tl", "tr", "bl", "br"] as const).map((corner) => (
            <span
              key={corner}
              aria-hidden="true"
              className={cn(
                "absolute size-8 border-background/85 transition-colors duration-300",
                detected && "border-success",
                corner === "tl" && "left-0 top-0 rounded-tl-md border-l-2 border-t-2",
                corner === "tr" && "right-0 top-0 rounded-tr-md border-r-2 border-t-2",
                corner === "bl" && "bottom-0 left-0 rounded-bl-md border-b-2 border-l-2",
                corner === "br" && "bottom-0 right-0 rounded-br-md border-b-2 border-r-2",
              )}
            />
          ))}

          {scanning && !detected && !reduced && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-x-2 h-px bg-accent/80"
              initial={{ top: "8%", opacity: 0 }}
              animate={{ top: ["8%", "92%", "8%"], opacity: [0, 1, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
      </div>

      <p
        aria-live="polite"
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent px-6 pb-5 pt-10 text-center text-body-sm text-background"
      >
        {guidance}
      </p>
    </div>
  );
}
