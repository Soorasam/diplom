import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
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
  dashboard() {
    return this.coordinator.dashboard();
  }

  @Get('routes')
  routes() {
    return this.coordinator.listRoutes();
  }

  @Get('orders')
  orders() {
    return this.coordinator.listOrders();
  }
}
