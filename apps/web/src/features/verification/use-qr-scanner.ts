import { useCallback, useEffect, useRef, useState } from "react";

import { useCamera } from "./use-camera";

interface UseQrScannerOptions {
  /** Called once per decoded payload; the scanner pauses afterwards. */
  onDecode: (raw: string) => void;
  enabled?: boolean;
}

/**
 * Real browser QR scanning. Uses the native BarcodeDetector where available
 * and falls back to jsQR (loaded lazily, browser-only) elsewhere.
 */
export function useQrScanner({ onDecode, enabled = true }: UseQrScannerOptions) {
  const camera = useCamera({ facingMode: "environment" });
  const [scanning, setScanning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lockRef = useRef(false);
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;

  const pause = useCallback(() => {
    lockRef.current = true;
    setScanning(false);
  }, []);

  const resume = useCallback(() => {
    lockRef.current = false;
    setScanning(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (camera.state !== "camera_ready") return;

    let cancelled = false;
    let detector: { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> } | null = null;
    let decodeFallback: ((data: Uint8ClampedArray, w: number, h: number) => { data: string } | null) | null = null;

    lockRef.current = false;
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

    const tick = async () => {
      if (cancelled) return;
      const video = camera.videoRef.current;
      if (!lockRef.current && video && video.readyState >= 2 && video.videoWidth > 0) {
        try {
          if (detector) {
            const results = await detector.detect(video);
            const value = results[0]?.rawValue;
            if (value) {
              lockRef.current = true;
              setScanning(false);
              onDecodeRef.current(value);
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
              if (result?.data) {
                lockRef.current = true;
                setScanning(false);
                onDecodeRef.current(result.data);
              }
            }
          }
        } catch {
          /* a single bad frame must not kill the loop */
        }
      }
      if (!cancelled) rafRef.current = requestAnimationFrame(() => void tick());
    };

    void setup().then(() => {
      if (!cancelled) rafRef.current = requestAnimationFrame(() => void tick());
    });

    return () => {
      cancelled = true;
      setScanning(false);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [camera.state, camera.videoRef, enabled]);

  return {
    cameraState: camera.state === "camera_ready" && scanning ? ("scanning" as const) : camera.state,
    detail: camera.detail,
    videoRef: camera.videoRef,
    start: camera.start,
    stop: camera.stop,
    pause,
    resume,
  };
}
