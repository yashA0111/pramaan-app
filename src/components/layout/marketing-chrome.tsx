import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { PramaanMark } from "@/components/pramaan-mark";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Pramaan home">
          <PramaanMark className="size-7" />
          <span className="font-display text-card-title font-semibold tracking-tight">Pramaan</span>
        </Link>

        <nav aria-label="Marketing" className="flex items-center gap-1 md:gap-2">
          <a
            href="#how-it-works"
            className="hidden min-h-11 items-center rounded-md px-3 text-body-sm font-medium text-foreground-muted transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
          >
            How it works
          </a>
          <Link
            to="/official"
            className="hidden min-h-11 items-center rounded-md px-3 text-body-sm font-medium text-foreground-muted transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
          >
            Official console
          </Link>
          <Link
            to="/app"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-primary px-4 text-body-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open the app
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-2.5">
          <PramaanMark className="size-5" />
          <p className="text-body-sm font-medium text-foreground">Pramaan</p>
          <p className="text-body-sm text-foreground-subtle">— evidence becomes trust.</p>
        </div>
        <p className="text-metadata text-foreground-subtle">
          Demonstration build. All identities, credentials, and registries are synthetic.
        </p>
      </div>
    </footer>
  );
}
