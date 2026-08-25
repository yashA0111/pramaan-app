import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { CredentialCard } from "@/components/product/credential-card";
import { cn } from "@/lib/utils";
import type { CredentialSummary, VerificationStatus } from "@/types/verification";

interface CredentialRevealProps {
  credential: CredentialSummary;
  status?: VerificationStatus;
  /** Restart the reveal (e.g. a replay control increments this). */
  replayKey?: number;
  className?: string;
}

/**
 * Information resolving into a trusted credential: the document starts
 * unfocused, a scan pass sweeps it, the content sharpens, and the
 * verification seal stamps last. Reduced motion renders the final state.
 */
export function CredentialReveal({
  credential,
  status,
  replayKey = 0,
  className,
}: CredentialRevealProps) {
  const reduced = useReducedMotion();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    setSettled(false);
    if (reduced) {
      setSettled(true);
      return;
    }
    const timer = setTimeout(() => setSettled(true), 2400);
    return () => clearTimeout(timer);
  }, [replayKey, reduced]);

  const t = (seconds: number) => (reduced ? 0 : seconds);

  return (
    <div key={replayKey} className={cn("relative", className)}>
      <motion.div
        initial={reduced ? false : { opacity: 0.35, filter: "blur(7px)", y: 6 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.9, delay: t(0.55), ease: [0.16, 1, 0.3, 1] }}
      >
        <CredentialCard credential={credential} status={settled ? status : undefined} />
      </motion.div>

      {/* scan pass */}
      {!reduced && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-accent/15 to-transparent"
          initial={{ y: "-30%", opacity: 0 }}
          animate={{ y: ["0%", "900%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.1, delay: 0.35, ease: "easeInOut" }}
        />
      )}

      {/* seal stamp */}
      <motion.span
        aria-hidden="true"
        className="absolute -right-2 -top-2 flex size-9 items-center justify-center rounded-full border border-success/40 bg-success text-success-foreground shadow-elev-2"
        initial={reduced ? false : { scale: 1.6, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: t(1.7), type: "spring", stiffness: 380, damping: 17 }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-4.5">
          <motion.path
            d="M6 12.5l4 4L18 7.5"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: t(1.85), duration: 0.35, ease: "easeOut" }}
          />
        </svg>
      </motion.span>
    </div>
  );
}
