import { FlaskConical, ScanFace, SwitchCamera } from "lucide-react";
import { useState } from "react";

import { TONE_CLASSES, VERIFICATION_STATUS } from "@/lib/status";
import { cn } from "@/lib/utils";
import type {
  FaceState,
  IdentityVerificationInput,
  IdentityVerificationResult,
} from "@/types/verification-session";

import { useCamera } from "../use-camera";
import { ActionButton } from "./action-button";
import { CameraStage } from "./camera-stage";

interface IdentityPanelProps {
  result: IdentityVerificationResult | null;
  /** True while the matching service is deciding. */
  busy: boolean;
  onVerify: (input: IdentityVerificationInput) => void;
  disabled?: boolean;
  className?: string;
}

interface StatePresentation {
  headline: string;
  body: string;
  tone: keyof typeof TONE_CLASSES;
  retry: boolean;
}

const FACE_STATE: Record<FaceState, StatePresentation> = {
  ready: {
    headline: "Ready to compare",
    body: "Point the camera at the person holding the credential, then tap 'Compare identity'.",
    tone: "neutral",
    retry: false,
  },
  camera_initializing: {
    headline: "Starting the camera",
    body: "Waiting for the camera to become available.",
    tone: "active",
    retry: false,
  },
  detecting: {
    headline: "Camera active",
    body: "Frame the subject's face, then tap 'Compare identity'.",
    tone: "active",
    retry: false,
  },
  matching: {
    headline: "Comparing biometric identity...",
    body: "Evaluating 1:1 facial similarity against the enrolled reference photo.",
    tone: "active",
    retry: false,
  },
  no_face: {
    headline: "No face detected",
    body: "Nothing was compared. Frame a single face and try again.",
    tone: "warning",
    retry: true,
  },
  multiple_faces: {
    headline: "More than one face in frame",
    body: "A comparison needs exactly one subject. Ask others to step out of frame.",
    tone: "warning",
    retry: true,
  },
  match: {
    headline: "Identity matched",
    body: "The presented face matched the credential reference photograph.",
    tone: "success",
    retry: false,
  },
  mismatch: {
    headline: "Identity did not match",
    body: "The presented face did not match the credential. The credential may not belong to this person.",
    tone: "danger",
    retry: false,
  },
  requires_review: {
    headline: "Comparison inconclusive",
    body: "The result was not decisive enough to claim a match. A human decision is needed.",
    tone: "info",
    retry: true,
  },
  timeout: {
    headline: "Comparison timed out",
    body: "The matching service did not answer in time. Nothing was established.",
    tone: "warning",
    retry: true,
  },
  offline: {
    headline: "Matching service unreachable",
    body: "No comparison was performed. Identity remains unestablished.",
    tone: "neutral",
    retry: true,
  },
  error: {
    headline: "Comparison failed",
    body: "The matching service could not process this session.",
    tone: "danger",
    retry: true,
  },
};

const DEMO_OBSERVATIONS: { value: IdentityVerificationInput["observation"]; label: string }[] = [
  { value: "single_face", label: "Single face" },
  { value: "no_face", label: "No face" },
  { value: "multiple_faces", label: "Multiple faces" },
];

/**
 * The identity leg. All decisions arrive as a typed `IdentityVerificationResult`
 * from the service — this component only chooses how to say it. Calm and
 * documentary: no meshes, reticles or scanning theatrics.
 */
export function IdentityPanel({
  result,
  busy,
  onVerify,
  disabled = false,
  className,
}: IdentityPanelProps) {
  // Default to environment (back camera)
  const camera = useCamera({ facingMode: "environment", autoStart: true });
  const [observation, setObservation] =
    useState<IdentityVerificationInput["observation"]>("single_face");

  const handleCompare = () => {
    let capturedFrameBase64: string | undefined;
    const video = camera.videoRef.current;
    if (video && video.readyState >= 2) {
      try {
        const rawW = video.videoWidth || 640;
        const rawH = video.videoHeight || 480;
        const maxDim = 640;
        const scale = Math.min(1, maxDim / Math.max(rawW, rawH));
        const w = Math.round(rawW * scale);
        const h = Math.round(rawH * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          capturedFrameBase64 = canvas.toDataURL("image/jpeg", 0.82);
        }
      } catch {
        // ignore snapshot errors
      }
    }
    onVerify({
      observation,
      quality: 0.82,
      ...(capturedFrameBase64 ? { capturedFrameBase64 } : {}),
    });
  };

  const state: FaceState = busy
    ? "matching"
    : (result?.status ??
      (camera.state === "requesting_permission"
        ? "camera_initializing"
        : camera.state === "camera_ready"
          ? "detecting"
          : "ready"));
  const presentation = FACE_STATE[state];
  const tone = TONE_CLASSES[presentation.tone];
  const settled = result?.matchResult === "match" || result?.matchResult === "mismatch";

  return (
    <section
      aria-label="Identity comparison"
      className={cn("rounded-lg border border-border bg-surface-strong shadow-elev-1", className)}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
        <p className="flex items-center gap-2 text-label uppercase text-foreground-muted">
          <ScanFace className="size-3.5" aria-hidden="true" />
          Identity match
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-label uppercase",
            tone.badge,
          )}
        >
          {result ? VERIFICATION_STATUS[statusFor(result.status)].label : "Not performed"}
        </span>
      </header>

      <div className="grid gap-5 p-4 sm:px-5 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
        <CameraStage
          state={camera.state}
          detail={camera.detail}
          videoRef={camera.videoRef}
          onStart={camera.start}
          onToggleFacingMode={camera.toggleFacingMode}
          facingMode={camera.facingMode}
          mirrored={camera.facingMode === "user"}
          purpose="Camera used to compare the person present with the credential photograph."
          className="aspect-[4/5] w-full lg:aspect-[3/4]"
        />

        <div className="min-w-0">
          <p className="font-display text-card-title text-foreground">{presentation.headline}</p>
          <p className="mt-1 text-body-sm text-foreground-muted">
            {result?.reason ?? presentation.body}
          </p>

          {result && (
            <dl className="mt-4 grid gap-x-4 gap-y-2.5 border-t border-border pt-3.5 sm:grid-cols-2">
              <Field label="Match result" value={MATCH_LABEL[result.matchResult]} />
              <Field
                label="Confidence"
                value={
                  result.confidence === null
                    ? "Not produced"
                    : `${Math.round(result.confidence * 100)}%`
                }
              />
              <Field label="Model" value={result.modelVersion} mono />
              <Field
                label="Compared at"
                value={new Date(result.timestamp).toLocaleTimeString("en-IN")}
              />
            </dl>
          )}

          {!settled && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ActionButton
                busy={busy}
                disabled={disabled || busy}
                onClick={handleCompare}
              >
                {presentation.retry ? "Compare again" : "Compare identity"}
              </ActionButton>
              {camera.state === "idle" ? (
                <ActionButton tone="quiet" onClick={camera.start}>
                  Start camera
                </ActionButton>
              ) : (
                <ActionButton tone="quiet" onClick={camera.toggleFacingMode} disabled={busy}>
                  <SwitchCamera className="size-4" aria-hidden="true" />
                  {camera.facingMode === "environment" ? "Switch to front camera" : "Switch to back camera"}
                </ActionButton>
              )}
            </div>
          )}

          {!settled && (
            <fieldset className="mt-4 rounded-md border border-dashed border-warning/45 bg-warning-soft/40 p-3">
              <legend className="flex items-center gap-1.5 px-1 text-label uppercase text-warning-soft-foreground">
                <FlaskConical className="size-3.5" aria-hidden="true" />
                Demo capture control
              </legend>
              <p className="text-metadata text-foreground-muted">
                No production biometric pipeline runs in this build. Choose what the client should
                report having observed; the mocked service decides the outcome.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {DEMO_OBSERVATIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={observation === option.value}
                    onClick={() => setObservation(option.value)}
                    className={cn(
                      "min-h-9 rounded-md border px-3 text-metadata font-medium transition-colors",
                      observation === option.value
                        ? "border-accent bg-accent-soft text-accent-soft-foreground"
                        : "border-border bg-surface text-foreground-muted hover:bg-muted",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      </div>
    </section>
  );
}

const MATCH_LABEL = {
  match: "Matched",
  mismatch: "Did not match",
  inconclusive: "Inconclusive",
  not_performed: "Not performed",
} as const;

function statusFor(state: FaceState) {
  switch (state) {
    case "match":
      return "identity_matched" as const;
    case "mismatch":
      return "mismatch" as const;
    case "requires_review":
      return "requires_review" as const;
    case "no_face":
      return "no_face" as const;
    case "multiple_faces":
      return "multiple_faces" as const;
    case "timeout":
      return "timeout" as const;
    case "offline":
      return "offline" as const;
    case "error":
      return "error" as const;
    case "matching":
    case "detecting":
    case "camera_initializing":
      return "processing" as const;
    default:
      return "ready" as const;
  }
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-label uppercase text-foreground-subtle">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-foreground",
          mono ? "font-display text-credential tracking-wide" : "text-body-sm",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
