import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SubmitProcurementChecklistDto } from './dto/submit-procurement-checklist.dto';
import { SettlePurchaseDto } from './dto/settle-purchase.dto';
import { ProcurementChecklistService } from './procurement-checklist.service';
import { ProcurementSettlementService } from './procurement-settlement.service';

@Controller('driver/rounds')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.coordinator, UserRole.admin)
export class ProcurementController {
  constructor(
    private procurement: ProcurementChecklistService,
    private settlement: ProcurementSettlementService,
  ) {}

  @Get(':roundId/procurement/settlement')
  settlementStatus(
    @CurrentUser() user: User,
    @Param('roundId', ParseUUIDPipe) roundId: string,
  ) {
    return this.settlement.getSettlement(user, roundId);
  }

  @Get(':roundId/procurement/receipts')
  listAllReceipts(
    @CurrentUser() user: User,
    @Param('roundId', ParseUUIDPipe) roundId: string,
  ) {
    return this.settlement.listReceipts(user, roundId);
  }

  @Get(':roundId/procurement/:pickupPointId/receipts')
  listStopReceipts(
    @CurrentUser() user: User,
    @Param('roundId', ParseUUIDPipe) roundId: string,
    @Param('pickupPointId', ParseUUIDPipe) pickupPointId: string,
  ) {
    return this.settlement.listReceipts(user, roundId, pickupPointId);
  }

  @Post(':roundId/procurement/:pickupPointId/receipts')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  uploadReceipt(
    @CurrentUser() user: User,
    @Param('roundId', ParseUUIDPipe) roundId: string,
    @Param('pickupPointId', ParseUUIDPipe) pickupPointId: string,
    @UploadedFile()
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    return this.settlement.uploadReceipt(user, roundId, pickupPointId, file);
  }

  @Post(':roundId/procurement/settle')
  settlePurchase(
    @CurrentUser() user: User,
    @Param('roundId', ParseUUIDPipe) roundId: string,
    @Body() dto: SettlePurchaseDto,
  ) {
    return this.settlement.settlePurchase(user, roundId, dto.actualTotal);
  }

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
