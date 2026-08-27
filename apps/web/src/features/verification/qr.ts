/**
 * Pramaan QR Presentation & Credential Parsing.
 *
 * Three QR formats are supported:
 *
 * 1. Permanent Credential QR (canonical, physical ID card):
 *      pramaan://credential/<ref>
 *    → stable, suitable for printing, does NOT expire
 *    → parsed as: { kind: "permanent_credential"; reference: string }
 *
 * 2. Ephemeral Verification Presentation (server-generated, short-lived):
 *      pramaan://verify/v1/<opaque-token>
 *    → short-lived, SHA-256 hashed, replay-resistant
 *    → parsed as: { kind: "presentation_token"; token: string; rawUri: string }
 *
 * 3. Legacy / Dev direct reference:
 *      pramaan://verify/<ref>  or  bare PRM-XXXX-####
 *    → resolved authoritatively server-side
 *    → parsed as: { kind: "reference"; reference: string }
 */

export const CREDENTIAL_REFERENCE_PATTERN = /^PRM-[A-Z0-9]{2,8}-\d{4}$/;

// Permanent credential QR scheme — printed on physical ID cards
const SCHEME_CREDENTIAL_PREFIX = "pramaan://credential/";

// Ephemeral presentation and legacy schemes
const SCHEME_PREFIX = "pramaan://verify/";
const SCHEME_V1_PREFIX = "pramaan://verify/v1/";

/**
 * Formats a canonical permanent credential QR URI.
 * This is the URI that should be encoded in a physical ID card QR.
 * It is stable and does not expire.
 */
export function formatPermanentCredentialUri(reference: string): string {
  return `${SCHEME_CREDENTIAL_PREFIX}${reference.toUpperCase()}`;
}

/**
 * Formats an ephemeral verification presentation URI.
 * This is the URI encoded in a server-generated short-lived QR token.
 */
export function formatPresentationUri(token: string): string {
  return `${SCHEME_V1_PREFIX}${token}`;
}

/** @deprecated Use formatPermanentCredentialUri for permanent credential QRs */
export function formatCredentialUri(reference: string): string {
  return `${SCHEME_PREFIX}${reference}`;
}

export type ParsedQr =
  | { kind: "permanent_credential"; reference: string }
  | { kind: "presentation_token"; token: string; rawUri: string }
  | { kind: "reference"; reference: string }
  | { kind: "unrecognized" }
  | { kind: "invalid" };

/**
 * Parses a raw decoded QR payload.
 *
 * - `permanent_credential` — Canonical permanent credential QR (pramaan://credential/<ref>)
 *                           Suitable for physical ID cards. Does not expire.
 * - `presentation_token`   — Canonical v1 opaque ephemeral presentation.
 * - `reference`            — Legacy/direct credential reference (dev/fallback).
 * - `unrecognized`         — Readable QR, but not a Pramaan presentation.
 * - `invalid`              — Pramaan URI with malformed or missing content.
 */
export function parseQrPayload(raw: string): ParsedQr {
  const value = raw.trim();
  if (!value) return { kind: "unrecognized" };

  // 1. Canonical Permanent Credential QR: pramaan://credential/<ref>
  //    Printed on physical ID cards. Stable — does not expire.
  if (value.toLowerCase().startsWith(SCHEME_CREDENTIAL_PREFIX)) {
    const reference = value.slice(SCHEME_CREDENTIAL_PREFIX.length).split(/[?#/]/)[0]?.toUpperCase() ?? "";
    if (!CREDENTIAL_REFERENCE_PATTERN.test(reference)) {
      return { kind: "invalid" };
    }
    return { kind: "permanent_credential", reference };
  }

  // 2. Ephemeral Verification Presentation URI: pramaan://verify/v1/<opaque-token>
  //    Server-generated, short-lived. NOT printed on physical ID cards.
  if (value.toLowerCase().startsWith(SCHEME_V1_PREFIX)) {
    const token = value.slice(SCHEME_V1_PREFIX.length).split(/[?#/]/)[0]?.trim() ?? "";
    if (!token) {
      return { kind: "invalid" };
    }
    return { kind: "presentation_token", token, rawUri: value };
  }

  // 3. Legacy Scheme URI: pramaan://verify/PRM-XXXX-####
  if (value.toLowerCase().startsWith(SCHEME_PREFIX)) {
    const reference = value.slice(SCHEME_PREFIX.length).split(/[?#/]/)[0]?.toUpperCase() ?? "";
    if (!CREDENTIAL_REFERENCE_PATTERN.test(reference)) {
      return { kind: "invalid" };
    }
    return { kind: "reference", reference };
  }

  // 4. Bare Credential Reference
  if (CREDENTIAL_REFERENCE_PATTERN.test(value.toUpperCase())) {
    return { kind: "reference", reference: value.toUpperCase() };
  }

  return { kind: "unrecognized" };
}
