import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { CoordinatorController } from './coordinator.controller';
import { CoordinatorService } from './coordinator.service';

@Module({
  imports: [CatalogModule],
  controllers: [CoordinatorController],
  providers: [CoordinatorService],
  exports: [CoordinatorService],
})
export class CoordinatorModule {}
