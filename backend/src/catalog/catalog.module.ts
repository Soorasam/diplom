import { Module } from '@nestjs/common';
import { RoutesModule } from '../routes/routes.module';
import { CatalogSchedulerService } from './catalog-scheduler.service';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [RoutesModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogSchedulerService],
  exports: [CatalogService],
})
export class CatalogModule {}
