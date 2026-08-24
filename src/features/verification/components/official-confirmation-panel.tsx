import { Landmark, Loader2 } from "lucide-react";

import { TONE_CLASSES } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { ConfirmationState, OfficialConfirmation } from "@/types/verification-session";

import { ActionButton } from "./action-button";

interface OfficialConfirmationPanelProps {
  confirmation: OfficialConfirmation;
  /** False when the identity leg has not produced a usable result. */
  available: boolean;
  polling: boolean;
  requesting: boolean;
  skipping: boolean;
  onRequest: () => void;
  onSkip: () => void;
  className?: string;
}

const STATE_COPY: Record<
  ConfirmationState,
  { badge: string; headline: string; body: string; tone: keyof typeof TONE_CLASSES }
> = {
  request_ready: {
    badge: "Not requested",
    headline: "Ask an official to confirm this request",
    body: "Optional. A duty officer can confirm live that this posting and this request are genuine. Without it, authority has not been independently established.",
    tone: "neutral",
  },
  request_sent: {
    badge: "Sent",
    headline: "Request delivered",
    body: "The request reached the desk and is waiting to be opened.",
    tone: "active",
  },
  pending: {
    badge: "Awaiting response",
    headline: "Waiting for an official to respond",
    body: "Nothing is confirmed while this is pending. You can stop waiting and finish with a partial receipt.",
    tone: "active",
  },
  accepted: {
    badge: "Confirmed",
    headline: "An authorized official confirmed this request",
    body: "The desk confirmed the posting and this specific verification request.",
    tone: "success",
  },
  rejected: {
    badge: "Declined",
    headline: "The official declined to confirm",
    body: "Authority was not established. Do not treat this credential as confirmed.",
    tone: "danger",
  },
  expired: {
    badge: "Expired",
    headline: "The request expired before it was opened",
    body: "No official saw the request in time. Nothing was confirmed.",
    tone: "warning",
  },
  timeout: {
    badge: "No response",
    headline: "No official responded in the request window",
    body: "Silence is not a confirmation. The receipt will say confirmation was not obtained.",
    tone: "warning",
  },
  failed: {
    badge: "Undelivered",
    headline: "The request could not be delivered",
    body: "The confirmation channel was unavailable, so nothing was confirmed.",
    tone: "warning",
  },
};

/**
 * The citizen side of the authority leg. It requests, waits, and reports — it
 * never decides. The official application itself is a separate surface.
 */
export function OfficialConfirmationPanel({
  confirmation,
  available,
  polling,
  requesting,
  skipping,
  onRequest,
  onSkip,
  className,
}: OfficialConfirmationPanelProps) {
  const copy = STATE_COPY[confirmation.state];
  const tone = TONE_CLASSES[copy.tone];
  const pending = confirmation.state === "pending" || confirmation.state === "request_sent";

  return (
    <section
      aria-label="Official confirmation"
      className={cn("rounded-lg border border-border bg-surface-strong shadow-elev-1", className)}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
        <p className="flex items-center gap-2 text-label uppercase text-foreground-muted">
          <Landmark className="size-3.5" aria-hidden="true" />
          Official confirmation
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-label uppercase",
            tone.badge,
          )}
        >
          {pending && polling && (
            <Loader2 className="size-3 motion-safe:animate-spin" aria-hidden="true" />
          )}
          {copy.badge}
        </span>
      </header>

      <div className="px-4 py-4 sm:px-5">
        <p className="font-display text-card-title text-foreground" aria-live="polite">
          {copy.headline}
        </p>
        <p className="mt-1 max-w-prose text-body-sm text-foreground-muted">
          {confirmation.reason ?? copy.body}
        </p>

        {(confirmation.routedTo || confirmation.requestedAt) && (
          <dl className="mt-4 grid gap-x-4 gap-y-2.5 border-t border-border pt-3.5 sm:grid-cols-2">
            {confirmation.routedTo && (
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-label uppercase text-foreground-subtle">Routed to</dt>
                <dd className="mt-0.5 text-body-sm text-foreground">{confirmation.routedTo}</dd>
              </div>
            )}
            {confirmation.requestedAt && (
              <div className="min-w-0">
                <dt className="text-label uppercase text-foreground-subtle">Requested</dt>
                <dd className="mt-0.5 text-body-sm text-foreground">
                  {new Date(confirmation.requestedAt).toLocaleTimeString("en-IN")}
                </dd>
              </div>
            )}
            {confirmation.respondedAt && (
              <div className="min-w-0">
                <dt className="text-label uppercase text-foreground-subtle">Responded</dt>
                <dd className="mt-0.5 text-body-sm text-foreground">
                  {new Date(confirmation.respondedAt).toLocaleTimeString("en-IN")}
                </dd>
              </div>
            )}
          </dl>
        )}

        {!available && confirmation.state === "request_ready" && (
          <p className="mt-4 rounded-md border border-border bg-muted px-3.5 py-2.5 text-body-sm text-foreground-muted">
            A confirmation request needs the identity stage to resolve first.
          </p>
        )}

        {confirmation.state === "request_ready" && available && (
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton busy={requesting} onClick={onRequest}>
              Request confirmation
            </ActionButton>
            <ActionButton tone="secondary" busy={skipping} onClick={onSkip}>
              Finish without it
            </ActionButton>
          </div>
        )}

        {pending && (
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton tone="secondary" busy={skipping} onClick={onSkip}>
              Stop waiting and finish
            </ActionButton>
          </div>
        )}
      </div>
    </section>
  );
}
