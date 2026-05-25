import { UserRole, type PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/** НП = ПВЗ: одна запись на населённый пункт. */
export const LOCATIONS = [
  {
    name: 'с. Хандыга',
    address: 'ул. Ленина, 12',
    district: 'Томпонский',
    ulus: 'Томпонский',
    phone: '+7 914 000-00-01',
  },
  {
    name: 'с. Батагай',
    address: 'пл. Центральная, 3',
    district: 'Верхоянский',
    ulus: 'Верхоянский',
    phone: '+7 914 000-00-02',
  },
  {
    name: 'с. Вилюйск',
    address: 'ул. Ленина, 8',
    district: 'Вилюйский',
    ulus: 'Вилюйский',
    phone: '+7 914 000-00-04',
  },
  {
    name: 'с. Оймякон',
    address: 'ул. Советская, 5',
    district: 'Оймяконский',
    ulus: 'Оймяконский',
    phone: '+7 914 000-00-03',
  },
  {
    name: 'Якутск',
    address: 'ул. Кирова, 18',
    district: 'Якутск',
    ulus: 'Якутск',
    phone: '+7 914 000-00-05',
  },
] as const;

export const KHANDYGA_LOCATION_INDEX = 0;

const EMPLOYEE_PASSWORD = 'employee12345';

export const PVZ_EMPLOYEE_ACCOUNTS = [
  { email: 'employee@coop.local', fullName: 'Сотрудник ПВЗ Хандыга', phone: '+7 914 555-00-01' },
  { email: 'employee-batagai@coop.local', fullName: 'Сотрудник ПВЗ Батагай', phone: '+7 914 555-00-02' },
  { email: 'employee-viluisk@coop.local', fullName: 'Сотрудник ПВЗ Вилюйск', phone: '+7 914 555-00-03' },
  { email: 'employee-oymyakon@coop.local', fullName: 'Сотрудник ПВЗ Оймякон', phone: '+7 914 555-00-04' },
  { email: 'employee-yakutsk@coop.local', fullName: 'Сотрудник ПВЗ Якутск', phone: '+7 914 555-00-05' },
] as const;

export async function seedLocations(prisma: PrismaClient) {
  const pickupPoints: Awaited<ReturnType<typeof prisma.pickupPoint.create>>[] = [];

  for (const loc of LOCATIONS) {
    const pickupPoint = await prisma.pickupPoint.create({ data: loc });
    pickupPoints.push(pickupPoint);
  }

  return { pickupPoints };
}

/** @deprecated используйте seedLocations */
export const seedSettlementsAndPickupPoints = seedLocations;

export const SETTLEMENTS_WITH_PVZ = LOCATIONS;
export const KHANDYGA_PVZ_INDEX = KHANDYGA_LOCATION_INDEX;

export async function seedPvzEmployees(
  prisma: PrismaClient,
  pickupPoints: Awaited<ReturnType<typeof prisma.pickupPoint.create>>[],
) {
  const hashedPassword = await bcrypt.hash(EMPLOYEE_PASSWORD, 10);

  for (let i = 0; i < PVZ_EMPLOYEE_ACCOUNTS.length; i++) {
    const account = PVZ_EMPLOYEE_ACCOUNTS[i];
    const pvz = pickupPoints[i];
    if (!pvz) continue;

    await prisma.user.create({
      data: {
        email: account.email,
        fullName: account.fullName,
        phone: account.phone,
        hashedPassword,
        role: UserRole.employee,
        pickupPointId: pvz.id,
        isActive: true,
      },
    });
  }
}
