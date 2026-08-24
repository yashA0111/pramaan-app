import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";

import { CredentialStatusBadge } from "@/components/product/credential-status-badge";
import { StateView } from "@/components/product/state-view";
import { Skeleton } from "@/components/ui/skeleton";
import { verificationQueries } from "@/features/verification/mock-service";

export const Route = createFileRoute("/app/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Pramaan" },
      { name: "description", content: "Your verification history and session states." },
      { property: "og:title", content: "Activity — Pramaan" },
      { property: "og:description", content: "Your verification history and session states." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ActivityPage,
});

const METHOD_LABELS = {
  qr: "QR scan",
  qr_face: "QR + face match",
  qr_official: "QR + official confirmation",
} as const;

function ActivityPage() {
  const recent = useQuery(verificationQueries.recent());

  return (
    <div className="max-w-xl">
      <header>
        <h1 className="font-display text-page-title text-foreground">Activity</h1>
        <p className="mt-2 text-body text-foreground-muted">
          Every verification leaves a receipt. Nothing is verified quietly.
        </p>
      </header>

      <div className="mt-7">
        {recent.isPending && (
          <div className="space-y-3" aria-label="Loading activity">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        )}

        {recent.isError && (
          <StateView
            icon={History}
            title="Couldn't load activity"
            body="Check your connection and try again."
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
          <ul className="space-y-3">
            <li className="rounded-lg border border-border bg-surface-strong p-4 shadow-elev-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-card-title text-foreground">
                  {recent.data.subjectName}
                </p>
                <CredentialStatusBadge status={recent.data.outcome} />
              </div>
              <p className="mt-1 text-body-sm text-foreground-muted">
                {recent.data.subjectDesignation} · {METHOD_LABELS[recent.data.method]}
              </p>
              <p className="mt-2 text-metadata text-foreground-subtle">
                {formatDistanceToNow(new Date(recent.data.occurredAt), { addSuffix: true })} ·
                session <span className="font-display tracking-wide">{recent.data.sessionId}</span>
              </p>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
