import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RoundStatus, User, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CatalogService } from './catalog.service';
import { CreateRoundDto } from './dto/create-round.dto';

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

  @Get('routes')
  routes() {
    return this.catalog.listRoutes();
  }

  @Get('rounds')
  rounds(@Query('status') status?: RoundStatus) {
    return this.catalog.listRounds(status);
  }

  @Post('rounds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.coordinator, UserRole.admin)
  createRound(@Body() dto: CreateRoundDto) {
    return this.catalog.createRound(dto);
  }

  @Post('rounds/:id/join')
  @UseGuards(JwtAuthGuard)
  joinRound(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.joinRound(user, id);
  }

  @Get('rounds/memberships/me')
  @UseGuards(JwtAuthGuard)
  myMemberships(@CurrentUser() user: User) {
    return this.catalog.listUserRoundIds(user.id);
  }

  @Patch('rounds/:id/fulfill')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.employee)
  fulfillRound(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.fulfillRound(id);
  }

  @Get('rounds/:id')
  round(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.getRound(id);
  }

  @Patch('rounds/:id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.coordinator, UserRole.admin)
  closeRound(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.closeRound(id);
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
