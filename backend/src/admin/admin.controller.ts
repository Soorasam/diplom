import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
import { OrdersService } from '../orders/orders.service';
import { AdminService } from './admin.service';
import { CreatePvzEmployeeDto } from './dto/create-pvz-employee.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminController {
  constructor(
    private admin: AdminService,
    private ordersService: OrdersService,
  ) {}

  @Get('stats')
  stats() {
    return this.admin.getStats();
  }

  @Get('users')
  users() {
    return this.admin.listUsers();
  }

  @Get('orders')
  orders() {
    return this.admin.listOrders();
  }

  @Get('products')
  products() {
    return this.admin.listProducts();
  }

  @Get('routes')
  routes() {
    return this.admin.listRoutes();
  }

  @Get('settlements')
  settlements() {
    return this.admin.listSettlements();
  }

  @Post('settlements')
  createSettlement(@Body() dto: CreateSettlementDto) {
    return this.admin.createSettlement(dto);
  }

  @Get('drivers')
  drivers() {
    return this.admin.listDrivers();
  }

  @Get('pickup-points')
  pickupPoints() {
    return this.admin.listPickupPoints();
  }

  @Post('pvz-employees')
  createPvzEmployee(@Body() dto: CreatePvzEmployeeDto) {
    return this.admin.createPvzEmployee(dto);
  }

  @Get('rounds')
  rounds() {
    return this.admin.listRounds();
  }

  @Get('notifications')
  notifications() {
    return this.admin.listNotifications();
  }

  @Patch('notifications/:id/resolve')
  resolveNotification(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.resolveNotification(id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(user, id, dto);
  }
}
