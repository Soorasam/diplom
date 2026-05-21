import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateDisputeDto {
  @IsUUID()
  orderId!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1500)
  message!: string;
}
