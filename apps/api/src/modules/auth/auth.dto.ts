import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginDemoDto {
  @ApiProperty({ enum: ["citizen", "official", "demo_admin"], example: "citizen" })
  @IsEnum(["citizen", "official", "demo_admin"])
  @IsNotEmpty()
  role: "citizen" | "official" | "demo_admin";

  @ApiProperty({ required: false, example: "usr_citizen_001" })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class UserProfileDto {
  @ApiProperty({ example: "usr_citizen_001" })
  id: string;

  @ApiProperty({ example: "citizen" })
  role: string;

  @ApiProperty({ example: "Citizen Demo User" })
  displayName: string;

  @ApiProperty({ example: "citizen@pramaan.dev" })
  email: string;

  @ApiProperty({ example: "active" })
  status: string;
}
