import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";

import { OfficialShell } from "@/components/layout/official-shell";

export const Route = createFileRoute("/official")({
  head: () => ({
    meta: [
      { title: "Official console — Pramaan" },
      {
        name: "description",
        content: "Where government officials receive and answer citizen verification requests.",
      },
      { property: "og:title", content: "Official console — Pramaan" },
      {
        property: "og:description",
        content: "Where government officials receive and answer citizen verification requests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OfficialEntry,
});

function OfficialEntry() {
  return (
    <OfficialShell>
      <div className="mx-auto max-w-md">
        <header className="text-center">
          <h1 className="font-display text-page-title text-foreground">Official console</h1>
          <p className="mt-2 text-body text-foreground-muted">
            When a citizen asks for live confirmation, the request lands here — with what is being
            asked, what will be shared, and how long it stands.
          </p>
        </header>

        <div className="mt-8 rounded-lg border border-border bg-surface-strong p-6 text-center shadow-elev-1">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <Inbox className="size-5 text-foreground-muted" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-card-title font-semibold text-foreground">
            No pending requests
          </h2>
          <p className="mt-1.5 text-body-sm text-foreground-muted">
            The request inbox, approval flow, and expiry handling arrive in the official-interface
            phase.
          </p>
          <button
            type="button"
            disabled
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-5 text-body-sm font-medium text-primary-foreground opacity-60"
          >
            Continue as demo official
          </button>
          <p className="mt-2.5 text-metadata text-foreground-subtle">
            Demo console — synthetic requests only.
          </p>
        </div>
      </div>
    </OfficialShell>
  );
}
