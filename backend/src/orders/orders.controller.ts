import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.orders.list(user);
  }

  @Get('pickup-point/:pickupPointId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.employee, UserRole.admin)
  listByPickup(
    @CurrentUser() user: User,
    @Param('pickupPointId', ParseUUIDPipe) pickupPointId: string,
  ) {
    if (user.role === UserRole.employee && user.pickupPointId !== pickupPointId) {
      pickupPointId = user.pickupPointId!;
    }
    return this.orders.listByPickupPoint(pickupPointId);
  }

  @Get(':id')
  getOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    if (user.role === UserRole.resident) {
      return this.orders.getOne(user, id);
    }
    return this.orders.getOneForStaff(user, id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.employee, UserRole.admin)
  updateStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(user, id, dto);
  }
}
