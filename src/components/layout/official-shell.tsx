import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { PramaanMark } from "@/components/pramaan-mark";

/**
 * Minimal official-side shell. Same product family, but the chrome makes
 * the different role obvious: inverted ink header, console framing.
 */
export function OfficialShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
          <Link
            to="/official"
            className="flex items-center gap-2.5"
            aria-label="Pramaan official console"
          >
            <PramaanMark className="size-6 [&_rect]:stroke-primary-foreground" />
            <span className="font-display text-body-sm font-semibold tracking-tight">
              Pramaan <span className="font-normal opacity-70">· Official console</span>
            </span>
          </Link>
          <span className="rounded-full border border-primary-foreground/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] opacity-80">
            Demo
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:py-12">{children}</main>
    </div>
  );
}
