import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

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

  @ApiProperty({ required: false, enum: ["valid", "invalid", "expired", "revoked"] })
  @IsString()
  @IsOptional()
  credentialStatus?: "valid" | "invalid" | "expired" | "revoked";
}

export class UpdateCredentialStatusDto {
  @ApiProperty({ enum: ["valid", "invalid", "expired", "revoked"] })
  @IsString()
  @IsNotEmpty()
  status: "valid" | "invalid" | "expired" | "revoked";

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
