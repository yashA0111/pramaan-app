import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateDemoOfficialDto {
  @ApiProperty({ example: "Deepak Sharma" })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({ example: "deepak.sharma@delhipolice.gov.in" })
  @IsEmail()
  @IsNotEmpty()
  registeredEmail: string;

  @ApiProperty({ example: "Inspector" })
  @IsString()
  @IsNotEmpty()
  designation: string;

  @ApiProperty({ example: "Anti-Corruption Branch" })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ example: "HQ Unit VIII, New Delhi" })
  @IsString()
  @IsNotEmpty()
  postingLocation: string;

  @ApiProperty({ example: "PRM-DEMO-0010" })
  @IsString()
  @IsNotEmpty()
  credentialReference: string;

  @ApiProperty({ required: false, example: "EMP-DP-99881" })
  @IsString()
  @IsOptional()
  employeeReference?: string;

  @ApiProperty({ required: false, default: 15, example: 15 })
  @IsInt()
  @Min(1)
  @Max(1440)
  @IsOptional()
  initialQrTtlMinutes?: number;
}

export class UpdateDemoOfficialDto {
  @ApiProperty({ required: false, example: "Deepak Sharma" })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({ required: false, example: "Senior Inspector" })
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiProperty({ required: false, example: "Crime Branch" })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ required: false, example: "District Unit IX, New Delhi" })
  @IsString()
  @IsOptional()
  postingLocation?: string;

  @ApiProperty({ required: false, enum: ["valid", "invalid", "expired", "revoked", "suspended", "archived"] })
  @IsString()
  @IsOptional()
  credentialStatus?: "valid" | "invalid" | "expired" | "revoked" | "suspended" | "archived";
}

export class UpdateCredentialStatusDto {
  @ApiProperty({ enum: ["valid", "invalid", "expired", "revoked", "suspended", "archived"] })
  @IsString()
  @IsNotEmpty()
  status: "valid" | "invalid" | "expired" | "revoked" | "suspended" | "archived";

  @ApiProperty({ required: false, example: "Credential suspended pending investigation" })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class GeneratePresentationDto {
  @ApiProperty({ required: false, default: 15, example: 15, description: "TTL in minutes" })
  @IsInt()
  @Min(1)
  @Max(1440)
  @IsOptional()
  ttlMinutes?: number;
}

export class ExpirePresentationDto {
  @ApiProperty({ required: false, example: "Manually expired by operator" })
  @IsString()
  @IsOptional()
  reason?: string;
}
