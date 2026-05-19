import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { RoundStatus } from '@prisma/client';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Get('stats/public')
  publicStats() {
    return this.catalog.publicStats();
  }

  @Get('settlements')
  settlements() {
    return this.catalog.listSettlements();
  }

  @Get('pickup-points')
  pickupPoints(@Query('settlement_id') settlementId?: string) {
    return this.catalog.listPickupPoints(settlementId);
  }

  @Get('rounds')
  rounds(@Query('status') status?: RoundStatus) {
    return this.catalog.listRounds(status ?? RoundStatus.open);
  }

  @Get('categories')
  categories() {
    return this.catalog.listCategories();
  }

  @Get('products')
  async products(@Query('category_id') categoryId?: string) {
    const items = await this.catalog.listProducts(categoryId);
    return items.map((p) => this.catalog.mapProduct(p));
  }

  @Get('products/:id')
  async product(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.catalog.getProduct(id);
    return this.catalog.mapProduct(product);
  }
}
