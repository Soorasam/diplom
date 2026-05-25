import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { DriverDocumentType, User, UserRole } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { ReviewDriverApplicationDto } from "./dto/review-driver-application.dto";
import { SubmitDriverApplicationDto } from "./dto/submit-driver-application.dto";
import { DriverApplicationsService } from "./driver-applications.service";

@Controller("driver-applications")
@UseGuards(JwtAuthGuard)
export class DriverApplicationsController {
  constructor(private apps: DriverApplicationsService) {}

  @Get("me")
  mine(@CurrentUser() user: User) {
    return this.apps.getMine(user);
  }

  @Delete("me/documents/:type")
  removeDocument(
    @CurrentUser() user: User,
    @Param("type", new ParseEnumPipe(DriverDocumentType))
    type: DriverDocumentType,
  ) {
    return this.apps.removeDocument(user, type);
  }

  @Post("me/documents/:type")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  uploadDocument(
    @CurrentUser() user: User,
    @Param("type", new ParseEnumPipe(DriverDocumentType))
    type: DriverDocumentType,
    @UploadedFile()
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    return this.apps.uploadDocument(user, type, file);
  }

  @Post()
  submit(@CurrentUser() user: User, @Body() dto: SubmitDriverApplicationDto) {
    return this.apps.submit(user, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  list() {
    return this.apps.listAll();
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.admin)
  review(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReviewDriverApplicationDto,
  ) {
    return this.apps.review(id, dto);
  }
}
