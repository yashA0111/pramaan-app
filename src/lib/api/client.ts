/**
 * Mock API boundary.
 *
 * This is the ONLY place mock data enters the app. Every feature calls
 * through this client; when a real backend arrives, the implementations
 * behind these functions change — the view models and UI do not.
 *
 * Latency is simulated so loading/error/empty states are real.
 */

export type ApiErrorKind =
  "network" | "timeout" | "unavailable" | "unauthorized" | "forbidden" | "session_expired";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;

  constructor(kind: ApiErrorKind, message: string) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
  }
}

export interface MockRequestOptions {
  /** Override latency; defaults to a realistic 350–900ms jitter. */
  latencyMs?: number;
  /** Simulate a failure mode for a call (used by demo controls). */
  failWith?: ApiErrorKind;
  signal?: AbortSignal;
}

function jitteredLatency(): number {
  return 350 + Math.floor(Math.random() * 550);
}

export function mockRequest<T>(produce: () => T, options: MockRequestOptions = {}): Promise<T> {
  const latency = options.latencyMs ?? jitteredLatency();

  return new Promise<T>((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      if (options.failWith) {
        reject(new ApiError(options.failWith, `Mock request failed: ${options.failWith}`));
        return;
      }
      resolve(produce());
    }, latency);

    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    const cleanup = () => {
      options.signal?.removeEventListener("abort", onAbort);
    };

    options.signal?.addEventListener("abort", onAbort);
  });
}
