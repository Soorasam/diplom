import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class CreateRoundDto {
  @IsUUID()
  routeId!: string;

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
