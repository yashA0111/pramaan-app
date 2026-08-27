import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Inbox, X } from "lucide-react";
import { useEffect, useState } from "react";

import { OfficialShell } from "@/components/layout/official-shell";
import { apiRequest } from "@/lib/api/client";

type ConfirmationRequest = {
  id: string;
  verificationSessionId?: string;
  credentialReference: string;
  routedTo: string;
  requestedAt: string;
  expiresAt?: string;
  status: string;
};

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
  const [requests, setRequests] = useState<ConfirmationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadRequests() {
    setLoading(true);
    try {
      setRequests(await apiRequest<ConfirmationRequest[]>("/official/requests"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The official inbox could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  async function decide(requestId: string, decision: "accepted" | "rejected") {
    setWorkingId(requestId);
    setMessage(null);
    try {
      await apiRequest(`/official/requests/${requestId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason: `Demo official decision: ${decision}` }),
      });
      await loadRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The decision could not be recorded.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <OfficialShell>
      <div className="mx-auto max-w-2xl">
        <header className="text-center">
          <h1 className="font-display text-page-title text-foreground">Official console</h1>
          <p className="mt-2 text-body text-foreground-muted">
            Review synthetic citizen requests and record the issuing desk's confirmation.
          </p>
        </header>

        {message && <p role="alert" className="mt-6 border border-warning/30 bg-warning-soft px-3 py-2 text-body-sm text-warning-soft-foreground">{message}</p>}

        <div className="mt-8 border border-border bg-surface-strong shadow-elev-1">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2"><Inbox className="size-4 text-foreground-muted" aria-hidden="true" /><h2 className="text-card-title font-semibold text-foreground">Confirmation inbox</h2></div>
            <span className="text-metadata text-foreground-subtle">{requests.length} pending</span>
          </div>
          {loading ? (
            <p className="px-5 py-8 text-body-sm text-foreground-muted">Loading requests...</p>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <Inbox className="size-5 text-foreground-muted" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-card-title font-semibold text-foreground">
            No pending requests
          </h2>
              <p className="mt-1.5 text-body-sm text-foreground-muted">No pending synthetic requests.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {requests.map((request) => (
                <article key={request.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="text-label uppercase text-foreground-subtle">Credential request</p><h2 className="mt-1 font-display text-card-title text-foreground">{request.credentialReference}</h2></div>
                    <span className="rounded-full border border-warning/30 bg-warning-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-warning-soft-foreground">Pending</span>
                  </div>
                  <p className="mt-3 text-body-sm text-foreground-muted">Routed to {request.routedTo}. Requested {new Date(request.requestedAt).toLocaleTimeString("en-IN")}.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" disabled={workingId !== null} onClick={() => void decide(request.id, "accepted")} className="inline-flex min-h-10 items-center gap-2 bg-success px-4 text-body-sm font-semibold text-success-foreground disabled:opacity-50"><Check className="size-4" aria-hidden="true" /> Confirm</button>
                    <button type="button" disabled={workingId !== null} onClick={() => void decide(request.id, "rejected")} className="inline-flex min-h-10 items-center gap-2 border border-danger/30 bg-danger-soft px-4 text-body-sm font-semibold text-danger-soft-foreground disabled:opacity-50"><X className="size-4" aria-hidden="true" /> Reject</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-metadata text-foreground-subtle">Demo console — synthetic requests only. <Link to="/login" className="underline underline-offset-2">Switch role</Link></p>
      </div>
    </OfficialShell>
  );
}
