import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** НП = ПВЗ: одна форма на добавление точки маршрута. */
export class CreateSettlementDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ulus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;
}
