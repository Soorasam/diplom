import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { EmployeeService } from './employee.service';

@Controller('employee')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.employee)
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Get('workspace')
  getWorkspace(@CurrentUser('id') userId: string) {
    return this.employeeService.getWorkspace(userId);
  }

  @Post('orders/:id/receive')
  receiveFromDriver(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
  ) {
    return this.employeeService.receiveFromDriver(userId, orderId);
  }

  @Post('orders/:id/handout')
  handoutToResident(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
  ) {
    return this.employeeService.handoutToResident(userId, orderId);
  }
}
