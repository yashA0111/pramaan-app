import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowUpRight,
  FilePlus2,
  MapPin,
  MessageSquareWarning,
  ScanLine,
  Siren,
} from "lucide-react";

import { CredentialStatusBadge } from "@/components/product/credential-status-badge";
import { StateView } from "@/components/product/state-view";
import { VerificationProgress } from "@/components/product/verification-progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DEMO_PROGRESS, verificationQueries } from "@/features/verification/mock-service";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Home — Pramaan" },
      {
        name: "description",
        content: "Verify an official, reach safety tools, and review recent verifications.",
      },
      { property: "og:title", content: "Home — Pramaan" },
      {
        property: "og:description",
        content: "Verify an official, reach safety tools, and review recent verifications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CitizenHome,
});

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const METHOD_LABELS = {
  qr: "QR scan",
  qr_face: "QR + face match",
  qr_official: "QR + official confirmation",
} as const;

function CitizenHome() {
  return (
    <div>
      <header>
        <p className="text-label uppercase text-foreground-subtle">Citizen session · demo</p>
        <h1 className="mt-2 font-display text-page-title text-foreground">{greeting()}, Ananya</h1>
      </header>

      <div className="mt-7 grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-10">
        {/* Primary column */}
        <div>
          <Link
            to="/app/verify"
            className="group flex items-center justify-between gap-4 rounded-xl bg-accent p-5 text-accent-foreground shadow-elev-2 transition-colors hover:bg-accent-strong"
          >
            <span className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent-foreground/12">
                <ScanLine className="size-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display text-card-title font-semibold">
                  Verify an official
                </span>
                <span className="mt-0.5 block text-body-sm opacity-85">
                  Scan a government credential QR code
                </span>
              </span>
            </span>
            <ArrowUpRight
              className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </Link>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <QuickTool to="/app/safety" icon={MessageSquareWarning} label="Scam check" />
            <QuickTool to="/app/safety" icon={MapPin} label="Police stations" />
            <QuickTool to="/app/safety" icon={FilePlus2} label="Report" />
          </div>

          <Link
            to="/app/safety"
            className="mt-4 flex min-h-14 items-center gap-3 rounded-xl border border-danger/35 bg-danger-soft/60 px-5 py-3.5 text-danger-soft-foreground transition-colors hover:bg-danger-soft"
          >
            <Siren className="size-5 shrink-0 text-danger" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-body-sm font-semibold">SOS — Emergency assistance</span>
              <span className="block text-metadata text-danger-soft-foreground/80">
                Press-and-hold activation inside · demo, no real dispatch
              </span>
            </span>
          </Link>
        </div>

        {/* Context column */}
        <div className="flex flex-col gap-4">
          <RecentVerification />

          <section
            aria-label="Last session pipeline"
            className="rounded-lg border border-border bg-surface-strong p-5 shadow-elev-1"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-label uppercase text-foreground-subtle">Session pipeline</h2>
              <span className="font-display text-[11px] tracking-[0.14em] text-foreground-subtle">
                {DEMO_PROGRESS.sessionId.toUpperCase()}
              </span>
            </div>
            <VerificationProgress steps={DEMO_PROGRESS.steps} compact className="mt-4" />
          </section>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-label uppercase text-foreground-subtle">Three kinds of sure</h2>
            <ul className="mt-3 space-y-2.5 text-body-sm text-foreground-muted">
              <li className="flex gap-2.5">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-success"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-medium text-foreground">Credential valid</strong> — the
                  document is authentic and current.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-success"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-medium text-foreground">Identity matched</strong> — the
                  person matches the credential.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-medium text-foreground">Officially confirmed</strong> —
                  the issuer affirmed it live.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickTool({ to, icon: Icon, label }: { to: string; icon: typeof MapPin; label: string }) {
  return (
    <Link
      to={to}
      className="flex min-h-20 flex-col items-start justify-between gap-2 rounded-lg border border-border bg-surface-strong p-3.5 shadow-elev-1 transition-colors hover:bg-muted"
    >
      <Icon className="size-5 text-foreground-muted" aria-hidden="true" />
      <span className="text-body-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}

function RecentVerification() {
  const recent = useQuery(verificationQueries.recent());

  return (
    <section
      aria-label="Most recent verification"
      className="rounded-lg border border-border bg-surface-strong p-5 shadow-elev-1"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-label uppercase text-foreground-subtle">Most recent verification</h2>
        <Link
          to="/app/activity"
          className="text-metadata font-medium text-accent transition-colors hover:text-accent-strong"
        >
          View activity
        </Link>
      </div>

      <div className="mt-4">
        {recent.isPending && (
          <div className="space-y-2.5" aria-label="Loading recent verification">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {recent.isError && (
          <StateView
            icon={ScanLine}
            title="Couldn't load activity"
            body="Check your connection and try again."
            className="border-none bg-transparent py-6"
            action={
              <button
                type="button"
                onClick={() => recent.refetch()}
                className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-body-sm font-medium text-foreground hover:bg-muted"
              >
                Retry
              </button>
            }
          />
        )}

        {recent.data && (
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="font-display text-card-title text-foreground">
                {recent.data.subjectName}
              </p>
              <CredentialStatusBadge status={recent.data.outcome} />
            </div>
            <p className="mt-1 text-body-sm text-foreground-muted">
              {recent.data.subjectDesignation} · {METHOD_LABELS[recent.data.method]}
            </p>
            <p className="mt-1.5 text-metadata text-foreground-subtle">
              {formatDistanceToNow(new Date(recent.data.occurredAt), { addSuffix: true })} · session{" "}
              <span className="font-display tracking-wide">{recent.data.sessionId}</span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
