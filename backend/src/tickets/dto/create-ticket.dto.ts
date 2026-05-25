import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateTicketDto {
  @IsUUID()
  orderId!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  body!: string;
}
