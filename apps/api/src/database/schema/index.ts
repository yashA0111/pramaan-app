import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ------------------------------------------------------------------ users */

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  role: varchar("role", { length: 32 }).notNull().default("citizen"), // citizen | official | demo_admin
  displayName: varchar("display_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 32 }).notNull().default("active"), // active | suspended | inactive
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  official: one(officials, {
    fields: [users.id],
    references: [officials.userId],
  }),
  credentials: many(credentials),
  verificationSessions: many(verificationSessions),
  auditEvents: many(auditEvents),
}));

/* -------------------------------------------------------------- officials */

export const officials = pgTable("officials", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  employeeReference: varchar("employee_reference", { length: 64 }).notNull().unique(),
  department: varchar("department", { length: 255 }).notNull(),
  designation: varchar("designation", { length: 255 }).notNull(),
  postingLocation: text("posting_location").notNull(),
  registeredEmail: varchar("registered_email", { length: 255 }).notNull(),
  officialStatus: varchar("official_status", { length: 32 }).notNull().default("active"), // active | on_leave | suspended | transferred
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const officialsRelations = relations(officials, ({ one, many }) => ({
  user: one(users, {
    fields: [officials.userId],
    references: [users.id],
  }),
  confirmationRequests: many(officialConfirmationRequests),
  demoAssets: many(demoAssets),
}));

/* ---------------------------------------------------------------- issuers */

export const issuers = pgTable("issuers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  issuerReference: varchar("issuer_reference", { length: 64 }).notNull().unique(),
  issuerType: varchar("issuer_type", { length: 64 }).notNull(),
  authority: varchar("authority", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const issuersRelations = relations(issuers, ({ many }) => ({
  credentials: many(credentials),
}));

/* ------------------------------------------------------------ credentials */

export const credentials = pgTable("credentials", {
  id: varchar("id", { length: 64 }).primaryKey(),
  credentialReference: varchar("credential_reference", { length: 64 }).notNull().unique(), // e.g. PRM-DEMO-0001
  subjectUserId: varchar("subject_user_id", { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  issuerId: varchar("issuer_id", { length: 64 })
    .notNull()
    .references(() => issuers.id, { onDelete: "restrict" }),
  credentialType: varchar("credential_type", { length: 64 }).notNull().default("law_enforcement_id"),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("valid"), // valid | invalid | expired | revoked | unknown
  version: varchar("version", { length: 32 }).notNull().default("1.0.0"),
  photoUrl: text("photo_url").notNull(),
  photoAlt: text("photo_alt").notNull().default("Official identification photograph"),
  verificationPolicyId: varchar("verification_policy_id", { length: 64 }).notNull().default("standard_government_v1"),
  synthetic: boolean("synthetic").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const credentialsRelations = relations(credentials, ({ one, many }) => ({
  subjectUser: one(users, {
    fields: [credentials.subjectUserId],
    references: [users.id],
  }),
  issuer: one(issuers, {
    fields: [credentials.issuerId],
    references: [issuers.id],
  }),
  statusHistory: many(credentialStatusHistory),
  verificationSessions: many(verificationSessions),
}));

/* --------------------------------------------- credential_status_history */

export const credentialStatusHistory = pgTable("credential_status_history", {
  id: varchar("id", { length: 64 }).primaryKey(),
  credentialId: varchar("credential_id", { length: 64 })
    .notNull()
    .references(() => credentials.id, { onDelete: "cascade" }),
  previousStatus: varchar("previous_status", { length: 32 }).notNull(),
  newStatus: varchar("new_status", { length: 32 }).notNull(),
  reason: text("reason").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  changedBy: varchar("changed_by", { length: 64 }),
});

export const credentialStatusHistoryRelations = relations(credentialStatusHistory, ({ one }) => ({
  credential: one(credentials, {
    fields: [credentialStatusHistory.credentialId],
    references: [credentials.id],
  }),
}));

/* -------------------------------------------------- verification_sessions */

export const verificationSessions = pgTable("verification_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(), // e.g. ses_ABC123
  requestingUserId: varchar("requesting_user_id", { length: 64 }).references(() => users.id, {
    onDelete: "set null",
  }),
  credentialId: varchar("credential_id", { length: 64 }).references(() => credentials.id, {
    onDelete: "set null",
  }),
  credentialReference: varchar("credential_reference", { length: 64 }).notNull(),
  demo: boolean("demo").notNull().default(false),
  currentStage: varchar("current_stage", { length: 32 }).notNull().default("validate"), // scan | validate | resolve | issuer | status | match | confirm | receipt
  sessionState: varchar("session_state", { length: 64 }).notNull().default("validating"),
  credentialOutcome: varchar("credential_outcome", { length: 32 }).notNull().default("unknown"), // unknown | valid | invalid | expired | revoked | unavailable
  credentialStatus: varchar("credential_status", { length: 64 }).notNull().default("processing"),
  errorKind: varchar("error_kind", { length: 64 }),
  errorMessage: text("error_message"),
  limitationsJson: jsonb("limitations_json")
    .$type<string[]>()
    .notNull()
    .default([
      "Synthetic demo registry — no real government system was contacted.",
      "Identity matching runs against an integrated biometric adapter.",
    ]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationSessionsRelations = relations(verificationSessions, ({ one, many }) => ({
  requestingUser: one(users, {
    fields: [verificationSessions.requestingUserId],
    references: [users.id],
  }),
  credential: one(credentials, {
    fields: [verificationSessions.credentialId],
    references: [credentials.id],
  }),
  steps: many(verificationSteps),
  identityAttempts: many(identityVerificationAttempts),
  confirmationRequests: many(officialConfirmationRequests),
  trustReceipt: one(trustReceipts, {
    fields: [verificationSessions.id],
    references: [trustReceipts.verificationSessionId],
  }),
}));

/* ----------------------------------------------------- verification_steps */

export const verificationSteps = pgTable("verification_steps", {
  id: varchar("id", { length: 64 }).primaryKey(),
  verificationSessionId: varchar("verification_session_id", { length: 64 })
    .notNull()
    .references(() => verificationSessions.id, { onDelete: "cascade" }),
  stage: varchar("stage", { length: 32 }).notNull(), // scan | validate | resolve | issuer | status | match | confirm | receipt
  status: varchar("status", { length: 32 }).notNull(), // pending | current | success | failure | warning | skipped
  label: varchar("label", { length: 64 }).notNull(),
  detail: text("detail"),
  failureCode: varchar("failure_code", { length: 64 }),
  failureReason: text("failure_reason"),
  metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const verificationStepsRelations = relations(verificationSteps, ({ one }) => ({
  session: one(verificationSessions, {
    fields: [verificationSteps.verificationSessionId],
    references: [verificationSessions.id],
  }),
}));

/* ------------------------------------------- identity_verification_attempts */

export const identityVerificationAttempts = pgTable("identity_verification_attempts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  verificationSessionId: varchar("verification_session_id", { length: 64 })
    .notNull()
    .references(() => verificationSessions.id, { onDelete: "cascade" }),
  attemptNumber: integer("attempt_number").notNull().default(1),
  provider: varchar("provider", { length: 64 }).notNull().default("pramaan_biometrics"),
  modelName: varchar("model_name", { length: 64 }).notNull().default("yunet_sface_onnx"),
  modelVersion: varchar("model_version", { length: 64 }).notNull().default("1.0.0"),
  inputObservation: varchar("input_observation", { length: 32 }).notNull(), // single_face | no_face | multiple_faces
  inputReference: text("input_reference"),
  status: varchar("status", { length: 32 }).notNull(), // ready | camera_initializing | detecting | no_face | multiple_faces | matching | match | mismatch | requires_review | timeout | offline | error
  matchResult: varchar("match_result", { length: 32 }).notNull(), // match | mismatch | inconclusive | not_performed
  confidence: doublePrecision("confidence"),
  reason: text("reason").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const identityVerificationAttemptsRelations = relations(
  identityVerificationAttempts,
  ({ one }) => ({
    session: one(verificationSessions, {
      fields: [identityVerificationAttempts.verificationSessionId],
      references: [verificationSessions.id],
    }),
  }),
);

/* ------------------------------------------ official_confirmation_requests */

export const officialConfirmationRequests = pgTable("official_confirmation_requests", {
  id: varchar("id", { length: 64 }).primaryKey(),
  verificationSessionId: varchar("verification_session_id", { length: 64 })
    .notNull()
    .references(() => verificationSessions.id, { onDelete: "cascade" }),
  officialId: varchar("official_id", { length: 64 }).references(() => officials.id, {
    onDelete: "set null",
  }),
  status: varchar("status", { length: 32 }).notNull().default("ready"), // ready | sent | pending | accepted | rejected | expired | timeout | failed | skipped
  routedTo: varchar("routed_to", { length: 255 }).default("District Control Room · Duty Officer desk"),
  requestReference: varchar("request_reference", { length: 64 }).notNull().unique(),
  requestedAt: timestamp("requested_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  decision: varchar("decision", { length: 32 }), // accepted | rejected | timeout | expired | skipped | failed
  decisionReason: text("decision_reason"),
});

export const officialConfirmationRequestsRelations = relations(
  officialConfirmationRequests,
  ({ one }) => ({
    session: one(verificationSessions, {
      fields: [officialConfirmationRequests.verificationSessionId],
      references: [verificationSessions.id],
    }),
    official: one(officials, {
      fields: [officialConfirmationRequests.officialId],
      references: [officials.id],
    }),
  }),
);

/* --------------------------------------------------------- trust_receipts */

export const trustReceipts = pgTable("trust_receipts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  verificationSessionId: varchar("verification_session_id", { length: 64 })
    .notNull()
    .unique()
    .references(() => verificationSessions.id, { onDelete: "cascade" }),
  credentialReference: varchar("credential_reference", { length: 64 }).notNull(),
  finalState: varchar("final_state", { length: 64 }).notNull(), // final_verified | identity_matched_only | credential_valid_only | not_verified
  status: varchar("status", { length: 64 }).notNull(),
  headline: text("headline").notNull(),
  summary: text("summary").notNull(),
  subjectSnapshotJson: jsonb("subject_snapshot_json").$type<Record<string, unknown>>(),
  issuerSnapshotJson: jsonb("issuer_snapshot_json").$type<Record<string, unknown>>(),
  methodsJson: jsonb("methods_json").$type<
    Array<{
      id: string;
      label: string;
      outcome: "passed" | "failed" | "inconclusive" | "not_performed";
      detail: string;
    }>
  >().notNull(),
  limitationsJson: jsonb("limitations_json").$type<string[]>().notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  demo: boolean("demo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trustReceiptsRelations = relations(trustReceipts, ({ one }) => ({
  session: one(verificationSessions, {
    fields: [trustReceipts.verificationSessionId],
    references: [verificationSessions.id],
  }),
}));

/* ----------------------------------------------------------- audit_events */

export const auditEvents = pgTable("audit_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  actorUserId: varchar("actor_user_id", { length: 64 }).references(() => users.id, {
    onDelete: "set null",
  }),
  actorRole: varchar("actor_role", { length: 32 }),
  action: varchar("action", { length: 128 }).notNull(),
  resourceType: varchar("resource_type", { length: 64 }).notNull(),
  resourceId: varchar("resource_id", { length: 64 }),
  outcome: varchar("outcome", { length: 32 }).notNull(), // success | failure | denied | error
  requestId: varchar("request_id", { length: 64 }),
  ipContext: varchar("ip_context", { length: 128 }),
  metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>(),
});

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  actorUser: one(users, {
    fields: [auditEvents.actorUserId],
    references: [users.id],
  }),
}));

/* -------------------------------------------------------- police_stations */

export const policeStations = pgTable("police_stations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  distanceKm: doublePrecision("distance_km").notNull().default(1.5),
  phone: varchar("phone", { length: 64 }).notNull(),
  hours: varchar("hours", { length: 64 }).notNull().default("Open 24 hours"),
  openNow: boolean("open_now").notNull().default(true),
  note: text("note").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------- sos_events */

export const sosEvents = pgTable("sos_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  requestingUserId: varchar("requesting_user_id", { length: 64 }).references(() => users.id, {
    onDelete: "set null",
  }),
  state: varchar("state", { length: 32 }).notNull().default("sending"), // ready | sending | sent | acknowledged | failed | cancelled
  destination: varchar("destination", { length: 255 })
    .notNull()
    .default("Synthetic Pramaan demo dispatch"),
  locationShared: boolean("location_shared").notNull().default(true),
  detail: text("detail").notNull(),
  latitude: doublePrecision("latitude").notNull().default(28.6139),
  longitude: doublePrecision("longitude").notNull().default(77.209),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  failedAt: timestamp("failed_at", { withTimezone: true }),
});

export const sosEventsRelations = relations(sosEvents, ({ one }) => ({
  requestingUser: one(users, {
    fields: [sosEvents.requestingUserId],
    references: [users.id],
  }),
}));

/* ------------------------------------------------------------ demo_assets */

export const demoAssets = pgTable("demo_assets", {
  id: varchar("id", { length: 64 }).primaryKey(),
  officialId: varchar("official_id", { length: 64 })
    .notNull()
    .references(() => officials.id, { onDelete: "cascade" }),
  assetType: varchar("asset_type", { length: 32 }).notNull(), // portrait | qr | reference_face
  storagePath: text("storage_path").notNull(),
  mimeType: varchar("mime_type", { length: 64 }).notNull(),
  fileSize: integer("file_size").notNull().default(0),
  checksum: varchar("checksum", { length: 128 }),
  encodedReference: varchar("encoded_reference", { length: 64 }), // QR decoded reference payload
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const demoAssetsRelations = relations(demoAssets, ({ one }) => ({
  official: one(officials, {
    fields: [demoAssets.officialId],
    references: [officials.id],
  }),
}));
