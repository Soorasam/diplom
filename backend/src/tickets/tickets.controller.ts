import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { User, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AddTicketMessageDto } from './dto/add-message.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { TicketsService } from './tickets.service';

type MulterFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

const fileLimits = { limits: { fileSize: 10 * 1024 * 1024 } };

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private tickets: TicketsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    if (user.role === UserRole.admin) {
      return this.tickets.listAllForAdmin();
    }
    return this.tickets.listMine(user);
  }

  @Get('by-order/:orderId')
  findByOrder(
    @CurrentUser() user: User,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.tickets.findByOrder(user, orderId);
  }

  @Get(':id')
  getOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.tickets.getById(user, id);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files', 5, fileLimits))
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateTicketDto,
    @UploadedFiles() files?: MulterFile[],
  ) {
    return this.tickets.create(user, dto, files ?? []);
  }

  @Post(':id/messages')
  @UseInterceptors(FilesInterceptor('files', 5, fileLimits))
  addMessage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTicketMessageDto,
    @UploadedFiles() files?: MulterFile[],
  ) {
    return this.tickets.addMessage(user, id, dto, files ?? []);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  updateStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.tickets.updateStatus(user, id, dto);
  }
}
