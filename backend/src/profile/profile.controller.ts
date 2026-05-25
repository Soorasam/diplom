import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SwitchRoleDto } from './dto/switch-role.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private profile: ProfileService) {}

  @Patch()
  update(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.profile.update(user, dto);
  }

  @Patch('role')
  switchRole(@CurrentUser() user: User, @Body() dto: SwitchRoleDto) {
    return this.profile.switchRole(user, dto);
  }

  @Patch('password')
  setPassword(@CurrentUser() user: User, @Body() dto: SetPasswordDto) {
    return this.profile.setPassword(user, dto);
  }
}
