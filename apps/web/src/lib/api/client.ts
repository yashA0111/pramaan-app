/**
 * Pramaan API client boundary.
 *
 * Connects the frontend to the NestJS backend API over HTTP with automatic
 * typed error parsing and graceful local fallback when the API server is not running
 * or when VITE_USE_MOCK=true.
 */

export type ApiErrorKind =
  | "network"
  | "timeout"
  | "unavailable"
  | "unauthorized"
  | "forbidden"
  | "session_expired";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;

  constructor(kind: ApiErrorKind, message: string) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
  }
}

function normalizeApiBaseUrl(rawUrl?: string): string {
  if (!rawUrl) return "http://localhost:3001/api/v1";
  let url = rawUrl.trim().replace(/\/+$/, "");
  if (!url.endsWith("/api/v1")) {
    if (url.endsWith("/api")) {
      url = `${url}/v1`;
    } else {
      url = `${url}/api/v1`;
    }
  }
  return url;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_API_URL"]) || undefined,
);

export function buildEndpointUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (cleanEndpoint.startsWith("/api/v1/")) {
    const baseWithoutPrefix = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
    return `${baseWithoutPrefix}${cleanEndpoint}`;
  }
  return `${API_BASE_URL}${cleanEndpoint}`;
}

export const IS_MOCK_FORCED =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_USE_MOCK"] === "true") ||
  (typeof process !== "undefined" && (process.env["NODE_ENV"] === "test" || process.env["VITEST"] === "true"));

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  latencyMs?: number;
  failWith?: ApiErrorKind;
}

function jitteredLatency(): number {
  return 350 + Math.floor(Math.random() * 550);
}

function demoSessionHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("pramaan.demo.session");
    if (!raw) return {};
    const user = JSON.parse(raw) as { id?: string; role?: string; email?: string; displayName?: string };
    if (!user.id || !user.role) return {};
    return {
      "x-user-id": user.id,
      "x-demo-role": user.role,
      "x-user-email": user.email || "",
      "x-user-name": user.displayName || "",
      ...(user.role === "demo_admin" && import.meta.env["VITE_DEMO_ADMIN_API_KEY"]
        ? { "x-demo-admin-key": import.meta.env["VITE_DEMO_ADMIN_API_KEY"] }
        : {}),
    };
  } catch {
    return {};
  }
}

/**
 * Executes a mock fallback when offline or in simulated test environments.
 */
export function mockRequest<T>(produce: () => T, options: RequestOptions = {}): Promise<T> {
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
      try {
        resolve(produce());
      } catch (err) {
        reject(err);
      }
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

/**
 * Main HTTP API invocation with typed error handling and transparent fallback.
 */
export async function apiRequest<T>(
  endpoint: string,
  fetchOptions: RequestInit = {},
  fallbackProducer?: () => T,
  mockOpts: RequestOptions = {},
): Promise<T> {
  if (IS_MOCK_FORCED && fallbackProducer) {
    return mockRequest(fallbackProducer, mockOpts);
  }

  const url = buildEndpointUrl(endpoint);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...demoSessionHeaders(),
        ...fetchOptions.headers,
      },
    });

    if (!res.ok) {
      let errBody: any = null;
      try {
        errBody = await res.json();
      } catch {
        // non-JSON error
      }

      const message = errBody?.message || res.statusText || "Request failed";
      let kind: ApiErrorKind = "network";
      if (res.status === 401) kind = "unauthorized";
      else if (res.status === 403) kind = "forbidden";
      else if (res.status === 404) kind = "unavailable";
      else if (res.status === 408 || res.status === 504) kind = "timeout";
      else if (res.status === 410) kind = "session_expired";
      else if (res.status >= 500) kind = "unavailable";

      throw new ApiError(kind, message);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }

    // If server is not running or network failed, fallback gracefully if producer is provided
    if (fallbackProducer) {
      return mockRequest(fallbackProducer, mockOpts);
    }

    throw new ApiError("network", err.message || "Could not connect to backend server");
  }
}
