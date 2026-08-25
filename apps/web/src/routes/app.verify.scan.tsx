import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { ActionButton } from "@/features/verification/components/action-button";
import { CameraStage } from "@/features/verification/components/camera-stage";
import { DemoFallback } from "@/features/verification/components/demo-fallback";
import { ScanFrame } from "@/features/verification/components/scan-frame";
import { createSession, decodeQr } from "@/features/verification/session-service";
import { useQrScanner } from "@/features/verification/use-qr-scanner";


export const Route = createFileRoute("/app/verify/scan")({
  head: () => ({
    meta: [
      { title: "Scan a credential QR — Pramaan" },
      {
        name: "description",
        content:
          "Point your camera at an official credential QR code. Decoding is not verification.",
      },
      { property: "og:title", content: "Scan a credential QR — Pramaan" },
      {
        property: "og:description",
        content:
          "Point your camera at an official credential QR code. Decoding is not verification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [detected, setDetected] = useState(false);

  const start = useMutation({
    mutationFn: async (raw: string) => {
      const scan = await decodeQr(raw);
      if (scan.outcome !== "qr_decoded" || !scan.credentialReference) {
        // The service owns the wording for every non-decoded outcome.
        throw new Error(scan.message);
      }
      return createSession(scan.credentialReference);
    },
    onSuccess: (session) =>
      navigate({ to: "/app/verify/session/$id", params: { id: session.sessionId } }),
    onError: (error: Error) => {
      setDetected(false);
      setMessage(error.message);
      scanner.resume();
    },
  });

  const onDecode = useCallback(
    (raw: string) => {
      setDetected(true);
      setMessage(null);
      start.mutate(raw);
    },
    // start.mutate is stable for the life of the mutation observer
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const scanner = useQrScanner({ onDecode, enabled: !start.isPending });

  const guidance = start.isPending
    ? "Code read — opening the session"
    : detected
      ? "Code read"
      : "Fit the QR code inside the frame";

  return (
    <div className="mx-auto max-w-xl">
      <header>
        <h1 className="font-display text-page-title text-foreground">Scan a credential</h1>
        <p className="mt-2 text-body text-foreground-muted">
          Hold the credential steady inside the frame. Reading the code only tells us which
          credential to look up — it verifies nothing on its own.
        </p>
      </header>

      <CameraStage
        className="mt-6 aspect-[3/4] w-full sm:aspect-square"
        state={scanner.cameraState}
        detail={scanner.detail}
        videoRef={scanner.videoRef}
        onStart={scanner.start}
        purpose="Rear camera, used only to read the credential QR code in this session."
        overlay={
          <ScanFrame
            scanning={scanner.cameraState === "scanning"}
            detected={detected}
            guidance={guidance}
          />
        }
      />

      {message && (
        <p
          role="status"
          className="mt-3 rounded-md border border-warning/40 bg-warning-soft px-3.5 py-2.5 text-body-sm text-warning-soft-foreground"
        >
          {message}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          to="/app/verify"
          className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface-strong px-4 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Back
        </Link>
        {start.isPending && (
          <ActionButton busy disabled>
            Opening session
          </ActionButton>
        )}
      </div>

      <DemoFallback
        className="mt-8"
        disabled={start.isPending}
        onUseReference={(reference) => {
          setMessage(null);
          createSession(reference, { demo: true })
            .then((session) =>
              navigate({ to: "/app/verify/session/$id", params: { id: session.sessionId } }),
            )
            .catch(() => setMessage("That demo session could not be started."));
        }}
      />
    </div>
  );
}
