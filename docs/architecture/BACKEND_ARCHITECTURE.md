# Pramaan Backend Architecture Specification

## 1. System Architecture

Pramaan is built on the core principle: **Evidence → Verification → Trust**.

The backend acts as the single authoritative decision boundary for all security-sensitive verification and public safety workflows.

```
                      CITIZEN / OFFICIAL CLIENTS (Browser / Mobile)
                                          │
                                          │ HTTPS (OpenAPI / REST)
                                          ▼
                      ┌────────────────────────────────────────┐
                      │              NestJS API                │
                      │       Global Prefix: /api/v1           │
                      └───────────────────┬────────────────────┘
                                          │
          ┌───────────────────────────────┼───────────────────────────────┐
          │                               │                               │
          ▼                               ▼                               ▼
    Verification Modules            Identity Module                 Safety Modules
    ├── VerificationSession         └── Biometric Adapter           ├── Police Stations
    ├── VerificationPolicyEngine          │                         └── SOS State Machine
    ├── CredentialPort                    ▼
    │     └── GovAdapter           Python FastAPI Microservice
    └── OfficialConfirmation       (YuNet / SFace ONNX Engine)
          └── NotifAdapter
                  │
                  └───────────────────────┬───────────────────────────────┘
                                          │
                                          ▼
                                Supabase PostgreSQL (Drizzle ORM)
                                ├── 14 Core Tables
                                ├── Version-controlled Migrations
                                ├── Automatic Provisioning on Boot
                                └── Deterministic Synthetic Demo Seed
```

---

## 2. Verification State Machine & Trust Ladder

The backend strictly enforces the invariant that preliminary checks never grant final trust:

$$\text{QR\_DECODED} \neq \text{CREDENTIAL\_VALID} \neq \text{IDENTITY\_MATCHED} \neq \text{OFFICIAL\_CONFIRMED} \neq \text{FINAL\_VERIFIED}$$

### Stage Progression
1. **`SCAN`**: QR reference is decoded and validated (`pramaan://verify/PRM-XXXX-####`).
2. **`VALIDATE`**: Signature and cryptographic format verified.
3. **`RESOLVE`**: Credential looked up in the government registry / PostgreSQL database.
4. **`ISSUER`**: Issuing authority provenance confirmed.
5. **`STATUS`**: Checks if credential is active, expired, or revoked.
6. **`MATCH`**: Biometric face comparison evaluated through `BiometricPort`.
7. **`CONFIRM`**: Live confirmation request to official desk.
8. **`RECEIPT`**: Authoritative `TrustReceipt` derived by server-side `VerificationPolicyEngine`.

---

## 3. Database Schema Overview

All database tables are created via Drizzle ORM migrations (`api/src/database/migrations/`):

1. **`users`**: Application user identities and roles (`citizen`, `official`, `demo_admin`).
2. **`officials`**: Official profiles, postings, employee references, and registered emails.
3. **`issuers`**: Trusted issuing authorities (e.g., Delhi Police Directorate of Personnel).
4. **`credentials`**: Synthetic/government credential records with expiration, status, and photo metadata.
5. **`credential_status_history`**: Audit trail of credential state transitions (active, expired, revoked).
6. **`verification_sessions`**: Authoritative server-side verification session state machine.
7. **`verification_steps`**: Fine-grained progression log of each verification check.
8. **`identity_verification_attempts`**: Normalized biometric matching attempts and confidence records.
9. **`official_confirmation_requests`**: Official confirmation requests, routing desk, and decisions.
10. **`trust_receipts`**: Authoritative trust receipts derived and persisted upon completion.
11. **`audit_events`**: Security-sensitive event logs with correlation IDs.
12. **`police_stations`**: Synthetic police stations directory with geolocation.
13. **`sos_events`**: Emergency SOS dispatch state machine.
14. **`demo_assets`**: Demo official asset metadata (portraits, QRs, reference faces).

---

## 4. Demo Admin Workflow

The Demo Admin module (`/api/v1/admin/demo/...`) enables authorized operators to:
1. Create new synthetic officials with custom postings and departments.
2. Upload portraits and QR codes.
3. **Server-side QR Verification**: The backend decodes the QR code payload during upload and ensures it matches the official's assigned credential reference before linking.
4. **Protected Storage**: Biometric reference faces are protected and never made publicly readable.
5. Newly created officials immediately participate in citizen verification scans.
