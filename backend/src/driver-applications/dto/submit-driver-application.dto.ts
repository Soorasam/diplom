import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitDriverApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  vehicleSummary?: string;
}
