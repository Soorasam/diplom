# Защита диплома — запуск с ноутбука

Основной сценарий: **всё локально**. На проекторе открываете тот же URL с ноутбука.

## За день до защиты

```bash
# 1. Инфраструктура
docker compose up -d

# 2. Backend (если БД пустая или старая)
cd backend
cp .env.example .env   # если ещё нет
npm install
npm run prisma:migrate
npm run prisma:seed:catalog
npx ts-node -P tsconfig.scripts.json prisma/ensure-demo-users.ts
npm run storage:seed     # картинки в MinIO (нужен запущенный docker)
npm run start:dev

# 3. Frontend (другой терминал)
cd frontend
cp .env.example .env     # VITE_API_URL=http://localhost:3000/api/v1
npm install
npm run dev
```

Проверка: http://localhost:5173/diplom/

## День защиты (порядок запуска)

1. Включить ноутбук, подключить проектор (режим «дублировать экран» или только второй монитор).
2. `docker compose up -d` (из корня репозитория).
3. Терминал 1: `cd backend && npm run start:dev`
4. Терминал 2: `cd frontend && npm run dev`
5. Браузер: **http://localhost:5173/diplom/**

Не закрывайте терминалы во время показа.

## Сценарий показа (~7 мин)

| Шаг | Кто | Что показать |
|-----|-----|----------------|
| 1 | Житель | `demo@coop.local` / `demo12345` — каталог, корзина, заказ |
| 2 | Админ | `admin@coop.local` — маршрут (если нет — создать), сбор → «Закрыть и отправить рейс» |
| 3 | Водитель | Профиль → режим водителя — **Маршрут**, точки ПВЗ |
| 4 | ПВЗ | `employee@coop.local` — **Приём**, затем **Выдача** |

Демо-рейс после `ensure-demo-users`: сразу виден **Приём** у ПВЗ и точка на **Маршруте** водителя.

## Если что-то не работает

| Проблема | Решение |
|----------|---------|
| Пустой каталог | `npm run prisma:seed:catalog` |
| Нет картинок | `docker compose up -d` → `npm run storage:seed` |
| ПВЗ пусто | `npx ts-node -P tsconfig.scripts.json prisma/ensure-demo-users.ts` |
| API недоступен | Проверить `npm run start:dev`, порт 3000 |
| 401 / вылетает из аккаунта | Выйти, войти снова; очистить localStorage при необходимости |

## GitHub Pages (опционально)

https://soorasam.github.io/diplom/ — только UI без вашего API. На защите **не используйте** как основной показ, если backend на ноутбуке (там `localhost` в сборке Pages).

## После защиты

Можно остановить: `Ctrl+C` в терминалах, `docker compose down` (данные в volume сохранятся).
