import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateCartItemDto {
  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsUUID()
  roundId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  quantity?: number = 1;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  @Max(999)
  quantity!: number;
}

export class CheckoutCartDto {
  @IsOptional()
  @IsUUID()
  roundId?: string;
}
