import { useCallback, useEffect, useRef, useState } from "react";

import { useCamera } from "./use-camera";

interface UseQrScannerOptions {
  /** Called once per decoded payload; the scanner locks immediately afterwards. */
  onDecode: (raw: string) => void;
  enabled?: boolean;
}

/**
 * Real browser QR scanning. Uses the native BarcodeDetector where available
 * and falls back to jsQR (loaded lazily, browser-only) elsewhere.
 * Immediately locks upon decode to stop repeated scan attempts.
 */
export function useQrScanner({ onDecode, enabled = true }: UseQrScannerOptions) {
  const camera = useCamera({ facingMode: "environment" });
  const [scanning, setScanning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lockRef = useRef(false);
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;

  const lock = useCallback(() => {
    lockRef.current = true;
    setIsLocked(true);
    setScanning(false);
  }, []);

  const pause = useCallback(() => {
    lockRef.current = true;
    setIsLocked(true);
    setScanning(false);
  }, []);

  const resume = useCallback(() => {
    lockRef.current = false;
    setIsLocked(false);
    setScanning(true);
  }, []);

  const reset = useCallback(() => {
    lockRef.current = false;
    setIsLocked(false);
    setScanning(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      lockRef.current = true;
      setIsLocked(true);
      setScanning(false);
      return;
    }
    if (camera.state !== "camera_ready") return;

    let cancelled = false;
    let detector: { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> } | null = null;
    let decodeFallback: ((data: Uint8ClampedArray, w: number, h: number) => { data: string } | null) | null = null;

    lockRef.current = false;
    setIsLocked(false);
    setScanning(true);

    const setup = async () => {
      const Detector = (globalThis as { BarcodeDetector?: new (opts: { formats: string[] }) => typeof detector }).BarcodeDetector;
      if (Detector) {
        try {
          detector = new Detector({ formats: ["qr_code"] }) as typeof detector;
        } catch {
          detector = null;
        }
      }
      if (!detector) {
        const mod = await import("jsqr");
        const jsQR = (mod as unknown as { default: typeof decodeFallback }).default ?? (mod as unknown as typeof decodeFallback);
        decodeFallback = jsQR;
      }
    };

    const handleDetected = (value: string) => {
      if (lockRef.current || cancelled) return;
      lockRef.current = true;
      setIsLocked(true);
      setScanning(false);
      onDecodeRef.current(value);
    };

    const tick = async () => {
      if (cancelled || lockRef.current) return;
      const video = camera.videoRef.current;
      if (!lockRef.current && video && video.readyState >= 2 && video.videoWidth > 0) {
        try {
          if (detector) {
            const results = await detector.detect(video);
            const value = results[0]?.rawValue;
            if (value && !lockRef.current) {
              handleDetected(value);
            }
          } else if (decodeFallback) {
            const canvas = (canvasRef.current ??= document.createElement("canvas"));
            const width = Math.min(video.videoWidth, 640);
            const scale = width / video.videoWidth;
            canvas.width = width;
            canvas.height = Math.round(video.videoHeight * scale);
            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const frame = context.getImageData(0, 0, canvas.width, canvas.height);
              const result = decodeFallback(frame.data, canvas.width, canvas.height);
              if (result?.data && !lockRef.current) {
                handleDetected(result.data);
              }
            }
          }
        } catch {
          /* a single bad frame must not kill the loop */
        }
      }
      if (!cancelled && !lockRef.current) {
        rafRef.current = requestAnimationFrame(() => void tick());
      }
    };

    void setup().then(() => {
      if (!cancelled && !lockRef.current) {
        rafRef.current = requestAnimationFrame(() => void tick());
      }
    });

    return () => {
      cancelled = true;
      setScanning(false);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [camera.state, camera.videoRef, enabled]);

  return {
    cameraState: camera.state === "camera_ready" && scanning && !isLocked ? ("scanning" as const) : camera.state,
    detail: camera.detail,
    videoRef: camera.videoRef,
    isLocked,
    start: camera.start,
    stop: camera.stop,
    lock,
    pause,
    resume,
    reset,
  };
}
