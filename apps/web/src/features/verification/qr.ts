/**
 * Pramaan credential-reference encoding.
 *
 * A credential QR carries a *reference only* — never identity data. The
 * reference is resolved server-side (mocked for now) against the registry.
 *
 *   pramaan://verify/PRM-DEMO-0001
 */

export const CREDENTIAL_REFERENCE_PATTERN = /^PRM-[A-Z0-9]{2,8}-\d{4}$/;

const SCHEME_PREFIX = "pramaan://verify/";

export function formatCredentialUri(reference: string): string {
  return `${SCHEME_PREFIX}${reference}`;
}

export type ParsedQr =
  | { kind: "reference"; reference: string }
  | { kind: "unrecognized" }
  | { kind: "invalid" };

/**
 * Parses a raw decoded QR payload.
 * - `reference`      — a well-formed Pramaan credential reference.
 * - `unrecognized`   — readable QR, but not a Pramaan credential.
 * - `invalid`        — a Pramaan URI whose reference is malformed.
 */
export function parseQrPayload(raw: string): ParsedQr {
  const value = raw.trim();
  if (!value) return { kind: "unrecognized" };

  if (!value.toLowerCase().startsWith(SCHEME_PREFIX)) {
    // A bare reference is also accepted (printed cards, manual entry).
    if (CREDENTIAL_REFERENCE_PATTERN.test(value.toUpperCase())) {
      return { kind: "reference", reference: value.toUpperCase() };
    }
    return { kind: "unrecognized" };
  }

  const reference = value.slice(SCHEME_PREFIX.length).split(/[?#/]/)[0]?.toUpperCase() ?? "";
  if (!CREDENTIAL_REFERENCE_PATTERN.test(reference)) {
    return { kind: "invalid" };
  }
  return { kind: "reference", reference };
}
