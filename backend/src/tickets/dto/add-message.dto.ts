import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AddTicketMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;
}
