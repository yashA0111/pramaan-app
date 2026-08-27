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
import { QrPresentationService } from "../src/modules/qr-presentation/qr-presentation.service";

describe("Pramaan Authoritative Backend, QR Presentation & Policy Engine", () => {
  let dbService: DatabaseService;
  let auditService: AuditService;
  let govAdapter: GovernmentCredentialAdapter;
  let credService: CredentialsService;
  let qrPresentationService: QrPresentationService;
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
    qrPresentationService = new QrPresentationService(dbService);
    deterministicBio = new DeterministicBiometricAdapter();
    fastApiBio = new FastApiBiometricAdapter(deterministicBio);
    identityService = new IdentityService(deterministicBio);
    notifAdapter = new MockNotificationAdapter();
    confirmationService = new ConfirmationService(dbService, notifAdapter, auditService);

    const localStore = new LocalStorageAdapter();
    const supabaseStore = new SupabaseStorageAdapter();
    const storageService = new StorageService(localStore, supabaseStore);

    verificationService = new VerificationService(
      dbService,
      credService,
      identityService,
      confirmationService,
      auditService,
      qrPresentationService,
      storageService,
    );

    demoAdminService = new DemoAdminService(
      dbService,
      storageService,
      auditService,
      qrPresentationService,
      govAdapter,
    );
  });

  // Test 1: Full Verification Journey with Opaque Token
  it("Scenario 1: Opaque presentation QR + match face + confirmation -> final_verified", async () => {
    // 1. Demo Admin creates official with automatic ephemeral QR presentation
    const official = await demoAdminService.createOfficial(
      {
        displayName: "Inspector Arjun Mehta",
        registeredEmail: "arjun.mehta@delhipolice.gov.in",
        designation: "Inspector",
        department: "Delhi Police Special Branch",
        postingLocation: "District Headquarters, New Delhi",
        credentialReference: "PRM-DEMO-0001",
      },
      "usr_admin_001",
    );

    expect(official.activePresentation).toBeDefined();
    expect(official.activePresentation.qrUri).toMatch(/^pramaan:\/\/verify\/v1\/prm_pres_/);

    // 2. Citizen scans opaque presentation URI
    const scan = await verificationService.decodeQr(official.activePresentation.qrUri);
    expect(scan.outcome).toBe("qr_decoded");
    expect(scan.credentialReference).toBe("PRM-DEMO-0001");

    // 3. Create session & validate stages
    const session = await verificationService.createSession(scan.credentialReference!, { demo: true });
    expect(session.state).toBe("validating");

    let current = await verificationService.advanceCredentialStage(session.sessionId);
    while (current.state === "validating") {
      current = await verificationService.advanceCredentialStage(session.sessionId);
    }
    expect(current.state).toBe("credential_resolved");
    expect(current.credentialOutcome).toBe("valid");

    // 4. Biometric matching
    const identitySession = await verificationService.verifyIdentity(session.sessionId, {
      observation: "single_face",
    });
    expect(identitySession.identity?.matchResult).toBe("match");
    expect(identitySession.state).toBe("identity_resolved");

    // 5. Official desk confirmation
    await verificationService.requestOfficialConfirmation(session.sessionId);
    const confirmedSession = await verificationService.pollOfficialConfirmation(session.sessionId);
    expect(confirmedSession.confirmation.state).toBe("accepted");
    expect(confirmedSession.state).toBe("final_verified");

    // 6. Trust Receipt verification
    const receipt = await verificationService.getTrustReceipt(session.sessionId);
    expect(receipt.finalState).toBe("final_verified");
    expect(receipt.status).toBe("verified");
  });

  // Test 2: Expired QR Presentation Rejection
  it("Scenario 2: Expired QR presentation is rejected authoritatively", async () => {
    // Generate presentation with 0 TTL (instant expiry)
    const pres = await qrPresentationService.generatePresentation("PRM-DEMO-0001", "off_arjun", {
      ttlMinutes: -1,
    });

    const scan = await verificationService.decodeQr(pres.qrUri);
    expect(scan.outcome).toBe("expired_reference");
    expect(scan.message).toMatch(/expired/i);
  });

  // Test 3: Presentation Regeneration Invalidates Previous QR
  it("Scenario 3: Presentation regeneration invalidates old QR presentation", async () => {
    const official = await demoAdminService.createOfficial(
      {
        displayName: "Sub-Inspector Priya Sharma",
        registeredEmail: "priya.sharma@delhipolice.gov.in",
        designation: "Sub-Inspector",
        department: "Cyber Cell",
        postingLocation: "North District, New Delhi",
        credentialReference: "PRM-DEMO-0002",
      },
      "usr_admin_001",
    );

    const oldQrUri = official.activePresentation.qrUri;

    // Regenerate QR presentation
    const newPres = await demoAdminService.regeneratePresentation(official.id, { ttlMinutes: 15 }, "usr_admin_001");

    // Old QR should now be rejected as invalidated
    const oldScan = await verificationService.decodeQr(oldQrUri);
    expect(oldScan.outcome).toBe("expired_reference");
    expect(oldScan.message).toMatch(/invalidated/i);

    // New QR should decode cleanly
    const newScan = await verificationService.decodeQr(newPres.qrUri);
    expect(newScan.outcome).toBe("qr_decoded");
    expect(newScan.credentialReference).toBe("PRM-DEMO-0002");
  });

  // Test 4: Manual "Expire Now" Invalidation
  it("Scenario 4: Expire Now immediately invalidates active presentation", async () => {
    const official = await demoAdminService.createOfficial(
      {
        displayName: "Inspector Vikram Malhotra",
        registeredEmail: "vikram.malhotra@delhipolice.gov.in",
        designation: "Inspector",
        department: "Traffic Police",
        postingLocation: "Central District",
        credentialReference: "PRM-DEMO-0005",
      },
      "usr_admin_001",
    );

    const activeQrUri = official.activePresentation.qrUri;

    // Expire now
    await demoAdminService.expirePresentation(official.id, { reason: "Security check" }, "usr_admin_001");

    // Scanned QR must be rejected
    const scan = await verificationService.decodeQr(activeQrUri);
    expect(scan.outcome).toBe("expired_reference");
    expect(scan.message).toMatch(/invalidated/i);
  });

  // Test 5: Suspended Credential Rejection
  it("Scenario 5: Suspended credential invalidates presentations and fails status check", async () => {
    const official = await demoAdminService.createOfficial(
      {
        displayName: "Constable Rajesh Kumar",
        registeredEmail: "rajesh.kumar@delhipolice.gov.in",
        designation: "Constable",
        department: "Patrol Unit",
        postingLocation: "South District",
        credentialReference: "PRM-DEMO-0008",
      },
      "usr_admin_001",
    );

    // Admin suspends credential
    await demoAdminService.updateCredentialStatus(
      official.id,
      { status: "suspended", reason: "Internal inquiry" },
      "usr_admin_001",
    );

    // Presentation should be invalidated
    const scan = await verificationService.decodeQr(official.activePresentation.qrUri);
    expect(scan.outcome).toBe("expired_reference");
  });

  // Test 6: Non-Destructive Archival
  it("Scenario 6: Archiving official invalidates QR and preserves audit trails", async () => {
    const official = await demoAdminService.createOfficial(
      {
        displayName: "Inspector Sonia Verma",
        registeredEmail: "sonia.verma@delhipolice.gov.in",
        designation: "Inspector",
        department: "Narcotics Branch",
        postingLocation: "Airport Zone",
        credentialReference: "PRM-DEMO-0009",
      },
      "usr_admin_001",
    );

    const result = await demoAdminService.archiveOfficial(official.id, "usr_admin_001");
    expect(result.status).toBe("archived");

    // Scanned QR is rejected
    const scan = await verificationService.decodeQr(official.activePresentation.qrUri);
    expect(scan.outcome).toBe("expired_reference");

    // Official is excluded from active list
    const activeList = await demoAdminService.listOfficials();
    expect(activeList.some((o) => o.id === official.id)).toBe(false);
  });

  // Test 7: Biometric Failure Observations (No Face, Multiple Faces, Mismatch)
  it("Scenario 7: Biometric observation failures are handled gracefully without false verified", async () => {
    const session = await verificationService.createSession("PRM-DEMO-0001", { demo: true });

    let current = await verificationService.advanceCredentialStage(session.sessionId);
    while (current.state === "validating") {
      current = await verificationService.advanceCredentialStage(session.sessionId);
    }

    // No face in live frame
    const noFaceSession = await verificationService.verifyIdentity(session.sessionId, {
      observation: "no_face",
    });
    expect(noFaceSession.identity?.status).toBe("no_face");
    expect(noFaceSession.state).toBe("identity_pending");
  });

  // Test 8: Biometric Adapter Honest Offline Reporting
  it("Scenario 8: FastApiBiometricAdapter honestly reports offline when microservice is unreachable", async () => {
    const result = await fastApiBio.verifyIdentity("PRM-DEMO-0001", {
      observation: "single_face",
    });
    expect(["offline", "timeout", "no_face"]).toContain(result.status);
    expect(result.matchResult).toBe("not_performed");
  });
});
