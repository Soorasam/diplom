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

Создать/обновить учётки после seed:

```bash
cd backend
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/ensure-demo-users.ts
```

## Роли и маршруты

- **Житель** — каталог, корзина, заказы, заявка водителя, переключение режима в профиле
- **Водитель** (`/driver`) — сборы, маршруты, заказы координатора (API)
- **ПВЗ** (`/employee`) — заказы на выдачу, приёмка сборов
- **Админ** (`/admin`) — статистика, пользователи, заказы, товары (просмотр)

Переключатель «Житель / Водитель» — только в **Профиле** (последняя вкладка навбара).

## Переменные окружения

**backend/.env:** `DATABASE_URL`, `JWT_SECRET`, MinIO (`MINIO_*`)

**frontend/.env:** `VITE_API_URL=http://localhost:3000/api/v1`
