import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CoordinatorService } from './coordinator.service';

@Controller('coordinator')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.coordinator, UserRole.admin)
export class CoordinatorController {
  constructor(private coordinator: CoordinatorService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: User) {
    return this.coordinator.dashboard(user);
  }

  @Get('routes')
  routes(@CurrentUser() user: User) {
    return this.coordinator.listRoutes(user);
  }

  @Get('orders')
  orders() {
    return this.coordinator.listOrders();
  }

  @Post('rounds/:id/start-delivery')
  startDelivery(@Param('id') roundId: string) {
    return this.coordinator.startDelivery(roundId);
  }

  @Post('rounds/:roundId/stops/:pickupPointId/complete')
  completeStop(
    @CurrentUser() user: User,
    @Param('roundId', ParseUUIDPipe) roundId: string,
    @Param('pickupPointId', ParseUUIDPipe) pickupPointId: string,
  ) {
    return this.coordinator.completeRouteStop(user, roundId, pickupPointId);
  }
}
