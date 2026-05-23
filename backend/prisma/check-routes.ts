import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MOCK_TITLES = [
  'Якутск → Верхневилюйский улус',
  'Нерюнгри → отдалённые стойбища',
];

async function main() {
  const routes = await prisma.route.findMany({
    select: { id: true, title: true, transportType: true },
    orderBy: { title: 'asc' },
  });

  console.log(`Всего маршрутов в БД: ${routes.length}\n`);

  if (routes.length === 0) {
    console.log('Таблица Route пуста — моковые маршруты удалены (или не создавались).');
    return;
  }

  for (const r of routes) {
    const mock = MOCK_TITLES.includes(r.title) ? ' [МОК — не удалён]' : '';
    console.log(`- ${r.title} (${r.transportType})${mock}`);
  }

  const mocksLeft = routes.filter((r) => MOCK_TITLES.includes(r.title));
  console.log('');
  if (mocksLeft.length === 0) {
    console.log('OK: старых мок-маршрутов (Якутск/Нерюнгри) в БД нет.');
  } else {
    console.log(`ВНИМАНИЕ: осталось мок-маршрутов: ${mocksLeft.length}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
