import { motion, useReducedMotion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * EvidenceToTrustHero — the product thesis rendered as one artifact.
 *
 *   01 EVIDENCE      raw credential payload
 *   02 VERIFICATION  ordered checks resolve
 *   03 TRUST         sealed credential + receipt
 *
 * Composed as a single vertical ledger sheet so it holds its proportions
 * from 360px to 1440px: no fixed-width panels, no truncated captions.
 * The sequence plays once (~3.2s) then holds. Reduced motion renders the
 * resolved state immediately.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/* deterministic QR-like evidence pattern */
const EVIDENCE_CELLS = Array.from({ length: 49 }, (_, i) => {
  const n = (i * 37 + 11) % 9;
  return n === 0 || n === 2 || n === 5 || n === 7;
});

const RAIL_CHECKS = [
  { label: "Validate", detail: "Signature well-formed", at: 1.0 },
  { label: "Issuer", detail: "Authority recognized", at: 1.3 },
  { label: "Status", detail: "Active · not revoked", at: 1.6 },
  { label: "Match", detail: "Identity compared", at: 1.9 },
] as const;

const FIELD_DELAY = 2.25;
const SEAL_DELAY = 2.75;
const PILL_DELAY = 2.95;

export function EvidenceToTrustHero({ className }: { className?: string }) {
  const reduced = useReducedMotion() ?? false;
  const [cycle, setCycle] = useState(0);

  const d = (seconds: number) => (reduced ? 0 : seconds);

  return (
    <figure className={cn("relative m-0", className)}>
      <div
        key={cycle}
        className="overflow-hidden rounded-xl border border-border bg-surface-strong shadow-elev-2"
      >
        {/* sheet header — reads as a document, not a card */}
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5 sm:px-5">
          <p className="truncate text-label uppercase text-foreground-muted">
            Verification sheet · demo session
          </p>
          <span className="shrink-0 font-display text-[11px] tracking-[0.14em] text-foreground-subtle">
            SES_9F42KDL1
          </span>
        </div>

        <div aria-hidden="true" className="divide-y divide-border">
          {/* 01 — Evidence */}
          <Stage index="01" title="Evidence" detail="Raw QR payload">
            <div className="flex items-center gap-4">
              <div className="grid w-24 shrink-0 grid-cols-7 gap-[3px] rounded-md border border-border bg-background p-2 sm:w-28">
                {EVIDENCE_CELLS.map((filled, i) => (
                  <motion.span
                    key={i}
                    className={cn(
                      "aspect-square rounded-[1.5px]",
                      filled ? "bg-foreground" : "bg-border/60",
                    )}
                    initial={reduced ? false : { opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: d(0.06 + i * 0.012), duration: 0.22, ease: "easeOut" }}
                  />
                ))}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                {["82%", "64%", "46%"].map((w, i) => (
                  <motion.span
                    key={w}
                    className="block h-1.5 rounded-full bg-border-strong/70"
                    style={{ width: w }}
                    initial={reduced ? false : { opacity: 0, scaleX: 0.3, originX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: d(0.45 + i * 0.08), duration: 0.35, ease: EASE }}
                  />
                ))}
                <motion.p
                  className="pt-1 font-display text-[11px] tracking-[0.12em] text-foreground-subtle"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: d(0.7), duration: 0.3 }}
                >
                  PRM·DL·QR·v2
                </motion.p>
              </div>
            </div>
          </Stage>

          {/* 02 — Verification */}
          <Stage index="02" title="Verification" detail="Ordered checks">
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {RAIL_CHECKS.map((check) => (
                <li key={check.label} className="flex items-start gap-2.5">
                  <motion.span
                    className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border"
                    initial={
                      reduced
                        ? false
                        : {
                            borderColor: "var(--color-border-strong)",
                            backgroundColor: "transparent",
                          }
                    }
                    animate={{
                      borderColor: "color-mix(in oklab, var(--color-success) 45%, transparent)",
                      backgroundColor: "var(--color-success-soft)",
                    }}
                    transition={{ delay: d(check.at), duration: 0.3 }}
                  >
                    <motion.svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="size-2.5 text-success"
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: d(check.at + 0.08), duration: 0.2 }}
                    >
                      <path
                        d="M5.5 12.5l4 4 9-9.5"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  </motion.span>
                  <div className="min-w-0">
                    <motion.p
                      className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground"
                      initial={reduced ? false : { opacity: 0.25 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: d(check.at), duration: 0.25 }}
                    >
                      {check.label}
                    </motion.p>
                    <motion.p
                      className="text-[11px] leading-4 text-foreground-subtle"
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: d(check.at + 0.1), duration: 0.25 }}
                    >
                      {check.detail}
                    </motion.p>
                  </div>
                </li>
              ))}
            </ul>
          </Stage>

          {/* 03 — Trust */}
          <Stage index="03" title="Trust" detail="Sealed + receipt">
            <div className="relative rounded-lg border border-border bg-background">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-accent"
              />
              <div className="flex items-center gap-3 py-3 pl-5 pr-4">
                <motion.span
                  className="block aspect-[5/6] w-11 shrink-0 rounded-[4px] border border-border bg-surface-muted"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: d(FIELD_DELAY), duration: 0.3 }}
                />
                <div className="min-w-0 flex-1">
                  {["88%", "58%"].map((w, i) => (
                    <motion.span
                      key={w}
                      className="mb-1.5 block h-2 rounded-full bg-foreground/80 last:mb-0 last:bg-foreground-subtle/60"
                      style={{ width: w }}
                      initial={reduced ? false : { opacity: 0, scaleX: 0.4, originX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{
                        delay: d(FIELD_DELAY + 0.1 + i * 0.09),
                        duration: 0.3,
                        ease: EASE,
                      }}
                    />
                  ))}
                  <motion.span
                    className="mt-2 block h-1.5 w-3/5 rounded-full bg-foreground-subtle/40"
                    initial={reduced ? false : { opacity: 0, scaleX: 0.4, originX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: d(FIELD_DELAY + 0.3), duration: 0.3, ease: EASE }}
                  />
                </div>
                {/* seal stamp */}
                <motion.span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-success/40 bg-success text-success-foreground"
                  initial={reduced ? false : { scale: 1.7, opacity: 0, rotate: -14 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ delay: d(SEAL_DELAY), type: "spring", stiffness: 380, damping: 16 }}
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
                      transition={{ delay: d(SEAL_DELAY + 0.15), duration: 0.35, ease: "easeOut" }}
                    />
                  </svg>
                </motion.span>
              </div>
              <motion.div
                className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2 pl-5 pr-4"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: d(FIELD_DELAY + 0.35), duration: 0.3 }}
              >
                <span className="font-display text-[11px] font-medium tracking-[0.14em] text-foreground-muted">
                  PRM-DL-2024-018457
                </span>
                <motion.span
                  className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-success-soft-foreground"
                  initial={reduced ? false : { opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: d(PILL_DELAY), duration: 0.25 }}
                >
                  Verified
                </motion.span>
              </motion.div>
            </div>
          </Stage>
        </div>
      </div>

      <figcaption className="mt-3 flex items-center justify-between gap-3">
        <p className="text-metadata text-foreground-subtle">
          Illustration of the verification pipeline. Synthetic data.
        </p>
        {!reduced && (
          <button
            type="button"
            onClick={() => setCycle((c) => c + 1)}
            className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-metadata font-medium text-foreground-muted transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Replay
          </button>
        )}
      </figcaption>
    </figure>
  );
}

function Stage({
  index,
  title,
  detail,
  children,
}: {
  index: string;
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3 px-4 py-4 sm:grid-cols-[92px_minmax(0,1fr)] sm:gap-5 sm:px-5 sm:py-5">
      <div className="min-w-0">
        <p className="font-display text-[11px] font-semibold tracking-[0.16em] text-accent">
          {index}
        </p>
        <p className="mt-0.5 font-display text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground">
          {title}
        </p>
        <p className="mt-0.5 hidden text-[11px] leading-4 text-foreground-subtle sm:block">
          {detail}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
