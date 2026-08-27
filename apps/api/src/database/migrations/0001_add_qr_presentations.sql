CREATE TABLE IF NOT EXISTS "qr_presentations" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"credential_id" varchar(64) NOT NULL REFERENCES "credentials"("id") ON DELETE cascade,
	"official_id" varchar(64) NOT NULL REFERENCES "officials"("id") ON DELETE cascade,
	"token_hash" varchar(64) NOT NULL UNIQUE,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"invalidated_at" timestamp with time zone,
	"invalidated_reason" text,
	"created_by_id" varchar(64) REFERENCES "users"("id") ON DELETE set null,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_qr_pres_token_hash" ON "qr_presentations" ("token_hash");
CREATE INDEX IF NOT EXISTS "idx_qr_pres_credential_id" ON "qr_presentations" ("credential_id");
CREATE INDEX IF NOT EXISTS "idx_qr_pres_status" ON "qr_presentations" ("status");
