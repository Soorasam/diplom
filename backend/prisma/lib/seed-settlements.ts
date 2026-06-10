import type { PrismaClient } from '@prisma/client';

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

export async function seedLocations(prisma: PrismaClient) {
  const pickupPoints: Awaited<ReturnType<typeof prisma.pickupPoint.create>>[] = [];

  for (const loc of LOCATIONS) {
    const pickupPoint = await prisma.pickupPoint.create({ data: loc });
    pickupPoints.push(pickupPoint);
  }

  return { pickupPoints };
}
