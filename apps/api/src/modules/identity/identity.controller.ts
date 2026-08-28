import { Body, Controller, Post } from "@nestjs/common";
import { IdentityService } from "./identity.service";
import {
  FaceIdentificationInputDto,
  FaceIdentificationResult,
} from "./identity.types";

@Controller("identity")
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post("identify")
  async identify(
    @Body() body: FaceIdentificationInputDto,
  ): Promise<FaceIdentificationResult> {
    return this.identityService.identifyFace(body);
  }
}
