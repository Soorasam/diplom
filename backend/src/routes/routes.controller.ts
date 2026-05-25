import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateRoutePlanDto } from './dto/create-route-plan.dto';
import { RoutesService } from './routes.service';

@Controller()
export class RoutesController {
  constructor(private routes: RoutesService) {}

  @Get('settlements/catalog')
  settlementsCatalog() {
    return this.routes.listSettlementsWithPickup();
  }

  @Get('routes/:id')
  routeById(@Param('id', ParseUUIDPipe) id: string) {
    return this.routes.getRoute(id);
  }

  @Get('driver/route-templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.coordinator)
  listTemplates(@CurrentUser() user: User) {
    return this.routes.listTemplatesForDriver(user.id);
  }

  @Post('driver/route-templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.coordinator)
  saveTemplate(@CurrentUser() user: User, @Body() dto: CreateRoutePlanDto) {
    return this.routes.createTemplate(user, dto);
  }

  @Delete('driver/route-templates/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.coordinator)
  deleteTemplate(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routes.deleteTemplate(user.id, id);
  }
}
