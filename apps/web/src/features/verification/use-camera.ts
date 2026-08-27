import { useCallback, useEffect, useRef, useState } from "react";

import type { CameraState } from "@/types/verification-session";

interface UseCameraOptions {
  facingMode?: "environment" | "user";
  /** Start requesting permission as soon as the hook mounts. */
  autoStart?: boolean;
}

interface UseCameraResult {
  state: CameraState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Ask for permission and attach the stream. Safe to call repeatedly. */
  start: () => void;
  stop: () => void;
  /** Human-readable detail for the current failure, if any. */
  detail: string | null;
}

/**
 * Camera lifecycle as an explicit state machine:
 * IDLE → REQUESTING_PERMISSION → CAMERA_READY → SCANNING,
 * with PERMISSION_DENIED and CAMERA_UNAVAILABLE as terminal branches.
 *
 * Browser APIs are only touched inside callbacks/effects, never at module
 * scope or during render.
 */
export function useCamera({ facingMode: initialFacingMode = "environment", autoStart = false }: UseCameraOptions = {}): UseCameraResult & {
  facingMode: "environment" | "user";
  toggleFacingMode: () => void;
} {
  const [facingMode, setFacingMode] = useState<"environment" | "user">(initialFacingMode);
  const [state, setState] = useState<CameraState>("idle");
  const [detail, setDetail] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(false);

  const stop = useCallback(() => {
    activeRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
  }, []);

  const startWithMode = useCallback((mode: "environment" | "user") => {
    // Clean up existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    activeRef.current = true;
    setDetail(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      activeRef.current = false;
      setState("camera_unavailable");
      setDetail("This browser does not expose a camera to web pages.");
      return;
    }

    setState("requesting_permission");
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then(async (stream) => {
        if (!activeRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          try {
            await video.play();
          } catch {
            /* autoplay rejection is non-fatal; the poster state still renders */
          }
        }
        setState("camera_ready");
      })
      .catch((error: unknown) => {
        activeRef.current = false;
        const name = error instanceof DOMException ? error.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setState("permission_denied");
          setDetail("Camera access was blocked for this site.");
          return;
        }
        if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError") {
          setState("camera_unavailable");
          setDetail("No usable camera was found on this device.");
          return;
        }
        setState("camera_unavailable");
        setDetail("The camera could not be started. It may be in use by another app.");
      });
  }, []);

  const start = useCallback(() => {
    startWithMode(facingMode);
  }, [facingMode, startWithMode]);

  const toggleFacingMode = useCallback(() => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    if (activeRef.current || state === "camera_ready" || state === "scanning") {
      startWithMode(nextMode);
    }
  }, [facingMode, state, startWithMode]);

  useEffect(() => {
    if (autoStart) startWithMode(initialFacingMode);
    return () => {
      activeRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [autoStart, initialFacingMode, startWithMode]);

  return { state, videoRef, start, stop, detail, facingMode, toggleFacingMode };
}

/** Marks the ready camera as actively scanning, without touching the stream. */
export function scanningState(state: CameraState, scanning: boolean): CameraState {
  return state === "camera_ready" && scanning ? "scanning" : state;
}
