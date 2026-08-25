import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";

import { CredentialStatusBadge } from "@/components/product/credential-status-badge";
import { StateView } from "@/components/product/state-view";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionQueries } from "@/features/verification/session-service";

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
  const history = useQuery(sessionQueries.history());

  return (
    <div className="max-w-xl">
      <header>
        <h1 className="font-display text-page-title text-foreground">Activity</h1>
        <p className="mt-2 text-body text-foreground-muted">
          Every verification leaves a receipt. Nothing is verified quietly.
        </p>
      </header>

      <div className="mt-7">
        {history.isPending && (
          <div className="space-y-3" aria-label="Loading activity">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        )}

        {history.isError && (
          <StateView
            icon={History}
            title="Couldn't load activity"
            body="Check your connection and try again."
            action={
              <button
                type="button"
                onClick={() => history.refetch()}
                className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-body-sm font-medium text-foreground hover:bg-muted"
              >
                Retry
              </button>
            }
          />
        )}

        {history.data?.length === 0 && (
          <StateView
            icon={History}
            title="No verifications yet"
            body="Completed verifications appear here with the exact level of certainty each one reached."
            action={
              <Link
                to="/app/verify"
                className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-body-sm font-semibold text-accent-foreground hover:bg-accent-strong"
              >
                Verify an official
              </Link>
            }
          />
        )}

        {history.data && history.data.length > 0 && (
          <ul className="space-y-3">
            {history.data.map((entry) => (
              <li
                key={entry.sessionId}
                className="rounded-lg border border-border bg-surface-strong shadow-elev-1"
              >
                <Link
                  to="/app/verify/receipt/$id"
                  params={{ id: entry.sessionId }}
                  className="block rounded-lg p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-card-title text-foreground">
                      {entry.subjectName}
                    </p>
                    <CredentialStatusBadge status={entry.outcome} />
                  </div>
                  <p className="mt-1 text-body-sm text-foreground-muted">
                    {entry.subjectDesignation} · {METHOD_LABELS[entry.method]}
                  </p>
                  <p className="mt-2 text-metadata text-foreground-subtle">
                    {formatDistanceToNow(new Date(entry.occurredAt), { addSuffix: true })} · session{" "}
                    <span className="font-display tracking-wide">{entry.sessionId}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
