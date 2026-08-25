# Pramaan — Evidence becomes trust

Pramaan is a modern, security-first government official identity-verification and public-safety platform.

- **Concept**: Evidence → Verification → Trust
- **Frontend (`apps/web`)**: TanStack Start, React 19, TypeScript, Tailwind CSS, TanStack Query
- **Backend (`apps/api`)**: NestJS, TypeScript, PostgreSQL (Supabase), Drizzle ORM, Swagger OpenAPI
- **Biometrics (`services/biometric`)**: Python FastAPI + ONNX Runtime (YuNet/SFace) microservice with deterministic fallback

---

## 🏗️ Clean Monorepo Architecture

```
pramaan/
├── apps/
│   ├── web/                       # Pure Frontend Application
│   │   ├── src/                   # Components, routes, view-models, hooks
│   │   ├── public/                # Static assets, fonts, icons
│   │   ├── tests/                 # Separated unit & integration tests
│   │   ├── package.json           # Frontend dependencies ONLY (React 19, Vite, TanStack, Tailwind)
│   │   ├── tsconfig.json          # Frontend TS configuration
│   │   ├── vite.config.ts         # Vite bundler configuration
│   │   └── vitest.config.ts       # Frontend test configuration
│   │
│   └── api/                       # Pure Authoritative Backend Application
│       ├── src/
│       │   ├── common/            # Auth Guard, Roles Guard, Interceptors, Filters
│       │   ├── config/            # Typed env config
│       │   ├── database/          # Drizzle ORM, 14 Tables Schema, Migrator, Seeds
│       │   │   ├── schema/        # Complete typed PostgreSQL schema
│       │   │   ├── migrations/    # Version-controlled Drizzle SQL migrations
│       │   │   └── seeds/         # Synthetic demo seed (PRM-DEMO-0001..0009)
│       │   ├── modules/
│       │   │   ├── auth/          # User identities & role management
│       │   │   ├── credentials/   # Government registry & credential resolution
│       │   │   ├── verification/  # State machine & VerificationPolicyEngine
│       │   │   ├── identity/      # BiometricPort & Adapters (FastAPI + Deterministic)
│       │   │   ├── confirmation/  # Official confirmation requests & decisions
│       │   │   ├── safety/        # Police stations directory & SOS machine
│       │   │   ├── activity/      # Citizen verification history
│       │   │   ├── audit/         # Audit event logger with correlation IDs
│       │   │   ├── storage/       # Supabase Storage & Local file adapter
│       │   │   ├── demo-admin/    # Protected Demo Admin API & QR validation
│       │   │   └── health/        # Liveness & PostgreSQL readiness probes
│       │   ├── main.ts            # NestJS bootstrap, Swagger OpenAPI docs
│       │   └── app.module.ts      # Root NestJS module
│       ├── test/                  # Backend 10 critical security scenarios
│       ├── package.json           # Backend dependencies ONLY (NestJS, Drizzle, PG, Swagger)
│       ├── tsconfig.json          # Backend TS configuration
│       ├── drizzle.config.ts      # Drizzle Kit configuration
│       └── Dockerfile             # Container definition for API
│
├── services/
│   └── biometric/                 # Python Biometric Microservice
│       ├── app.py                 # FastAPI REST application
│       ├── face_engine.py         # ONNX face detection & embedding engine
│       ├── requirements.txt       # Python dependencies
│       └── Dockerfile             # Container definition for biometrics
│
├── docs/
│   ├── architecture/              # System architecture & data flow
│   └── security/                  # Security model & trust boundaries
│
├── .env                           # Local environment configuration
├── .env.example                   # Master environment template
├── docker-compose.yml             # Multi-service Docker orchestration
├── package.json                   # Clean root workspace manager
└── README.md                      # Comprehensive developer guide
```

---

## 🚀 Quick Start

### 1. Configure Supabase Connection

Open [`.env`](file:///.env) and paste your Supabase credentials:

```env
# 1. Main connection string (Pooled or Direct)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# 2. Direct connection string (Port 5432 session mode, required for Drizzle migrations)
DIRECT_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# 3. Optional Transaction Pooler (Port 6543)
DATABASE_POOLER_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

---

### 2. Install Dependencies

You can install dependencies per app or via workspace root:

```bash
# Frontend dependencies
cd apps/web && bun install
# or: cd apps/web && npm install

# Backend dependencies
cd apps/api && bun install
# or: cd apps/api && npm install
```

---

### 3. Database Migrations & Seeding

```bash
# Run migrations from root or apps/api
bun run db:migrate
bun run db:seed
```

---

### 4. Running the Development Servers

```bash
# Start Frontend UI (http://localhost:3000)
bun run dev:web

# Start Backend API (http://localhost:3001/api/v1 - Swagger: /api/v1/docs)
bun run dev:api
```

---

### 5. Running Tests

```bash
# Frontend Unit & Component Tests
bun run test:web

# Backend Scenario & Security Tests
bun run test:api
```
