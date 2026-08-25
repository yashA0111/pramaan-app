/**
 * Pramaan credential-reference encoding.
 *
 * A credential QR carries a reference only — never identity data. The
 * reference is resolved server-side against the registry.
 *
 * Canonical form:
 *   pramaan://verify/PRM-DEMO-0001
 *
 * For demo interoperability we also accept a bare credential reference and
 * common HTTPS forms that carry the same reference in the pathname/query.
 */

export const CREDENTIAL_REFERENCE_PATTERN = /^PRM-[A-Z0-9]{2,8}-\d{4}$/;

const SCHEME_PREFIX = "pramaan://verify/";

export function formatCredentialUri(reference: string): string {
  return `${SCHEME_PREFIX}${reference.trim().toUpperCase()}`;
}

export type ParsedQr =
  | { kind: "reference"; reference: string }
  | { kind: "unrecognized" }
  | { kind: "invalid" };

/**
 * Parses a raw decoded QR payload.
 * - reference      — a well-formed Pramaan credential reference.
 * - unrecognized   — readable QR, but not a Pramaan credential.
 * - invalid        — a Pramaan URI whose reference is malformed.
 *
 * Besides the canonical Pramaan URI, the parser accepts demo-friendly URLs
 * such as https://pramaan.example/verify/PRM-DEMO-0010 and
 * https://pramaan.example/verify?credential=PRM-DEMO-0010.
 */
export function parseQrPayload(raw: string): ParsedQr {
  const value = raw.trim();
  if (!value) return { kind: "unrecognized" };

  if (value.toLowerCase().startsWith(SCHEME_PREFIX)) {
    const reference = extractReferenceAfter(value, SCHEME_PREFIX);
    if (!reference) return { kind: "invalid" };
    return CREDENTIAL_REFERENCE_PATTERN.test(reference)
      ? { kind: "reference", reference }
      : { kind: "invalid" };
  }

  const bare = value.toUpperCase();
  if (CREDENTIAL_REFERENCE_PATTERN.test(bare)) {
    return { kind: "reference", reference: bare };
  }

  try {
    const url = new URL(value);
    const pathMatch = url.pathname.match(/(?:^|\/)verify\/([^/]+)\/?$/i);
    const queryReference =
      url.searchParams.get("credential") ??
      url.searchParams.get("credentialReference") ??
      url.searchParams.get("reference");
    const reference = (pathMatch?.[1] ?? queryReference ?? "").trim().toUpperCase();

    if (!reference) return { kind: "unrecognized" };
    if (!CREDENTIAL_REFERENCE_PATTERN.test(reference)) return { kind: "invalid" };
    return { kind: "reference", reference };
  } catch {
    return { kind: "unrecognized" };
  }
}

function extractReferenceAfter(value: string, prefix: string): string {
  return value.slice(prefix.length).split(/[?#/]/)[0]?.trim().toUpperCase() ?? "";
}
