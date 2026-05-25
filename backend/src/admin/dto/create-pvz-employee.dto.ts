import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreatePvzEmployeeDto {
  @IsEmail()
  email!: string;

  @IsUUID()
  pickupPointId!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;
}
