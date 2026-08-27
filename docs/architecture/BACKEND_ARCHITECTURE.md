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
1. **`SCAN`**: A permanent credential QR (`pramaan://credential/<ref>`), ephemeral presentation (`pramaan://verify/v1/<opaque-token>`), or intentionally supported legacy reference is decoded and validated.
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
14. **`demo_assets`**: Demo official asset metadata (portraits and protected reference faces). Permanent credential QRs are derived from credential references and are not stored as assets.

---

## 4. Demo Admin Workflow

The Demo Admin module (`/api/v1/admin/demo/...`) enables authorized operators to:
1. Create new synthetic officials with custom postings, departments, identity data, and credential references.
2. Generate and display the permanent credential QR (`pramaan://credential/<ref>`) for printing on a mock physical ID card. It is derived on demand and does not create a `qr_presentations` record.
3. Generate, regenerate, and expire a separate short-lived presentation (`pramaan://verify/v1/<opaque-token>`). Regeneration invalidates the previous presentation.
4. Upload portraits and protected reference-face assets. The current Demo Admin does not accept uploaded QR images; any future QR-image upload must decode and validate the encoded payload against the assigned reference before storing metadata.
5. **Protected Storage**: Biometric reference faces are protected and never made publicly readable.
6. Newly created officials immediately participate in citizen verification scans.

### Demo Role Flow

The development UI exposes three clearly labelled synthetic roles at `/login`:

1. **Citizen** opens `/app` and uses the normal QR-to-verification flow.
2. **Official** opens `/official`, where the role-protected confirmation inbox lists pending synthetic requests and accepts or rejects them through the existing confirmation API.
3. **Demo Admin** opens `/admin/demo`, provisions an official, and opens `/demo/id-card/<officialId>` to display or print the read-only mock ID card.

The selected role is only a development session convenience. Protected API operations remain authorized by the NestJS `AuthGuard` and `RolesGuard`; selecting a frontend role does not by itself grant admin access.

## 5. QR Architecture: Permanent Credential vs Ephemeral Presentation

Pramaan operates a **two-layer QR model**:

```
Physical ID Card
  └── Permanent QR  →  pramaan://credential/<ref>
         │  (scan)
         ▼
  Backend: credential reference lookup + status check
         │  (if credential is valid)
         ▼
  Ephemeral Verification Session / Presentation Token
         │  (pramaan://verify/v1/<opaque-token>)
         ▼
  Full Verification Flow: Identity → Confirmation → Trust Receipt
```

### Layer 1: Permanent Credential QR

| Property | Value |
|---|---|
| URI Scheme | `pramaan://credential/<ref>` |
| Content | Credential reference only (e.g., `PRM-DEMO-0001`) |
| Expiry | **Never** — stable, suitable for printing |
| Contains secret | **No** — reference only, no auth material |
| Database record | **None** — derived on-the-fly |
| Verification trigger | Scanning initiates a verification *session*, not verification itself |
| Backend control | Credential `status` field (valid/suspended/revoked) controls access |

**Rule**: The permanent QR does NOT change when credentials are suspended, revoked, or when verification presentations are regenerated. Credential status enforcement happens server-side, not in the QR.

### Layer 2: Ephemeral Verification Presentation

| Property | Value |
|---|---|
| URI Scheme | `pramaan://verify/v1/<opaque-token>` |
| Content | 256-bit cryptographically random opaque token |
| Expiry | Configurable TTL (default 15 minutes) |
| Storage | SHA-256 hash stored in `qr_presentations` table |
| Replay protection | ✅ Token hash lookup with invalidation |
| Invalidation | Immediate server-side invalidation by admin |
| Database record | Yes — `qr_presentations` table |

**Rule**: Ephemeral presentations are generated by the server for monitored verification sessions. They are NOT printed on physical ID cards.

### Three Supported QR Input Formats

The `decodeQr` endpoint (`POST /verification/qr/decode`) accepts three formats:

| Priority | Format | Parsed as |
|---|---|---|
| 1 | `pramaan://credential/<ref>` | `permanent_credential` (canonical, physical ID) |
| 2 | `pramaan://verify/v1/<token>` | `ephemeral_presentation` (server-generated) |
| 3 | `pramaan://verify/<ref>` or bare `PRM-XXXX-####` | `legacy_reference` (dev/fallback) |

All three formats resolve to a `credentialReference` before a verification session is created.

### Key Invariant

> **QR ≠ Presentation ≠ Verification**
>
> 1. Scanning a permanent QR **identifies** a credential — it does not verify the holder.
> 2. A verification presentation is **created** when the session begins — not embedded in the physical QR.
> 3. Verification **concludes** only after biometric matching and optional official confirmation.
