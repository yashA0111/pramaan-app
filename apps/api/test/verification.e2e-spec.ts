import { describe, it, expect, beforeEach } from "vitest";
import { VerificationPolicyEngine } from "../src/modules/verification/verification.policy";
import { VerificationService } from "../src/modules/verification/verification.service";
import { CredentialsService } from "../src/modules/credentials/credentials.service";
import { GovernmentCredentialAdapter } from "../src/modules/credentials/government-credential.adapter";
import { IdentityService } from "../src/modules/identity/identity.service";
import { FastApiBiometricAdapter } from "../src/modules/identity/fastapi-biometric.adapter";
import { DeterministicBiometricAdapter } from "../src/modules/identity/deterministic-biometric.adapter";
import { ConfirmationService } from "../src/modules/confirmation/confirmation.service";
import { MockNotificationAdapter } from "../src/modules/confirmation/mock-notification.adapter";
import { AuditService } from "../src/modules/audit/audit.service";
import { DatabaseService } from "../src/database/database.service";
import { DemoAdminService } from "../src/modules/demo-admin/demo-admin.service";
import { StorageService } from "../src/modules/storage/storage.service";
import { LocalStorageAdapter } from "../src/modules/storage/local-storage.adapter";
import { SupabaseStorageAdapter } from "../src/modules/storage/supabase-storage.adapter";

describe("Pramaan Authoritative Backend & Policy Engine", () => {
  let dbService: DatabaseService;
  let auditService: AuditService;
  let govAdapter: GovernmentCredentialAdapter;
  let credService: CredentialsService;
  let deterministicBio: DeterministicBiometricAdapter;
  let fastApiBio: FastApiBiometricAdapter;
  let identityService: IdentityService;
  let notifAdapter: MockNotificationAdapter;
  let confirmationService: ConfirmationService;
  let verificationService: VerificationService;
  let demoAdminService: DemoAdminService;

  beforeEach(() => {
    dbService = new DatabaseService();
    auditService = new AuditService(dbService);
    govAdapter = new GovernmentCredentialAdapter(dbService);
    credService = new CredentialsService(govAdapter);
    deterministicBio = new DeterministicBiometricAdapter();
    fastApiBio = new FastApiBiometricAdapter(deterministicBio);
    identityService = new IdentityService(fastApiBio);
    notifAdapter = new MockNotificationAdapter();
    confirmationService = new ConfirmationService(dbService, notifAdapter, auditService);
    verificationService = new VerificationService(
      dbService,
      credService,
      identityService,
      confirmationService,
      auditService,
    );

    const localStore = new LocalStorageAdapter();
    const supabaseStore = new SupabaseStorageAdapter();
    const storageService = new StorageService(localStore, supabaseStore);
    demoAdminService = new DemoAdminService(dbService, storageService, auditService, govAdapter);
  });

  // Scenario 1: Correct QR + Match Face + Confirmation Accepted -> final_verified
  it("Scenario 1: correct QR + correct face + official confirmation -> final_verified", async () => {
    const scan = await verificationService.decodeQr("PRM-DEMO-0001");
    expect(scan.outcome).toBe("qr_decoded");
    expect(scan.credentialReference).toBe("PRM-DEMO-0001");

    const session = await verificationService.createSession("PRM-DEMO-0001", { demo: true });
    expect(session.state).toBe("validating");

    // Walk credential validation stages
    let current = await verificationService.advanceCredentialStage(session.sessionId);
    while (current.state === "validating") {
      current = await verificationService.advanceCredentialStage(session.sessionId);
    }
    expect(current.state).toBe("credential_resolved");
    expect(current.credentialOutcome).toBe("valid");

    // Run identity verification
    const identitySession = await verificationService.verifyIdentity(session.sessionId, {
      observation: "single_face",
    });
    expect(identitySession.identity?.matchResult).toBe("match");
    expect(identitySession.state).toBe("identity_resolved");

    // Request & poll official confirmation
    await verificationService.requestOfficialConfirmation(session.sessionId);
    // Poll confirmation (simulation resolves)
    const confirmedSession = await verificationService.pollOfficialConfirmation(session.sessionId);
    expect(confirmedSession.confirmation.state).toBe("accepted");
    expect(confirmedSession.state).toBe("final_verified");

    // Retrieve Trust Receipt
    const receipt = await verificationService.getTrustReceipt(session.sessionId);
    expect(receipt.finalState).toBe("final_verified");
    expect(receipt.status).toBe("verified");
  });

  // Scenario 2: Correct QR + Wrong Face -> identity_failed / not_verified
  it("Scenario 2: correct QR + wrong face -> identity_failed / not_verified", async () => {
    const session = await verificationService.createSession("PRM-DEMO-0006", { demo: true });
    let current = await verificationService.advanceCredentialStage(session.sessionId);
    while (current.state === "validating") {
      current = await verificationService.advanceCredentialStage(session.sessionId);
    }

    const identitySession = await verificationService.verifyIdentity(session.sessionId, {
      observation: "single_face",
    });
    expect(identitySession.identity?.matchResult).toBe("mismatch");
    expect(identitySession.state).toBe("identity_failed");

    const receipt = await verificationService.getTrustReceipt(session.sessionId);
    expect(receipt.finalState).toBe("not_verified");
    expect(receipt.status).toBe("mismatch");
  });

  // Scenario 3: Invalid QR -> credential_failed, identity not permitted
  it("Scenario 3: invalid QR -> credential_failed, identity blocked", async () => {
    const session = await verificationService.createSession("PRM-DEMO-0002", { demo: true });
    let current = await verificationService.advanceCredentialStage(session.sessionId);
    while (current.state === "validating") {
      current = await verificationService.advanceCredentialStage(session.sessionId);
    }
    expect(current.credentialOutcome).toBe("invalid");
    expect(current.state).toBe("credential_failed");

    await expect(
      verificationService.verifyIdentity(session.sessionId, { observation: "single_face" }),
    ).rejects.toThrow(/Identity matching requires a valid credential/i);

    const receipt = await verificationService.getTrustReceipt(session.sessionId);
    expect(receipt.finalState).toBe("not_verified");
    expect(receipt.status).toBe("invalid");
  });

  // Scenario 4: Valid QR + Inconclusive identity -> requires_review / credential_valid_only
  it("Scenario 4: valid QR + inconclusive identity -> requires_review", async () => {
    const session = await verificationService.createSession("PRM-DEMO-0007", { demo: true });
    let current = await verificationService.advanceCredentialStage(session.sessionId);
    while (current.state === "validating") {
      current = await verificationService.advanceCredentialStage(session.sessionId);
    }

    const identitySession = await verificationService.verifyIdentity(session.sessionId, {
      observation: "single_face",
    });
    expect(identitySession.identity?.matchResult).toBe("inconclusive");

    // Even if confirmed, inconclusive face must NEVER backfill final_verified
    await verificationService.requestOfficialConfirmation(session.sessionId);
    const confirmed = await verificationService.pollOfficialConfirmation(session.sessionId);
    expect(confirmed.confirmation.state).toBe("accepted");
    expect(confirmed.state).toBe("confirmation_resolved");

    const receipt = await verificationService.getTrustReceipt(session.sessionId);
    expect(receipt.finalState).toBe("credential_valid_only");
  });

  // Scenario 5: Official Rejection -> rejected / identity_matched_only
  it("Scenario 5: official rejection -> authority not established", async () => {
    const session = await verificationService.createSession("PRM-DEMO-0008", { demo: true });
    let current = await verificationService.advanceCredentialStage(session.sessionId);
    while (current.state === "validating") {
      current = await verificationService.advanceCredentialStage(session.sessionId);
    }

    await verificationService.verifyIdentity(session.sessionId, { observation: "single_face" });
    await verificationService.requestOfficialConfirmation(session.sessionId);
    const resolved = await verificationService.pollOfficialConfirmation(session.sessionId);

    expect(resolved.confirmation.state).toBe("rejected");
    expect(resolved.state).toBe("confirmation_failed");

    const receipt = await verificationService.getTrustReceipt(session.sessionId);
    expect(receipt.finalState).toBe("identity_matched_only");
    expect(receipt.status).toBe("rejected");
  });

  // Scenario 6: Expired credential -> expired
  it("Scenario 6: expired credential -> expired", async () => {
    const session = await verificationService.createSession("PRM-DEMO-0003", { demo: true });
    let current = await verificationService.advanceCredentialStage(session.sessionId);
    while (current.state === "validating") {
      current = await verificationService.advanceCredentialStage(session.sessionId);
    }

    expect(current.credentialOutcome).toBe("expired");
    expect(current.state).toBe("credential_failed");

    const receipt = await verificationService.getTrustReceipt(session.sessionId);
    expect(receipt.finalState).toBe("not_verified");
    expect(receipt.status).toBe("expired");
  });

  // Scenario 7: Revoked credential -> revoked
  it("Scenario 7: revoked credential -> revoked", async () => {
    const session = await verificationService.createSession("PRM-DEMO-0004", { demo: true });
    let current = await verificationService.advanceCredentialStage(session.sessionId);
    while (current.state === "validating") {
      current = await verificationService.advanceCredentialStage(session.sessionId);
    }

    expect(current.credentialOutcome).toBe("revoked");
    expect(current.state).toBe("credential_failed");

    const receipt = await verificationService.getTrustReceipt(session.sessionId);
    expect(receipt.finalState).toBe("not_verified");
    expect(receipt.status).toBe("revoked");
  });

  // Scenario 8: Demo Admin official creation and immediate verification participation
  it("Scenario 8: demo admin official creation & immediate verification participation", async () => {
    const newOfficial = await demoAdminService.createOfficial(
      {
        displayName: "Sub-Inspector Maya Sharma",
        registeredEmail: "maya.sharma@delhipolice.gov.in",
        designation: "Sub-Inspector",
        department: "Special Cell",
        postingLocation: "District Unit VI, New Delhi",
        credentialReference: "PRM-DEMO-0010",
      },
      "usr_admin_001",
    );

    expect(newOfficial.id).toBeDefined();
    expect(newOfficial.credential.reference).toBe("PRM-DEMO-0010");

    // Immediate participation in verification flow
    const scan = await verificationService.decodeQr("PRM-DEMO-0010");
    expect(scan.outcome).toBe("qr_decoded");

    const session = await verificationService.createSession("PRM-DEMO-0010", { demo: true });
    expect(session.credentialReference).toBe("PRM-DEMO-0010");
  });

  // Scenario 9: QR Image upload with mismatch reference is rejected
  it("Scenario 9: QR asset upload with mismatched payload is rejected", async () => {
    const official = await demoAdminService.createOfficial(
      {
        displayName: "Head Constable Vikram Singh",
        registeredEmail: "vikram.singh@delhipolice.gov.in",
        designation: "Head Constable",
        department: "Traffic Police",
        postingLocation: "North District",
        credentialReference: "PRM-DEMO-0011",
      },
      "usr_admin_001",
    );

    // Mismatched QR payload (PRM-DEMO-0001 instead of PRM-DEMO-0011)
    await expect(
      demoAdminService.uploadAsset(
        official.id,
        "qr",
        {
          buffer: Buffer.from("pramaan://verify/PRM-DEMO-0001"),
          originalname: "qr_wrong.png",
          mimetype: "image/png",
        },
        "usr_admin_001",
      ),
    ).rejects.toThrow(/QR payload mismatch/i);
  });
});
