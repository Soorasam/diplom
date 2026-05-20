import { Module } from '@nestjs/common';
import { DriverApplicationsController } from './driver-applications.controller';
import { DriverApplicationsService } from './driver-applications.service';

@Module({
  controllers: [DriverApplicationsController],
  providers: [DriverApplicationsService],
})
export class DriverApplicationsModule {}
