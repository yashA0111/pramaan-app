import { Camera, CameraOff, Loader2, ShieldAlert, SwitchCamera } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { CameraState } from "@/types/verification-session";

interface CameraStageProps {
  state: CameraState;
  detail: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onStart: () => void;
  onToggleFacingMode?: () => void;
  facingMode?: "environment" | "user";
  /** Overlay rendered on top of a live preview (scan frame, guidance). */
  overlay?: ReactNode;
  /** Accessible description of what the camera is being used for. */
  purpose: string;
  className?: string;
  mirrored?: boolean;
}

const LIVE_STATES: CameraState[] = ["camera_ready", "scanning"];

/**
 * The camera surface. The preview dominates; states are explained in place
 * rather than in a stack of cards around it.
 */
export function CameraStage({
  state,
  detail,
  videoRef,
  onStart,
  onToggleFacingMode,
  facingMode,
  overlay,
  purpose,
  className,
  mirrored = false,
}: CameraStageProps) {
  const live = LIVE_STATES.includes(state);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border-strong bg-foreground/95",
        className,
      )}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        aria-label={purpose}
        className={cn(
          "size-full object-cover transition-opacity duration-300",
          live ? "opacity-100" : "opacity-0",
          mirrored && "scale-x-[-1]",
        )}
      />

      {live && onToggleFacingMode && (
        <button
          type="button"
          onClick={onToggleFacingMode}
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-metadata font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/80 active:scale-95"
          aria-label={`Switch to ${facingMode === "environment" ? "front" : "back"} camera`}
          title={`Switch to ${facingMode === "environment" ? "front" : "back"} camera`}
        >
          <SwitchCamera className="size-4" aria-hidden="true" />
          <span className="text-[11px] capitalize">{facingMode === "environment" ? "Back" : "Front"}</span>
        </button>
      )}

      {live && overlay}

      {!live && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          {state === "idle" && (
            <Placeholder
              icon={Camera}
              title="Camera not started"
              body={purpose}
              action={
                <button
                  type="button"
                  onClick={onStart}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-body-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
                >
                  <Camera className="size-4" aria-hidden="true" />
                  Start camera
                </button>
              }
            />
          )}

          {state === "requesting_permission" && (
            <Placeholder
              icon={Loader2}
              spin
              title="Waiting for camera permission"
              body="Your browser is asking whether Pramaan may use the camera. Choose Allow to continue."
            />
          )}

          {state === "permission_denied" && (
            <Placeholder
              icon={ShieldAlert}
              tone="warning"
              title="Camera access is blocked"
              body={
                detail ??
                "Open the lock or camera icon in your browser's address bar, set Camera to Allow for this site, then try again."
              }
              action={
                <button
                  type="button"
                  onClick={onStart}
                  className="inline-flex min-h-11 items-center rounded-md border border-background/40 bg-background/10 px-4 text-body-sm font-semibold text-background transition-colors hover:bg-background/20"
                >
                  Try again
                </button>
              }
            />
          )}

          {state === "camera_unavailable" && (
            <Placeholder
              icon={CameraOff}
              tone="warning"
              title="No camera available"
              body={detail ?? "This device has no camera Pramaan can use. Use the demo credential instead."}
              action={
                <button
                  type="button"
                  onClick={onStart}
                  className="inline-flex min-h-11 items-center rounded-md border border-background/40 bg-background/10 px-4 text-body-sm font-semibold text-background transition-colors hover:bg-background/20"
                >
                  Try again
                </button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

function Placeholder({
  icon: Icon,
  title,
  body,
  action,
  spin = false,
  tone = "neutral",
}: {
  icon: typeof Camera;
  title: string;
  body: string;
  action?: ReactNode;
  spin?: boolean;
  tone?: "neutral" | "warning";
}) {
  return (
    <>
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full border",
          tone === "warning" ? "border-warning/50 bg-warning/15" : "border-background/25 bg-background/10",
        )}
      >
        <Icon
          className={cn("size-5 text-background", spin && "motion-safe:animate-spin")}
          aria-hidden="true"
        />
      </span>
      <div>
        <p className="font-display text-card-title text-background">{title}</p>
        <p className="mx-auto mt-1 max-w-xs text-body-sm text-background/70">{body}</p>
      </div>
      {action}
    </>
  );
}
