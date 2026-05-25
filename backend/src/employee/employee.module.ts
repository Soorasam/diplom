import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { LogisticsModule } from '../logistics/logistics.module';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';

@Module({
  imports: [LogisticsModule, CatalogModule],
  controllers: [EmployeeController],
  providers: [EmployeeService],
})
export class EmployeeModule {}
