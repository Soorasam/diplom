import { Module } from '@nestjs/common';
import { LogisticsModule } from '../logistics/logistics.module';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';

@Module({
  imports: [LogisticsModule],
  controllers: [EmployeeController],
  providers: [EmployeeService],
})
export class EmployeeModule {}
