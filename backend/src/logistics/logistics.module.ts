import { Global, Module } from '@nestjs/common';
import { DeliveryStopsService } from './delivery-stops.service';
import { ProcurementChecklistService } from './procurement-checklist.service';
import { ProcurementSettlementService } from './procurement-settlement.service';
import { ProcurementController } from './procurement.controller';

@Global()
@Module({
  controllers: [ProcurementController],
  providers: [
    DeliveryStopsService,
    ProcurementChecklistService,
    ProcurementSettlementService,
  ],
  exports: [
    DeliveryStopsService,
    ProcurementChecklistService,
    ProcurementSettlementService,
  ],
})
export class LogisticsModule {}
