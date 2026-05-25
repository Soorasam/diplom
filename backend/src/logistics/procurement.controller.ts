import {
  Body,
  Controller,
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
import { SubmitProcurementChecklistDto } from './dto/submit-procurement-checklist.dto';
import { ProcurementChecklistService } from './procurement-checklist.service';

@Controller('driver/rounds')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.coordinator, UserRole.admin)
export class ProcurementController {
  constructor(private procurement: ProcurementChecklistService) {}

  @Get(':roundId/procurement/active')
  activeChecklist(
    @CurrentUser() user: User,
    @Param('roundId', ParseUUIDPipe) roundId: string,
  ) {
    return this.procurement.getActiveChecklist(user, roundId);
  }

  @Get(':roundId/procurement/:pickupPointId')
  checklist(
    @CurrentUser() user: User,
    @Param('roundId', ParseUUIDPipe) roundId: string,
    @Param('pickupPointId', ParseUUIDPipe) pickupPointId: string,
  ) {
    return this.procurement.getChecklist(user, roundId, pickupPointId);
  }

  @Post(':roundId/procurement/:pickupPointId')
  submit(
    @CurrentUser() user: User,
    @Param('roundId', ParseUUIDPipe) roundId: string,
    @Param('pickupPointId', ParseUUIDPipe) pickupPointId: string,
    @Body() dto: SubmitProcurementChecklistDto,
  ) {
    return this.procurement.submitChecklist(
      user,
      roundId,
      pickupPointId,
      dto.items,
    );
  }

  @Post(':roundId/procurement/:pickupPointId/depart')
  depart(
    @CurrentUser() user: User,
    @Param('roundId', ParseUUIDPipe) roundId: string,
    @Param('pickupPointId', ParseUUIDPipe) pickupPointId: string,
  ) {
    return this.procurement.departProcurement(user, roundId, pickupPointId);
  }
}
