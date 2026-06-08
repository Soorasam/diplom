import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

const NAME_RE =
  /^(?:[A-ZА-ЯЁ][a-zа-яё]+(?:-[A-ZА-ЯЁ][a-zа-яё]+)?\s){1,2}[A-ZА-ЯЁ][a-zа-яё]+(?:-[A-ZА-ЯЁ][a-zа-яё]+)?$/;

const normalizePhone = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const raw = value.replace(/\D/g, '');
  if (!raw) return undefined;
  if (raw.length === 10 && raw.startsWith('9')) return `+7${raw}`;
  if (raw.length === 11 && raw.startsWith('8')) return `+7${raw.slice(1)}`;
  if (raw.length === 11 && raw.startsWith('7')) return `+${raw}`;
  return value.trim() || undefined;
};

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value))
  @Matches(NAME_RE, { message: 'Некорректные ФИО' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Transform(({ value }) => normalizePhone(value))
  @Matches(/^\+7\d{10}$/, {
    message: 'Введите полный номер: +7 и 10 цифр',
  })
  phone?: string;

  @IsOptional()
  @IsUUID()
  settlementId?: string;

  @IsOptional()
  @IsUUID()
  pickupPointId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value))
  @Matches(/^улица .+, дом [^,]+(, корпус .+)?$/, {
    message: 'Адрес: улица …, дом …, корпус … (корпус необязателен)',
  })
  deliveryAddress?: string;
}
