import { DriverApplicationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewDriverApplicationDto {
  @IsEnum(DriverApplicationStatus)
  status!: DriverApplicationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
