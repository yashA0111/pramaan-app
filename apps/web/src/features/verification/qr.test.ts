import { describe, expect, it } from "vitest";
import { formatCredentialUri, parseQrPayload } from "./qr";

describe("parseQrPayload", () => {
  it("accepts the canonical Pramaan URI", () => {
    expect(parseQrPayload("pramaan://verify/PRM-DEMO-0010")).toEqual({
      kind: "reference",
      reference: "PRM-DEMO-0010",
    });
  });

  it("accepts a bare credential reference", () => {
    expect(parseQrPayload("PRM-DEMO-0010")).toEqual({
      kind: "reference",
      reference: "PRM-DEMO-0010",
    });
  });

  it("accepts a normal HTTPS verify URL", () => {
    expect(parseQrPayload("https://demo.pramaan/verify/PRM-DEMO-0010")).toEqual({
      kind: "reference",
      reference: "PRM-DEMO-0010",
    });
  });

  it("accepts a credential query parameter", () => {
    expect(parseQrPayload("https://demo.pramaan/verify?credential=PRM-DEMO-0010")).toEqual({
      kind: "reference",
      reference: "PRM-DEMO-0010",
    });
  });

  it("rejects a malformed Pramaan reference", () => {
    expect(parseQrPayload("pramaan://verify/NOT-A-CREDENTIAL")).toEqual({ kind: "invalid" });
  });

  it("formats canonical references consistently", () => {
    expect(formatCredentialUri(" prm-demo-0010 ")).toBe("pramaan://verify/PRM-DEMO-0010");
  });
});
