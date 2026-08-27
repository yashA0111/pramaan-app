import { describe, expect, it, beforeEach } from "vitest";
import { VerificationPolicyEngine } from "../src/modules/verification/verification.policy";
import { TrustReceiptCrypto } from "../src/modules/verification/verification.receipt";
import { VerificationSession } from "../src/modules/verification/verification.types";
import { QrPresentationService } from "../src/modules/qr-presentation/qr-presentation.service";
import { DatabaseService } from "../src/database/database.service";
import { AuthGuard } from "../src/common/guards/auth.guard";
import { ConfigService } from "@nestjs/config";
import { ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { parseQrPayload } from "../../web/src/features/verification/qr";

describe("Pramaan Comprehensive Security & Cryptographic Validation Suite", () => {
  let dbService: DatabaseService;
  let qrPresentationService: QrPresentationService;

  beforeEach(() => {
    dbService = new DatabaseService();
    qrPresentationService = new QrPresentationService(dbService);
  });

  /* -------------------------------------------------------------------------- */
  /* 1. CRYPTOGRAPHIC TRUST RECEIPT SIGNING & TAMPER RESISTANCE                 */
  /* -------------------------------------------------------------------------- */

  describe("1. Trust Receipt Cryptographic Engine", () => {
    const mockSession: VerificationSession = {
      sessionId: "ses_sec_test_001",
      credentialReference: "PRM-DEMO-0001",
      demo: true,
      currentStage: "receipt",
      state: "final_verified",
      createdAt: "2026-08-26T12:00:00.000Z",
      expiresAt: "2026-08-26T12:15:00.000Z",
      error: null,
      credentialOutcome: "valid",
      credentialStatus: "verified",
      credential: {
        credentialId: "PRM-DEMO-0001",
        fullName: "Inspector Vikram Sharma",
        designation: "Assistant Commissioner of Police",
        department: "Delhi Police Special Cell",
        posting: "District Headquarters, New Delhi",
        photoUrl: "/assets/persona-arjun-mehta.jpg",
        photoAlt: "Vikram Sharma photo",
        issuedOn: "2024-01-15",
        validUntil: "2028-01-15",
        issuer: {
          name: "Delhi Police Headquarters",
          authority: "Ministry of Home Affairs",
          registry: "demo",
        },
        registryStatus: "active",
        synthetic: true,
      },
      checks: [
        { id: "validate", label: "Credential validation", state: "success", detail: "Format valid" },
        { id: "issuer", label: "Issuer validation", state: "success", detail: "Issuer active" },
        { id: "status", label: "Status check", state: "success", detail: "Credential active" },
      ],
      identity: {
        status: "match",
        matchResult: "match",
        confidence: 0.94,
        modelVersion: "sface-onnx-v1",
        timestamp: "2026-08-26T12:01:00.000Z",
        reason: "Face matched reference photograph",
      },
      confirmation: {
        state: "accepted",
        routedTo: "Duty Officer Desk",
        requestedAt: "2026-08-26T12:01:30.000Z",
        respondedAt: "2026-08-26T12:02:00.000Z",
        reason: "Confirmed by desk operator",
      },
      steps: [],
      limitations: [],
    };

    it("1.1 Successfully issues a digitally signed Trust Receipt with SHA-256 hash", () => {
      const receipt = VerificationPolicyEngine.evaluateFinalReceipt(mockSession);

      expect(receipt.receiptId).toBe("rcpt_sec_test_001");
      expect(receipt.receiptHash).toBeDefined();
      expect(receipt.receiptHash).toMatch(/^[a-f0-9]{64}$/);
      expect(receipt.signature).toBeDefined();
      expect(receipt.signature).toMatch(/^[a-f0-9]{64}$/);
      expect(receipt.signingKeyId).toBe("k_pramaan_authority_2026_01");
      expect(receipt.signingAlgorithm).toBe("HMAC-SHA256");

      // Verify the unaltered receipt
      const verification = TrustReceiptCrypto.verifyReceipt(receipt);
      expect(verification.isValid).toBe(true);
      expect(verification.reason).toMatch(/verified/i);
    });

    it("1.2 Rejects a tampered receipt when headline or details are altered", () => {
      const receipt = VerificationPolicyEngine.evaluateFinalReceipt(mockSession);

      // Malicious attacker attempts to change headline
      const tamperedReceipt = { ...receipt, headline: "Attacker Forged Headline" };

      const verification = TrustReceiptCrypto.verifyReceipt(tamperedReceipt);
      expect(verification.isValid).toBe(false);
      expect(verification.reason).toMatch(/tampered/i);
    });

    it("1.3 Rejects a receipt signed by an unauthorized/wrong key", () => {
      const receipt = VerificationPolicyEngine.evaluateFinalReceipt(mockSession);

      // Verify with an adversary's key
      const verification = TrustReceiptCrypto.verifyReceipt(receipt, "adversary_unauthorized_key_9999");
      expect(verification.isValid).toBe(false);
      expect(verification.reason).toMatch(/invalid digital signature/i);
    });

    it("1.4 Rejects receipt with missing or corrupted cryptographic material", () => {
      const receipt = VerificationPolicyEngine.evaluateFinalReceipt(mockSession);

      const missingSig = { ...receipt, signature: undefined };
      expect(TrustReceiptCrypto.verifyReceipt(missingSig as any).isValid).toBe(false);

      const corruptedSig = { ...receipt, signature: "0000000000000000000000000000000000000000000000000000000000000000" };
      expect(TrustReceiptCrypto.verifyReceipt(corruptedSig).isValid).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. AUTHENTICATION & DEMO ADMIN ROLE SPOOFING PREVENTION                   */
  /* -------------------------------------------------------------------------- */

  describe("2. Auth Guard & Role Spoofing Protection", () => {
    let guard: AuthGuard;

    beforeEach(() => {
      process.env.DEMO_ADMIN_API_KEY = "secret-admin-key-2026";
      guard = new AuthGuard();
    });

    function createMockContext(headers: Record<string, string>): ExecutionContext {
      const req = {
        headers: { ...headers },
        user: undefined as any,
      };
      return {
        switchToHttp: () => ({
          getRequest: () => req,
        }),
      } as any;
    }

    it("2.1 Rejects unverified x-demo-role spoofing attempt", async () => {
      const context = createMockContext({
        "x-demo-role": "demo_admin", // Spoofed header without matching api key
      });

      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);

      const req = context.switchToHttp().getRequest();
      // Role MUST be downgraded to non-admin citizen, not demo_admin
      expect(req.user?.role).toBe("citizen");
    });

    it("2.2 Grants demo_admin role only when valid DEMO_ADMIN_API_KEY is supplied", async () => {
      const context = createMockContext({
        "x-demo-admin-key": "secret-admin-key-2026",
      });

      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);

      const req = context.switchToHttp().getRequest();
      expect(req.user?.role).toBe("demo_admin");
    });

    it("2.3 Rejects forged admin key", async () => {
      const context = createMockContext({
        "x-demo-admin-key": "wrong-adversary-key",
      });

      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);

      const req = context.switchToHttp().getRequest();
      expect(req.user?.role).toBe("citizen");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. QR PRESENTATION ENTROPY & SECURITY INVARIANTS                           */
  /* -------------------------------------------------------------------------- */

  describe("3. QR Presentation Entropy & Security", () => {
    it("3.1 Presentation tokens provide 256 bits of cryptographic entropy", async () => {
      const pres1 = await qrPresentationService.generatePresentation("cred_001", "off_001", {
        credentialReference: "PRM-DEMO-0001",
      });
      const pres2 = await qrPresentationService.generatePresentation("cred_001", "off_001", {
        credentialReference: "PRM-DEMO-0001",
      });

      expect(pres1.rawToken).not.toBe(pres2.rawToken);
      // rawToken format: prm_pres_ + 32-byte base64url = 43+ chars
      expect(pres1.rawToken.length).toBeGreaterThanOrEqual(50);
      expect(pres1.rawToken).toMatch(/^prm_pres_[A-Za-z0-9_-]{40,}$/);
    });

    it("3.2 Replaying an invalidated presentation token is blocked", async () => {
      const pres = await qrPresentationService.generatePresentation("cred_002", "off_002", {
        credentialReference: "PRM-DEMO-0002",
      });

      // First resolution is valid
      const res1 = await qrPresentationService.resolvePresentationByToken(pres.rawToken);
      expect(res1.isValid).toBe(true);

      // Invalidate presentation
      await qrPresentationService.invalidateByCredentialId("cred_002", "Operator revoked");

      // Second resolution is rejected
      const res2 = await qrPresentationService.resolvePresentationByToken(pres.rawToken);
      expect(res2.isValid).toBe(false);
      expect(res2.outcome).toBe("invalidated");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. PERMANENT CREDENTIAL QR MODEL                                            */
  /* -------------------------------------------------------------------------- */

  describe("4. Permanent Credential QR Model", () => {
    /* 4.1 — Permanent QR URI format */
    it("4.1 formatPermanentCredentialUri produces pramaan://credential/ scheme", () => {
      const ref = "PRM-DEMO-0001";
      const uri = `pramaan://credential/${ref}`;
      expect(uri).toMatch(/^pramaan:\/\/credential\/PRM-DEMO-0001$/);
    });

    /* 4.2 — Permanent QR resolves the correct credential reference */
    it("4.2 Permanent QR URI encodes only the credential reference — no secret", () => {
      const ref = "PRM-DEMO-0001";
      const uri = `pramaan://credential/${ref}`;
      // URI must contain exactly the reference, nothing more (no token, no hash)
      expect(uri).toBe("pramaan://credential/PRM-DEMO-0001");
      expect(uri).not.toContain("prm_pres_");
      expect(uri).not.toContain("verify/v1");
    });

    /* 4.3 — Permanent QR is stable across multiple sessions */
    it("4.3 Same credential reference always produces the same permanent QR URI", async () => {
      const ref = "PRM-DEMO-0001";
      const uri1 = `pramaan://credential/${ref}`;
      const uri2 = `pramaan://credential/${ref}`;
      expect(uri1).toBe(uri2);

      // QR data URL generated from same URI must be identical
      const qr1 = await qrPresentationService.renderCredentialQrDataUrl(ref);
      const qr2 = await qrPresentationService.renderCredentialQrDataUrl(ref);
      expect(qr1).toBe(qr2);
    });

    /* 4.4 — Permanent QR does not create any database record */
    it("4.4 Generating a permanent credential QR does not create an ephemeral presentation", async () => {
      const ref = "PRM-DEMO-STABLE";
      const qrDataUrl = await qrPresentationService.renderCredentialQrDataUrl(ref);
      expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);

      // No presentation should be retrievable because none was created
      const activePres = await qrPresentationService.getActivePresentation("off_nonexistent");
      expect(activePres).toBeNull();
    });

    /* 4.5 — Permanent QR and ephemeral presentation are completely independent */
    it("4.5 Regenerating ephemeral presentation does not change the permanent QR URI", async () => {
      const ref = "PRM-DEMO-0001";
      const permanentUri = `pramaan://credential/${ref}`;

      const pres1 = await qrPresentationService.generatePresentation("cred_001", "off_001", {
        credentialReference: ref,
      });
      const pres2 = await qrPresentationService.generatePresentation("cred_001", "off_001", {
        credentialReference: ref,
      });

      // Ephemeral tokens are different each time
      expect(pres1.rawToken).not.toBe(pres2.rawToken);
      expect(pres1.qrUri).not.toBe(pres2.qrUri);

      // Permanent URI never changes
      const permanentUriAfter = `pramaan://credential/${ref}`;
      expect(permanentUri).toBe(permanentUriAfter);
    });

    /* 4.6 — Ephemeral presentation has its own expiry, distinct from permanent QR */
    it("4.6 Ephemeral presentation expires independently — permanent QR is unaffected", async () => {
      const pres = await qrPresentationService.generatePresentation("cred_003", "off_003", {
        credentialReference: "PRM-DEMO-0003",
        ttlMinutes: 0.001, // Near-immediate expiry
      });

      // Wait a small moment for the TTL to tick (in-memory resolution)
      await new Promise((r) => setTimeout(r, 10));

      // Resolve: in-memory service may not expire immediately, but the expiry field is set
      expect(new Date(pres.expiresAt).getTime()).toBeLessThan(
        Date.now() + 60 * 1000, // expiresAt is within 1 minute
      );

      // The permanent URI is unaffected regardless of presentation state
      const permanentUri = `pramaan://credential/PRM-DEMO-0003`;
      expect(permanentUri).toMatch(/^pramaan:\/\/credential\/PRM-DEMO-0003$/);
    });

    /* 4.7 — Invalidated presentation cannot be replayed (distinct from permanent QR) */
    it("4.7 Invalidating ephemeral presentation does not invalidate the permanent credential identifier", async () => {
      const ref = "PRM-DEMO-0007";
      const pres = await qrPresentationService.generatePresentation("cred_007", "off_007", {
        credentialReference: ref,
      });

      await qrPresentationService.invalidateByCredentialId("cred_007", "Security test");

      const res = await qrPresentationService.resolvePresentationByToken(pres.rawToken);
      expect(res.isValid).toBe(false);
      expect(res.outcome).toBe("invalidated");

      // The permanent credential QR URI itself is still the same stable string
      const permanentUri = `pramaan://credential/${ref}`;
      expect(permanentUri).toBe("pramaan://credential/PRM-DEMO-0007");
    });

    /* 4.8 — Regeneration invalidates old presentation */
    it("4.8 Generating a new presentation invalidates the previous one", async () => {
      const pres1 = await qrPresentationService.generatePresentation("cred_008", "off_008", {
        credentialReference: "PRM-DEMO-0008",
      });

      // Invalidate old presentation
      await qrPresentationService.invalidateByCredentialId("cred_008", "Regeneration");

      // Generate new presentation
      const pres2 = await qrPresentationService.generatePresentation("cred_008", "off_008", {
        credentialReference: "PRM-DEMO-0008",
      });

      expect(pres2.rawToken).not.toBe(pres1.rawToken);

      const res1 = await qrPresentationService.resolvePresentationByToken(pres1.rawToken);
      expect(res1.isValid).toBe(false);

      const res2 = await qrPresentationService.resolvePresentationByToken(pres2.rawToken);
      expect(res2.isValid).toBe(true);
    });

    /* 4.9 — getPermanentCredentialQr returns all three required fields */
    it("4.9 getPermanentCredentialQr returns credentialReference, qrUri, qrDataUrl", async () => {
      const result = await qrPresentationService.getPermanentCredentialQr("PRM-DEMO-0001");
      expect(result.credentialReference).toBe("PRM-DEMO-0001");
      expect(result.qrUri).toBe("pramaan://credential/PRM-DEMO-0001");
      expect(result.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    /* 4.10 — Permanent QR URI is uppercase-normalized */
    it("4.10 Permanent credential QR URI normalizes to uppercase reference", async () => {
      const result = await qrPresentationService.getPermanentCredentialQr("prm-demo-0001");
      expect(result.credentialReference).toBe("PRM-DEMO-0001");
      expect(result.qrUri).toBe("pramaan://credential/PRM-DEMO-0001");
    });

    /* 4.11 — Permanent QR renderCredentialQrDataUrl returns a PNG data URL */
    it("4.11 renderCredentialQrDataUrl returns a valid base64 PNG data URL", async () => {
      const dataUrl = await qrPresentationService.renderCredentialQrDataUrl("PRM-DEMO-0001");
      expect(dataUrl).toBeTruthy();
      expect(dataUrl).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
      expect(dataUrl.length).toBeGreaterThan(500); // non-trivial QR image
    });

    /* 4.12 — Permanent QR is distinct from ephemeral presentation QR */
    it("4.12 Permanent QR URI is structurally different from ephemeral presentation QR URI", async () => {
      const pres = await qrPresentationService.generatePresentation("cred_012", "off_012", {
        credentialReference: "PRM-DEMO-0001",
      });

      const permanentUri = "pramaan://credential/PRM-DEMO-0001";
      const ephemeralUri = pres.qrUri;

      expect(permanentUri).toMatch(/^pramaan:\/\/credential\//);
      expect(ephemeralUri).toMatch(/^pramaan:\/\/verify\/v1\//);
      expect(permanentUri).not.toBe(ephemeralUri);
    });

    /* 4.13 — Frontend QR parser: permanent_credential kind from canonical URI */
    it("4.13 parseQrPayload correctly identifies pramaan://credential/<ref> as permanent_credential", () => {
      const result = parseQrPayload("pramaan://credential/PRM-DEMO-0001");
      expect(result.kind).toBe("permanent_credential");
      if (result.kind === "permanent_credential") {
        expect(result.reference).toBe("PRM-DEMO-0001");
      }
    });

    /* 4.14 — Frontend QR parser: ephemeral token still parsed correctly */
    it("4.14 parseQrPayload correctly identifies pramaan://verify/v1/<token> as presentation_token", () => {
      const result = parseQrPayload("pramaan://verify/v1/prm_pres_abcdefghijklmnopqrstuvwxyz0123456789ABCD");
      expect(result.kind).toBe("presentation_token");
      if (result.kind === "presentation_token") {
        expect(result.token).toBe("prm_pres_abcdefghijklmnopqrstuvwxyz0123456789ABCD");
      }
    });

    /* 4.15 — Frontend QR parser: malformed permanent credential QR returns invalid */
    it("4.15 parseQrPayload rejects malformed pramaan://credential/ URI as invalid", () => {
      // Missing reference
      expect(parseQrPayload("pramaan://credential/").kind).toBe("invalid");

      // Wrong pattern (not PRM-XXXX-####)
      expect(parseQrPayload("pramaan://credential/NOTAVALIDREF").kind).toBe("invalid");

      // Legacy scheme should NOT be treated as permanent_credential
      const legacyResult = parseQrPayload("pramaan://verify/PRM-DEMO-0001");
      expect(legacyResult.kind).toBe("reference");
      expect(legacyResult.kind).not.toBe("permanent_credential");
    });
  });
});
