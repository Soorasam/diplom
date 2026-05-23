import { TransportType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(TransportType)
  transportType!: TransportType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seasonNote?: string;
}
