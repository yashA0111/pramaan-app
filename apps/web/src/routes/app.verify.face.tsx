import { useCallback, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ScanFace } from "lucide-react";

import { ActionButton } from "@/features/verification/components/action-button";
import { CameraStage } from "@/features/verification/components/camera-stage";
import { useCamera } from "@/features/verification/use-camera";
import { API_BASE_URL } from "@/lib/api/client";

export const Route = createFileRoute("/app/verify/face")({
  head: () => ({
    meta: [
      { title: "Identify by face — Pramaan" },
      {
        name: "description",
        content: "Use the face-identification path when a credential QR is unavailable.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FaceFirstPage,
});

type IdentificationCandidate = {
  credentialReference: string;
  fullName: string;
  designation: string;
  department: string;
  posting: string;
  photoUrl?: string | null;
};

type IdentificationResult = {
  status: string;
  candidate: IdentificationCandidate | null;
  confidence: number | null;
  modelVersion: string;
  timestamp: string;
  reason: string;
};

function FaceFirstPage() {
  const camera = useCamera({ facingMode: "user" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const captureFrame = useCallback(() => {
    const video = camera.videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  }, [camera.videoRef]);

  async function identify() {
    setBusy(true);
    setMessage(null);
    setResult(null);

    try {
      const capturedFrameBase64 = captureFrame();
      if (!capturedFrameBase64) {
        throw new Error("The camera frame is not ready yet. Start the camera and try again.");
      }

      const response = await fetch(`${API_BASE_URL}/identity/identify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          observation: "single_face",
          quality: 0.82,
          capturedFrameBase64,
        }),
      });

      const payload = (await response.json()) as IdentificationResult | { message?: string };
      if (!response.ok) {
        throw new Error("message" in payload && payload.message ? payload.message : "Face identification failed.");
      }
      setResult(payload as IdentificationResult);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Face identification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <header>
        <p className="text-label uppercase text-accent">Alternate verification path</p>
        <h1 className="mt-1 font-display text-page-title text-foreground">Identify by face</h1>
        <p className="mt-2 text-body text-foreground-muted">
          Use this when the official cannot show a credential QR. The face service searches the
          synthetic demo identity registry and returns a candidate when the biometric search is available.
        </p>
      </header>

      <CameraStage
        className="mt-6 aspect-[4/5] w-full sm:aspect-square"
        state={camera.state}
        detail={camera.detail}
        videoRef={camera.videoRef}
        onStart={camera.start}
        mirrored
        purpose="Front camera, used only for the face-identification attempt in this session."
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/app/verify"
          className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface-strong px-4 text-body-sm font-medium text-foreground hover:bg-muted"
        >
          Back
        </Link>
        <ActionButton
          busy={busy}
          disabled={camera.state === "idle" || camera.state === "requesting_permission" || camera.state === "permission_denied" || camera.state === "camera_unavailable"}
          onClick={() => void identify()}
        >
          <ScanFace className="size-4" aria-hidden="true" />
          Identify face
        </ActionButton>
      </div>

      {message && (
        <p className="mt-4 rounded-md border border-warning/40 bg-warning-soft px-3.5 py-2.5 text-body-sm text-warning-soft-foreground">
          {message}
        </p>
      )}

      {result && (
        <section className="mt-6 rounded-lg border border-border bg-surface-strong p-5 shadow-elev-1" aria-live="polite">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent-soft text-accent">
              <Camera className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-label uppercase text-foreground-subtle">Face identification</p>
              <h2 className="mt-1 font-display text-card-title text-foreground">
                {result.candidate ? "Potential identity match" : "No identity candidate"}
              </h2>
              <p className="mt-1 text-body-sm text-foreground-muted">{result.reason}</p>
            </div>
          </div>

          {result.candidate && (
            <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-[5rem_minmax(0,1fr)]">
              <div className="aspect-square overflow-hidden border border-border bg-surface-muted">
                {result.candidate.photoUrl ? (
                  <img src={result.candidate.photoUrl} alt={`${result.candidate.fullName} portrait`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-foreground-muted">—</div>
                )}
              </div>
              <div>
                <p className="font-display text-card-title text-foreground">{result.candidate.fullName}</p>
                <p className="mt-1 text-body-sm text-foreground-muted">{result.candidate.designation} · {result.candidate.department}</p>
                <p className="mt-2 font-display text-credential tracking-wide text-foreground">{result.candidate.credentialReference}</p>
                {result.confidence !== null && (
                  <p className="mt-2 text-metadata text-foreground-subtle">Confidence: {Math.round(result.confidence * 100)}%</p>
                )}
                <p className="mt-3 text-metadata text-foreground-subtle">
                  This is an identity candidate, not by itself proof of government authority. Continue with the normal credential/authority verification before treating the person as verified.
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
