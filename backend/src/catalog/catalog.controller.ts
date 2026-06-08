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
  pickupPoints() {
    return this.catalog.listPickupPoints();
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
  createRound(@CurrentUser() user: User, @Body() dto: CreateRoundDto) {
    return this.catalog.createRound(user, dto);
  }

  @Post('rounds/:id/join')
  @UseGuards(JwtAuthGuard)
  joinRound(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.joinRound(user, id);
  }

  @Post('rounds/:id/leave')
  @UseGuards(JwtAuthGuard)
  leaveRound(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.leaveRound(user, id);
  }

  @Get('rounds/memberships/me')
  @UseGuards(JwtAuthGuard)
  myMemberships(@CurrentUser() user: User) {
    return this.catalog.listUserRoundIds(user.id);
  }

  @Patch('rounds/:id/fulfill')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  fulfillRound(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.fulfillRound(id);
  }

  @Get('rounds/:id')
  round(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.getRound(id);
  }

  @Get('driver/rounds/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.coordinator, UserRole.admin)
  driverActiveRound(@CurrentUser() user: User) {
    return this.catalog.getDriverActiveRound(user);
  }

  @Get('driver/rounds/delivery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.coordinator, UserRole.admin)
  driverDeliveryRound(@CurrentUser() user: User) {
    return this.catalog.getDriverDeliveryRound(user);
  }

  @Post('rounds/:id/emergency-close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.coordinator, UserRole.admin)
  scheduleEmergencyClose(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.catalog.scheduleEmergencyClose(user, id);
  }

  @Patch('rounds/:id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
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
