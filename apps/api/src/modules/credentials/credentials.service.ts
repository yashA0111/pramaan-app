import { Injectable } from "@nestjs/common";
import { ResolvedCredentialResult } from "./credential.types";
import { GovernmentCredentialAdapter } from "./government-credential.adapter";

@Injectable()
export class CredentialsService {
  constructor(private readonly govAdapter: GovernmentCredentialAdapter) {}

  async resolveCredential(reference: string): Promise<ResolvedCredentialResult> {
    return this.govAdapter.resolveCredential(reference);
  }
}
