import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CreateRoutePlanDto } from '../../routes/dto/create-route-plan.dto';

export class CreateRoundDto {
  @ValidateIf((o: CreateRoundDto) => !o.templateRouteId)
  @ValidateNested()
  @Type(() => CreateRoutePlanDto)
  routePlan?: CreateRoutePlanDto;

  @ValidateIf((o: CreateRoundDto) => !o.routePlan)
  @IsUUID()
  templateRouteId?: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsDateString()
  closesAt!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  minParticipants?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  targetParticipants?: number;
}
