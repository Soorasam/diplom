import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TransportType } from '@prisma/client';
import { RouteWaypointInputDto } from './route-waypoint.dto';

export class CreateRoutePlanDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @IsEnum(TransportType)
  transportType!: TransportType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seasonNote?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RouteWaypointInputDto)
  waypoints!: RouteWaypointInputDto[];

  @IsOptional()
  isTemplate?: boolean;
}
