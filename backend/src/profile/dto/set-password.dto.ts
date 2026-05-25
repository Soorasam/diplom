import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SetPasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  currentPassword?: string;

  @IsString()
  @MinLength(8, { message: 'Новый пароль: минимум 8 символов' })
  @MaxLength(128)
  newPassword!: string;
}
