import { Injectable } from "@nestjs/common";
import { VerificationService } from "../verification/verification.service";
import { RecentVerificationSummary } from "../verification/verification.types";

@Injectable()
export class ActivityService {
  constructor(private readonly verificationService: VerificationService) {}

  async listRecentVerifications(userId?: string): Promise<RecentVerificationSummary[]> {
    return this.verificationService.listCompletedVerifications(userId);
  }
}
