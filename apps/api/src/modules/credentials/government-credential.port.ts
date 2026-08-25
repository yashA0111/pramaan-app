import { ResolvedCredentialResult } from "./credential.types";

export interface GovernmentCredentialPort {
  resolveCredential(reference: string): Promise<ResolvedCredentialResult>;
}
