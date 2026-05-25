import { IsBoolean, IsInt, IsUUID, Min } from 'class-validator';

export class RouteWaypointInputDto {
  @IsUUID()
  pickupPointId!: string;

  @IsBoolean()
  isProcurementPoint!: boolean;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}
