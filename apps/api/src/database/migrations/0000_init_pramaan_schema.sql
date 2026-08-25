CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"role" varchar(32) DEFAULT 'citizen' NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "officials" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"employee_reference" varchar(64) NOT NULL UNIQUE,
	"department" varchar(255) NOT NULL,
	"designation" varchar(255) NOT NULL,
	"posting_location" text NOT NULL,
	"registered_email" varchar(255) NOT NULL,
	"official_status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "issuers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"issuer_reference" varchar(64) NOT NULL UNIQUE,
	"issuer_type" varchar(64) NOT NULL,
	"authority" varchar(255) NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "credentials" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"credential_reference" varchar(64) NOT NULL UNIQUE,
	"subject_user_id" varchar(64) NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"issuer_id" varchar(64) NOT NULL REFERENCES "issuers"("id") ON DELETE restrict,
	"credential_type" varchar(64) DEFAULT 'law_enforcement_id' NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" varchar(32) DEFAULT 'valid' NOT NULL,
	"version" varchar(32) DEFAULT '1.0.0' NOT NULL,
	"photo_url" text NOT NULL,
	"photo_alt" text DEFAULT 'Official identification photograph' NOT NULL,
	"verification_policy_id" varchar(64) DEFAULT 'standard_government_v1' NOT NULL,
	"synthetic" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "credential_status_history" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"credential_id" varchar(64) NOT NULL REFERENCES "credentials"("id") ON DELETE cascade,
	"previous_status" varchar(32) NOT NULL,
	"new_status" varchar(32) NOT NULL,
	"reason" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_by" varchar(64)
);

CREATE TABLE IF NOT EXISTS "verification_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"requesting_user_id" varchar(64) REFERENCES "users"("id") ON DELETE set null,
	"credential_id" varchar(64) REFERENCES "credentials"("id") ON DELETE set null,
	"credential_reference" varchar(64) NOT NULL,
	"demo" boolean DEFAULT false NOT NULL,
	"current_stage" varchar(32) DEFAULT 'validate' NOT NULL,
	"session_state" varchar(64) DEFAULT 'validating' NOT NULL,
	"credential_outcome" varchar(32) DEFAULT 'unknown' NOT NULL,
	"credential_status" varchar(64) DEFAULT 'processing' NOT NULL,
	"error_kind" varchar(64),
	"error_message" text,
	"limitations_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification_steps" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"verification_session_id" varchar(64) NOT NULL REFERENCES "verification_sessions"("id") ON DELETE cascade,
	"stage" varchar(32) NOT NULL,
	"status" varchar(32) NOT NULL,
	"label" varchar(64) NOT NULL,
	"detail" text,
	"failure_code" varchar(64),
	"failure_reason" text,
	"metadata_json" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "identity_verification_attempts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"verification_session_id" varchar(64) NOT NULL REFERENCES "verification_sessions"("id") ON DELETE cascade,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"provider" varchar(64) DEFAULT 'pramaan_biometrics' NOT NULL,
	"model_name" varchar(64) DEFAULT 'yunet_sface_onnx' NOT NULL,
	"model_version" varchar(64) DEFAULT '1.0.0' NOT NULL,
	"input_observation" varchar(32) NOT NULL,
	"input_reference" text,
	"status" varchar(32) NOT NULL,
	"match_result" varchar(32) NOT NULL,
	"confidence" double precision,
	"reason" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "official_confirmation_requests" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"verification_session_id" varchar(64) NOT NULL REFERENCES "verification_sessions"("id") ON DELETE cascade,
	"official_id" varchar(64) REFERENCES "officials"("id") ON DELETE set null,
	"status" varchar(32) DEFAULT 'ready' NOT NULL,
	"routed_to" varchar(255) DEFAULT 'District Control Room · Duty Officer desk',
	"request_reference" varchar(64) NOT NULL UNIQUE,
	"requested_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"decision" varchar(32),
	"decision_reason" text
);

CREATE TABLE IF NOT EXISTS "trust_receipts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"verification_session_id" varchar(64) NOT NULL UNIQUE REFERENCES "verification_sessions"("id") ON DELETE cascade,
	"credential_reference" varchar(64) NOT NULL,
	"final_state" varchar(64) NOT NULL,
	"status" varchar(64) NOT NULL,
	"headline" text NOT NULL,
	"summary" text NOT NULL,
	"subject_snapshot_json" jsonb,
	"issuer_snapshot_json" jsonb,
	"methods_json" jsonb NOT NULL,
	"limitations_json" jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"demo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_events" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" varchar(64) REFERENCES "users"("id") ON DELETE set null,
	"actor_role" varchar(32),
	"action" varchar(128) NOT NULL,
	"resource_type" varchar(64) NOT NULL,
	"resource_id" varchar(64),
	"outcome" varchar(32) NOT NULL,
	"request_id" varchar(64),
	"ip_context" varchar(128),
	"metadata_json" jsonb
);

CREATE TABLE IF NOT EXISTS "police_stations" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"distance_km" double precision DEFAULT 1.5 NOT NULL,
	"phone" varchar(64) NOT NULL,
	"hours" varchar(64) DEFAULT 'Open 24 hours' NOT NULL,
	"open_now" boolean DEFAULT true NOT NULL,
	"note" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sos_events" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"requesting_user_id" varchar(64) REFERENCES "users"("id") ON DELETE set null,
	"state" varchar(32) DEFAULT 'sending' NOT NULL,
	"destination" varchar(255) DEFAULT 'Synthetic Pramaan demo dispatch' NOT NULL,
	"location_shared" boolean DEFAULT true NOT NULL,
	"detail" text NOT NULL,
	"latitude" double precision DEFAULT 28.6139 NOT NULL,
	"longitude" double precision DEFAULT 77.209 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"acknowledged_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"failed_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "demo_assets" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"official_id" varchar(64) NOT NULL REFERENCES "officials"("id") ON DELETE cascade,
	"asset_type" varchar(32) NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" varchar(64) NOT NULL,
	"file_size" integer DEFAULT 0 NOT NULL,
	"checksum" varchar(128),
	"encoded_reference" varchar(64),
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_credentials_reference" ON "credentials" ("credential_reference");
CREATE INDEX IF NOT EXISTS "idx_verification_sessions_ref" ON "verification_sessions" ("credential_reference");
CREATE INDEX IF NOT EXISTS "idx_verification_steps_session" ON "verification_steps" ("verification_session_id");
CREATE INDEX IF NOT EXISTS "idx_audit_events_actor" ON "audit_events" ("actor_user_id");
CREATE INDEX IF NOT EXISTS "idx_audit_events_occurred_at" ON "audit_events" ("occurred_at");
CREATE INDEX IF NOT EXISTS "idx_demo_assets_official" ON "demo_assets" ("official_id");
