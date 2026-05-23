import { Global, Module } from '@nestjs/common';
import { DeliveryStopsService } from './delivery-stops.service';

@Global()
@Module({
  providers: [DeliveryStopsService],
  exports: [DeliveryStopsService],
})
export class LogisticsModule {}
