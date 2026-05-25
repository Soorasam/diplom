import { Global, Module } from '@nestjs/common';
import { DeliveryStopsService } from './delivery-stops.service';
import { ProcurementChecklistService } from './procurement-checklist.service';
import { ProcurementController } from './procurement.controller';

@Global()
@Module({
  controllers: [ProcurementController],
  providers: [DeliveryStopsService, ProcurementChecklistService],
  exports: [DeliveryStopsService, ProcurementChecklistService],
})
export class LogisticsModule {}
