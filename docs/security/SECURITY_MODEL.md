# Pramaan Security Model & Trust Boundaries

## 1. Trust Boundaries

```
UNTRUSTED:
├── Citizen device / Browser
├── Official device
├── QR code payloads (treated as unverified input)
├── Raw user inputs & HTTP parameters
└── Camera frame captures

TRUSTED:
├── NestJS Domain & Policy Engine
├── Authorization Guards & Roles Guards
├── Verification State Machine
└── Drizzle ORM / PostgreSQL Transactions

EXTERNAL SERVICE BOUNDARIES (Behind Ports/Adapters):
├── Biometric Microservice (FastAPI + ONNX Runtime)
├── Government Credential Port
├── Police Directory Port
└── Notification Port
```

---

## 2. Key Security Invariants

1. **Server-Side Truth**: No client can dictate or directly set verification states or receipt contents.
2. **Object-Level Authorization**:
   - Citizens can only query their own verification sessions, history, and SOS events.
   - Officials can only act on confirmation requests assigned to their station/jurisdiction.
   - Demo Admin routes require `demo_admin` role or email presence in `DEMO_ADMIN_EMAILS`.
3. **QR Asset Validation**:
   - Uploaded QR images are decoded server-side via `jsqr` to ensure that the encoded URI (`pramaan://verify/PRM-XXXX-####`) strictly matches the assigned official's credential reference.
4. **Biometric Privacy & Protection**:
   - Reference-face photos are stored in protected storage and never exposed via public endpoints.
   - Raw face frames are not logged in audit events or database records.
5. **Audit Logging**:
   - Every verification, failure, official action, and admin mutation is logged in `audit_events` with correlation IDs (`x-request-id`), actor IDs, and sanitized metadata.
