export type CredentialRegistryStatus = "active" | "expired" | "revoked" | "suspended" | "archived" | "unknown";
export type CredentialOutcome = "unknown" | "valid" | "invalid" | "expired" | "revoked" | "unavailable";

export interface IssuerSummary {
  name: string;
  authority: string;
  registry: "demo";
}

export interface CredentialSummary {
  credentialId: string;
  fullName: string;
  designation: string;
  department: string;
  posting: string;
  photoUrl: string;
  photoAlt: string;
  issuedOn: string;
  validUntil: string;
  issuer: IssuerSummary;
  registryStatus: CredentialRegistryStatus;
  synthetic: true;
}

export interface ResolvedCredentialResult {
  outcome: CredentialOutcome;
  credential: CredentialSummary | null;
  serviceFailure?: boolean;
}
