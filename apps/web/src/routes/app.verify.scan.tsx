import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Ban,
  CalendarX2,
  CloudOff,
  FileText,
  FileX2,
  Loader2,
  Radar,
  RotateCcw,
  ScanFace,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useState } from "react";

import { CredentialCard } from "@/components/product/credential-card";
import { CredentialStatusBadge } from "@/components/product/credential-status-badge";
import { CameraStage } from "@/features/verification/components/camera-stage";
import { DemoFallback } from "@/features/verification/components/demo-fallback";
import { ScanFrame } from "@/features/verification/components/scan-frame";
import {
  advanceCredentialStage,
  createSession,
  decodeQr,
} from "@/features/verification/session-service";
import { useQrScanner } from "@/features/verification/use-qr-scanner";
import type { VerificationSession } from "@/types/verification-session";

export const Route = createFileRoute("/app/verify/scan")({
  head: () => ({
    meta: [
      { title: "Scan a credential QR — Pramaan" },
      {
        name: "description",
        content:
          "Point your camera at an official credential QR code. Verified directly against official records.",
      },
      { property: "og:title", content: "Scan a credential QR — Pramaan" },
      {
        property: "og:description",
        content:
          "Point your camera at an official credential QR code. Verified directly against official records.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScanPage,
});

type VerificationUiState =
  | { stage: "scanning" }
  | { stage: "verifying"; reference?: string }
  | { stage: "valid"; session: VerificationSession }
  | { stage: "invalid"; session: VerificationSession | null; message: string }
  | { stage: "revoked"; session: VerificationSession | null; message: string }
  | { stage: "expired"; session: VerificationSession | null; message: string }
  | { stage: "service_unavailable"; session: VerificationSession | null; message: string }
  | { stage: "unrecognized"; message: string };

function ScanPage() {
  const [uiState, setUiState] = useState<VerificationUiState>({ stage: "scanning" });

  const executeVerification = useCallback(async (raw: string, isDemo = false) => {
    setUiState({ stage: "verifying" });

    try {
      // 1. Decode QR code
      const scan = await decodeQr(raw, { demo: isDemo });

      if (scan.outcome === "unrecognized_qr") {
        setUiState({
          stage: "unrecognized",
          message: scan.message || "That QR code was read, but it is not a recognized government credential.",
        });
        return;
      }

      if (scan.outcome === "invalid_qr") {
        setUiState({
          stage: "invalid",
          session: null,
          message:
            scan.message ||
            "This looks like a Pramaan code, but the reference or security token is malformed.",
        });
        return;
      }

      if (scan.outcome === "offline" || scan.outcome === "service_unavailable") {
        setUiState({
          stage: "service_unavailable",
          session: null,
          message:
            scan.message ||
            "The official verification service did not respond. Nothing has been verified.",
        });
        return;
      }

      if (scan.outcome === "expired_reference") {
        setUiState({
          stage: "expired",
          session: null,
          message: scan.message || "This credential reference is no longer active in official records.",
        });
        return;
      }

      if (!scan.credentialReference) {
        setUiState({
          stage: "invalid",
          session: null,
          message: "No credential reference was found in the QR code.",
        });
        return;
      }

      // 2. Create verification session
      const createdSession = await createSession(scan.credentialReference, {
        demo: isDemo || scan.demo,
      });

      // 3. Authoritatively walk credential validation pipeline stages to completion
      let currentSession = await advanceCredentialStage(createdSession.sessionId);
      let safetyGuard = 0;
      while (currentSession.state === "validating" && safetyGuard++ < 12) {
        currentSession = await advanceCredentialStage(createdSession.sessionId);
      }

      // 4. Map authoritative outcome to clear citizen state
      if (
        currentSession.state === "service_unavailable" ||
        currentSession.credentialOutcome === "unavailable"
      ) {
        setUiState({
          stage: "service_unavailable",
          session: currentSession,
          message:
            currentSession.error?.message ||
            "The official verification service is unavailable. No conclusion can be drawn.",
        });
      } else if (currentSession.credentialOutcome === "valid") {
        setUiState({
          stage: "valid",
          session: currentSession,
        });
      } else if (currentSession.credentialOutcome === "revoked") {
        setUiState({
          stage: "revoked",
          session: currentSession,
          message: "This credential was revoked by the issuing authority and is no longer valid.",
        });
      } else if (currentSession.credentialOutcome === "expired") {
        setUiState({
          stage: "expired",
          session: currentSession,
          message: "This credential's official validity period has ended.",
        });
      } else if (currentSession.credentialOutcome === "invalid") {
        setUiState({
          stage: "invalid",
          session: currentSession,
          message: "Credential signature validation failed. Treat the document as unproven.",
        });
      } else {
        setUiState({
          stage: "invalid",
          session: currentSession,
          message: "The credential could not be verified in official records.",
        });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "The verification service could not process this scan.";
      setUiState({
        stage: "service_unavailable",
        session: null,
        message: errorMsg,
      });
    }
  }, []);

  const onDecode = useCallback(
    (raw: string) => {
      void executeVerification(raw, false);
    },
    [executeVerification],
  );

  const scanner = useQrScanner({
    onDecode,
    enabled: uiState.stage === "scanning",
  });

  const handleReset = useCallback(() => {
    setUiState({ stage: "scanning" });
    scanner.reset();
  }, [scanner]);

  const isScanning = uiState.stage === "scanning";
  const isVerifying = uiState.stage === "verifying";
  const isDetected = !isScanning;

  const guidance = isVerifying
    ? "QR code read — verifying with official records..."
    : uiState.stage === "valid"
      ? "Official credential verified"
      : uiState.stage === "invalid"
        ? "Credential failed verification"
        : uiState.stage === "revoked"
          ? "Credential is revoked"
          : uiState.stage === "expired"
            ? "Credential validity expired"
            : uiState.stage === "service_unavailable"
              ? "Service unavailable"
              : uiState.stage === "unrecognized"
                ? "Unrecognized QR code"
                : "Fit the QR code inside the frame";

  return (
    <div className="mx-auto max-w-xl pb-12">
      <header>
        <h1 className="font-display text-page-title text-foreground">Scan a credential</h1>
        <p className="mt-2 text-body text-foreground-muted">
          Hold the credential steady inside the frame. Pramaan immediately locks the scan, verifies
          digital signatures and official status, and shows the result in place.
        </p>
      </header>

      {/* Camera Viewfinder Stage */}
      <CameraStage
        className="mt-6 aspect-[3/4] w-full sm:aspect-square"
        state={scanner.cameraState}
        detail={scanner.detail}
        videoRef={scanner.videoRef}
        onStart={scanner.start}
        purpose="Rear camera, used only to read and verify the official credential QR code."
        overlay={
          <ScanFrame
            scanning={scanner.cameraState === "scanning" && isScanning}
            detected={isDetected}
            guidance={guidance}
          />
        }
      />

      {/* State 1: Verifying in progress */}
      {isVerifying && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded-xl border border-accent/30 bg-surface-strong p-6 shadow-elev-2"
        >
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Radar className="size-6 animate-spin" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-card-title text-foreground">
                  Verifying credential
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-metadata font-semibold text-accent">
                  <span className="size-1.5 rounded-full bg-accent motion-safe:animate-ping" />
                  In Progress
                </span>
              </div>
              <p className="mt-1 text-body-sm text-foreground-muted">
                Checking security signatures, issuing authority records, and active status...
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-3.5 text-metadata text-foreground-subtle">
            <Loader2 className="size-3.5 animate-spin text-accent" />
            <span>Consulting official records — no camera readjustment required</span>
          </div>
        </div>
      )}

      {/* State 2: Valid Credential */}
      {uiState.stage === "valid" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 space-y-4 rounded-xl border border-success/30 bg-surface-strong p-6 shadow-elev-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-card-title text-foreground">
                    Official Credential Verified
                  </h2>
                  <CredentialStatusBadge status="verified" />
                </div>
                <p className="mt-1 text-body-sm text-foreground-muted">
                  The document signature is authentic, active, and officially recorded.
                </p>
              </div>
            </div>
          </div>

          {uiState.session.credential && (
            <div className="mt-4 border-t border-border pt-4">
              <CredentialCard credential={uiState.session.credential} status="verified" />
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2.5 pt-2 sm:flex-row sm:items-center">
            <Link
              to="/app/verify/session/$id"
              params={{ id: uiState.session.sessionId }}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-body-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-strong"
            >
              <ScanFace className="size-4.5" />
              Continue to Biometric Match
            </Link>
            <Link
              to="/app/verify/receipt/$id"
              params={{ id: uiState.session.sessionId }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-4 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <FileText className="size-4" />
              View Receipt
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-4 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <RotateCcw className="size-4" />
              Scan Another
            </button>
          </div>
        </div>
      )}

      {/* State 3: Invalid Credential */}
      {uiState.stage === "invalid" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded-xl border border-danger/30 bg-surface-strong p-6 shadow-elev-2"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
              <FileX2 className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-card-title text-foreground">
                  Invalid Credential
                </h2>
                <CredentialStatusBadge status="invalid" />
              </div>
              <p className="mt-1.5 text-body-sm text-foreground-muted">
                {uiState.message ||
                  "The digital signature or security code on this credential could not be verified. Do not accept this document."}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-foreground px-4 text-body-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <RotateCcw className="size-4" />
              Scan Again
            </button>
            <Link
              to="/app/verify"
              className="inline-flex min-h-11 items-center rounded-lg border border-border-strong bg-surface px-4 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      )}

      {/* State 4: Revoked Credential */}
      {uiState.stage === "revoked" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded-xl border border-danger/40 bg-surface-strong p-6 shadow-elev-2"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
              <Ban className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-card-title text-foreground">
                  Revoked Credential
                </h2>
                <CredentialStatusBadge status="revoked" />
              </div>
              <p className="mt-1.5 text-body-sm text-foreground-muted">
                This credential has been officially revoked or suspended by the issuing authority and
                is no longer valid. Do not accept this document.
              </p>
            </div>
          </div>

          {uiState.session?.credential && (
            <div className="mt-4 border-t border-border pt-4 opacity-75">
              <CredentialCard credential={uiState.session.credential} status="revoked" />
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-foreground px-4 text-body-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <RotateCcw className="size-4" />
              Scan Another Credential
            </button>
            <Link
              to="/app/safety/sos"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-danger/40 bg-danger-soft px-4 text-body-sm font-medium text-danger transition-colors hover:bg-danger/20"
            >
              Report Issue / SOS
            </Link>
          </div>
        </div>
      )}

      {/* State 5: Expired Credential */}
      {uiState.stage === "expired" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded-xl border border-warning/40 bg-surface-strong p-6 shadow-elev-2"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
              <CalendarX2 className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-card-title text-foreground">
                  Expired Credential
                </h2>
                <CredentialStatusBadge status="expired" />
              </div>
              <p className="mt-1.5 text-body-sm text-foreground-muted">
                {uiState.message ||
                  "This credential was officially issued in the past, but its validity period has ended. Ask the official for an updated credential."}
              </p>
            </div>
          </div>

          {uiState.session?.credential && (
            <div className="mt-4 border-t border-border pt-4 opacity-80">
              <CredentialCard credential={uiState.session.credential} status="expired" />
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-foreground px-4 text-body-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <RotateCcw className="size-4" />
              Scan Another Credential
            </button>
            <Link
              to="/app/verify"
              className="inline-flex min-h-11 items-center rounded-lg border border-border-strong bg-surface px-4 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      )}

      {/* State 6: Service Unavailable */}
      {uiState.stage === "service_unavailable" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded-xl border border-warning/30 bg-surface-strong p-6 shadow-elev-2"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
              <CloudOff className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-card-title text-foreground">
                  Verification Service Unavailable
                </h2>
                <CredentialStatusBadge status="unavailable" />
              </div>
              <p className="mt-1.5 text-body-sm text-foreground-muted">
                {uiState.message ||
                  "The official verification service could not be reached. No conclusion can be drawn about this credential."}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 text-body-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
            >
              <RotateCcw className="size-4" />
              Try Again
            </button>
            <Link
              to="/app/verify"
              className="inline-flex min-h-11 items-center rounded-lg border border-border-strong bg-surface px-4 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      )}

      {/* State 7: Unrecognized QR */}
      {uiState.stage === "unrecognized" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded-xl border border-border bg-surface-strong p-6 shadow-elev-2"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground-muted">
              <ScanLine className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-card-title text-foreground">
                Unrecognized QR Code
              </h2>
              <p className="mt-1.5 text-body-sm text-foreground-muted">
                {uiState.message ||
                  "That QR code was read, but it is not a recognized government credential format."}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-foreground px-4 text-body-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <RotateCcw className="size-4" />
              Scan Again
            </button>
            <Link
              to="/app/verify"
              className="inline-flex min-h-11 items-center rounded-lg border border-border-strong bg-surface px-4 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      )}

      {/* Default Bottom Controls (when scanning) */}
      {isScanning && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            to="/app/verify"
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface-strong px-4 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Back
          </Link>
        </div>
      )}

      {/* Demo Credentials Fallback */}
      <DemoFallback
        className="mt-8"
        disabled={isVerifying}
        onUseReference={(reference) => {
          void executeVerification(reference, true);
        }}
      />
    </div>
  );
}
