import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, MessageSquareWarning, Siren } from "lucide-react";

export const Route = createFileRoute("/app/safety/")({ component: SafetyHub });

function SafetyHub() {
  return (
    <div className="max-w-3xl">
      <header className="max-w-xl">
        <p className="text-label uppercase text-foreground-subtle">Understand - Assess - Act</p>
        <h1 className="mt-2 font-display text-page-title text-foreground">Safety tools</h1>
        <p className="mt-2 text-body text-foreground-muted">
          Practical support for the moment after verification. Start with the action you need, and see exactly what this demo can and cannot do.
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-[1.25fr_1fr]" aria-label="Priority safety actions">
        <Link to="/app/safety/sos" className="group rounded-lg border border-danger/30 bg-danger-soft p-5 shadow-elev-1 transition-colors hover:border-danger/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-11 items-center justify-center rounded-md bg-danger text-danger-foreground"><Siren className="size-5" aria-hidden="true" /></span>
          <p className="mt-8 text-label uppercase text-danger-soft-foreground">Priority action</p>
          <h2 className="mt-1 font-display text-section-title text-foreground">Simulated SOS</h2>
          <p className="mt-2 max-w-sm text-body-sm text-foreground-muted">Press and hold to begin a cancellable emergency request demonstration.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-body-sm font-semibold text-danger-soft-foreground">Open SOS <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
        </Link>

        <Link to="/app/safety/police" className="group rounded-lg border border-border bg-surface-strong p-5 shadow-elev-1 transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-11 items-center justify-center rounded-md bg-muted text-foreground-muted"><MapPin className="size-5" aria-hidden="true" /></span>
          <h2 className="mt-8 font-display text-section-title text-foreground">Nearby police</h2>
          <p className="mt-2 text-body-sm text-foreground-muted">Find synthetic station information using your location permission.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-body-sm font-semibold text-foreground">Find a station <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
        </Link>
      </section>

      <section className="mt-10 border-t border-border pt-6" aria-labelledby="next-stage-title">
        <h2 id="next-stage-title" className="text-label uppercase text-foreground-subtle">Next stage</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 border border-dashed border-border-strong p-4"><MessageSquareWarning className="mt-0.5 size-5 shrink-0 text-foreground-subtle" aria-hidden="true" /><div><h3 className="text-body-sm font-semibold text-foreground">Scam check</h3><p className="mt-1 text-body-sm text-foreground-muted">Message analysis is not part of this foundation.</p></div></div>
          <div className="flex gap-3 border border-dashed border-border-strong p-4"><Siren className="mt-0.5 size-5 shrink-0 text-foreground-subtle" aria-hidden="true" /><div><h3 className="text-body-sm font-semibold text-foreground">Report an incident</h3><p className="mt-1 text-body-sm text-foreground-muted">Structured reporting will arrive in a later stage.</p></div></div>
        </div>
      </section>
    </div>
  );
}
