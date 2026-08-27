import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, LoaderCircle, MapPin, Siren, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { createSOS, cancelSOS, getSOSStatus } from "@/features/safety/safety-service";
import type { SosState } from "@/features/safety/types";

export const Route = createFileRoute("/app/safety/sos")({ component: SosPage });

const TERMINAL: SosState[] = ["acknowledged", "failed", "cancelled"];

function SosPage() {
  const [phase, setPhase] = useState<"ready" | "holding" | "countdown">("ready");
  const [countdown, setCountdown] = useState(3);
  const [requestId, setRequestId] = useState<string | null>(null);
  const holdTimer = useRef<number | null>(null);
  const create = useMutation({ mutationFn: () => createSOS(), onSuccess: (request) => setRequestId(request.requestId) });
  const status = useQuery({
    queryKey: ["safety", "sos", requestId],
    queryFn: () => getSOSStatus(requestId as string),
    enabled: requestId !== null,
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      return state && TERMINAL.includes(state) ? false : 700;
    },
    refetchOnWindowFocus: false,
    retry: false,
  });
  const request = status.data;
  const activeState = request?.state ?? (create.isPending ? "sending" : null);

  useEffect(() => () => { if (holdTimer.current !== null) window.clearInterval(holdTimer.current); }, []);

  function cancelHold() {
    if (holdTimer.current !== null) window.clearInterval(holdTimer.current);
    holdTimer.current = null;
    setPhase("ready");
    setCountdown(3);
  }

  function beginHold() {
    if (phase !== "ready" || create.isPending || requestId) return;
    setPhase("holding");
    let remaining = 3;
    holdTimer.current = window.setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      setPhase("countdown");
      if (remaining <= 0) {
        if (holdTimer.current !== null) window.clearInterval(holdTimer.current);
        holdTimer.current = null;
        setPhase("ready");
        create.mutate();
      }
    }, 700);
  }

  const cancelRequest = useMutation({ mutationFn: () => cancelSOS(requestId as string), onSuccess: (next) => status.refetch().then(() => next) });
  const busy = phase !== "ready" || create.isPending || (!!activeState && !TERMINAL.includes(activeState));

  return (
    <div className="mx-auto max-w-xl">
      <Link
        to="/app/safety"
        className="inline-flex min-h-10 items-center gap-2 text-body-sm font-medium text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Safety tools
      </Link>
      <header className="mt-6">
        <p className="text-label uppercase text-danger-soft-foreground">Priority safety action</p>
        <h1 className="mt-2 font-display text-page-title text-foreground">Simulated SOS</h1>
        <p className="mt-2 text-body text-foreground-muted">
          This prototype demonstrates a deliberate emergency request flow. It does not contact
          police, emergency contacts, or a dispatch system.
        </p>
      </header>

      {!requestId && (
        <section className="mt-8 rounded-lg border border-danger/30 bg-surface-strong p-5 shadow-elev-1">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-danger-soft text-danger">
              <MapPin className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-card-title font-semibold text-foreground">Before you activate</h2>
              <p className="mt-1 text-body-sm text-foreground-muted">
                The demo will share a synthetic location with a simulated dispatch endpoint. You
                will have a countdown to cancel.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Press and hold to activate simulated SOS"
            onPointerDown={beginHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            onMouseDown={beginHold}
            onMouseUp={cancelHold}
            onTouchStart={beginHold}
            onTouchEnd={cancelHold}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") beginHold();
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") cancelHold();
            }}
            className={`mx-auto mt-8 flex aspect-square w-48 select-none flex-col items-center justify-center rounded-full border-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 ${
              phase === "ready"
                ? "border-danger/25 bg-danger-soft text-danger hover:bg-danger/15"
                : "border-danger bg-danger text-danger-foreground"
            }`}
          >
            <Siren className="size-9" aria-hidden="true" />
            <span className="mt-3 text-body-sm font-semibold">
              {phase === "ready"
                ? "Press and hold"
                : phase === "holding"
                  ? "Keep holding"
                  : `Activating in ${countdown}`}
            </span>
          </button>
          <p role="status" aria-live="assertive" className="mt-5 text-center text-body-sm text-foreground-muted">
            {phase === "ready" ? "Nothing has started." : "Keep holding to continue, or release to cancel."}
          </p>
        </section>
      )}

      {requestId && (
        <section className="mt-8 rounded-lg border border-border bg-surface-strong p-5 shadow-elev-1">
          <div className="flex items-start gap-3">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-md ${
                activeState === "failed"
                  ? "bg-danger-soft text-danger"
                  : activeState === "acknowledged"
                    ? "bg-success-soft text-success"
                    : "bg-muted text-foreground-muted"
              }`}
            >
              {activeState === "acknowledged" ? (
                <Check className="size-5" aria-hidden="true" />
              ) : activeState === "failed" ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-label uppercase text-foreground-subtle">Demo dispatch reference</p>
              <h2 className="mt-1 font-display text-card-title text-foreground">{requestId}</h2>
              <p role="status" aria-live="polite" className="mt-2 text-body-sm text-foreground-muted">
                {request?.detail ?? "Starting the simulated request..."}
              </p>
            </div>
          </div>
          {activeState && (
            <p className="mt-6 border-t border-border pt-4 text-label uppercase text-foreground-subtle">
              State: <span className="text-foreground">{activeState}</span>
            </p>
          )}
          {activeState && !TERMINAL.includes(activeState) && (
            <button
              type="button"
              onClick={() => cancelRequest.mutate()}
              disabled={cancelRequest.isPending}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong px-4 text-body-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" /> Cancel simulated request
            </button>
          )}
          {activeState === "acknowledged" && (
            <p className="mt-5 border-t border-border pt-4 text-body-sm text-foreground-muted">
              Acknowledged by the synthetic demo system only. No emergency service was contacted.
            </p>
          )}
          {activeState === "failed" && (
            <p className="mt-5 border-t border-border pt-4 text-body-sm text-foreground-muted">
              The demo request failed. If this were a real emergency, use your local emergency number.
            </p>
          )}
        </section>
      )}

      {requestId && (
        <button
          type="button"
          onClick={() => {
            setRequestId(null);
            setCountdown(3);
          }}
          disabled={busy}
          className="mt-5 min-h-11 text-body-sm font-medium text-foreground-muted underline underline-offset-4 disabled:opacity-50"
        >
          Start another demonstration
        </button>
      )}
    </div>
  );
}
