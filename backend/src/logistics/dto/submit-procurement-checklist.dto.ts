import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export enum ProcurementItemOutcome {
  purchased = 'purchased',
  defer_next = 'defer_next',
  unavailable = 'unavailable',
}

export class ProcurementChecklistItemDto {
  @IsUUID()
  orderItemId!: string;

  @IsEnum(ProcurementItemOutcome)
  outcome!: ProcurementItemOutcome;
}

export class SubmitProcurementChecklistDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProcurementChecklistItemDto)
  items!: ProcurementChecklistItemDto[];
}
