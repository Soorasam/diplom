import { IsIn } from 'class-validator';

export class SwitchRoleDto {
  @IsIn(['resident', 'coordinator'])
  role!: 'resident' | 'coordinator';
}
