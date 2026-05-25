# Коопзакупки Якутия — дипломный проект

Веб-приложение для кооперативных закупок: жители заказывают товары в сборах, водители ведут маршруты, ПВЗ выдают заказы, администратор управляет каталогом и заявками.

## Стек

- **Frontend:** React, Vite, TanStack Query, Zustand, Tailwind
- **Backend:** NestJS, Prisma, PostgreSQL, MinIO
- **Инфра:** Docker Compose (Postgres + MinIO)

## Быстрый старт

```bash
# Инфраструктура
docker compose up -d

# Backend
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/ensure-demo-users.ts
npm run start:dev

# Frontend (другой терминал)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Приложение: `http://localhost:5173/diplom` (см. `basename` в Vite).

API: `http://localhost:3000/api/v1`

## Демо-аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Админ | `admin@coop.local` | `admin12345` |
| Житель | `demo@coop.local` | `demo12345` |
| ПВЗ | `employee@coop.local` | `employee12345` |

Скрипт `ensure-demo-users.ts` также создаёт **демо-рейс**: заказ «в пути» на ПВЗ сотрудника — сразу видно в `/employee` → **Приём** и у водителя в **Маршрут**.

Полная очистка БД (только 3 демо-аккаунта, без каталога и заказов):

```bash
cd backend
npm run prisma:reset:accounts
```

Полный демо-каталог и сборы: `npm run prisma:seed`

Только 20 товаров (5 на категорию) без сброса пользователей: `npm run prisma:seed:catalog`  
Картинки: `backend/prisma/seed-assets/products/` — имена файлов в `README.md` там же.

Маршруты доставки в БД **не создаются автоматически** (кроме служебного «Демо-рейс» при `ensure-demo-users` / полном seed). Добавляйте их через админ-панель или Prisma Studio.

Если ПВЗ пусто после старой БД:

```bash
cd backend
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/ensure-demo-users.ts
```

## Цикл доставки (как всё связано)

```
Житель оформляет заказ (ПВЗ = пункт в профиле)
        ↓
Админ: Сборы → «Закрыть сбор и отправить рейс»
   (заказы → «в пути», создаются точки ПВЗ на маршруте)
        ↓
Водитель: Маршрут — видит ПВЗ, прогресс приёма
        ↓
ПВЗ: Приём — отмечает каждый заказ → «на пункте»
   (все заказы ПВЗ приняты → точка «закрыта», водитель едет дальше)
        ↓
ПВЗ: Выдача — жителю
        ↓
Все ПВЗ закрыты → сбор завершён, рейс у водителя «завершён»
```

**Важно:** заказ попадает в ПВЗ только если `pickupPointId` заказа совпадает с ПВЗ сотрудника (берётся из профиля жителя при оформлении).

## Роли и маршруты

- **Житель** — каталог, корзина, заказы, заявка водителя, переключение режима в профиле
- **Водитель** (`/driver`) — сборы, маршрут с точками ПВЗ, заказы
- **ПВЗ** (`/employee`) — **Приём** от водителя, **Выдача** жителям
- **Админ** (`/admin`) — **Сборы** (закрыть и отправить рейс), заказы, товары

Переключатель «Житель / Водитель» — только в **Профиле**.

## Переменные окружения

**backend/.env:** `DATABASE_URL`, `JWT_SECRET`, MinIO (`MINIO_*`)

**frontend/.env:** `VITE_API_URL=http://localhost:3000/api/v1`

## GitHub Pages (демо UI)

Сайт: **https://soorasam.github.io/diplom/**

Деплой из папки `frontend` (ветка `gh-pages`):

```bash
cd frontend
npm run deploy
```

Перед деплоем задайте `frontend/.env.production` с URL вашего API, иначе в браузере останется `localhost`.
