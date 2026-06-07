import { IsNumber, Min } from 'class-validator';

export class SettlePurchaseDto {
  /** Фактическая сумма закупа по чекам (₽) */
  @IsNumber()
  @Min(0)
  actualTotal!: number;
}
