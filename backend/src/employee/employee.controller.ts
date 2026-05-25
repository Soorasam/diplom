import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
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
  getWorkspace(@CurrentUser() user: User) {
    return this.employeeService.getWorkspace(user.id);
  }

  @Post('orders/:id/receive')
  receiveFromDriver(@CurrentUser() user: User, @Param('id') orderId: string) {
    return this.employeeService.receiveFromDriver(user.id, orderId);
  }

  @Post('orders/:id/handout')
  handoutToResident(@CurrentUser() user: User, @Param('id') orderId: string) {
    return this.employeeService.handoutToResident(user.id, orderId);
  }
}
