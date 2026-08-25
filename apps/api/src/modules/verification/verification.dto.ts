import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class DecodeQrDto {
  @ApiProperty({ example: "pramaan://verify/PRM-DEMO-0001" })
  @IsString()
  @IsNotEmpty()
  raw: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  demo?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  offline?: boolean;
}

export class CreateSessionDto {
  @ApiProperty({ example: "PRM-DEMO-0001" })
  @IsString()
  @IsNotEmpty()
  credentialReference: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  demo?: boolean;
}

export class VerifyIdentityDto {
  @ApiProperty({ enum: ["single_face", "no_face", "multiple_faces"], example: "single_face" })
  @IsString()
  @IsNotEmpty()
  observation: "single_face" | "no_face" | "multiple_faces";

  @ApiProperty({ required: false, example: 0.95 })
  @IsNumber()
  @IsOptional()
  quality?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  capturedFrameBase64?: string;
}
