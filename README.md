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
npm run prisma:reset:deploy
npm run start:dev

# Frontend (другой терминал)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Приложение: `http://localhost:5173/coopykt/user` (локально `VITE_BASE=/coopykt/`; на VPS — корень домена, см. ниже).

API: `http://localhost:3000/api/v1`

## Демо-аккаунты

| Роль | Email | Пароль | ПВЗ |
|------|-------|--------|-----|
| Админ | `admin@coop.local` | `admin12345` | — |
| Житель | `demo@coop.local` | `demo12345` | Хандыга |
| ПВЗ | `employee@coop.local` | `employee12345` | Хандыга |
| ПВЗ | `employee-batagai@coop.local` | `employee12345` | Батагай |
| ПВЗ | `employee-viluisk@coop.local` | `employee12345` | Вилюйск |
| ПВЗ | `employee-oymyakon@coop.local` | `employee12345` | Оймякон |
| ПВЗ | `employee-yakutsk@coop.local` | `employee12345` | Якутск |

**Перед деплоем на VPS** — чистая БД без тестовых сборов и заказов:

```bash
cd backend
npm run prisma:reset:deploy
npm run storage:seed   # фото товаров в MinIO (если контейнер запущен)
```

В БД остаётся только: **5 населённых пунктов (= 5 ПВЗ**, одна запись с названием и адресом), **5 сотрудников ПВЗ**, каталог (~20 товаров), admin и demo-житель (Хандыга). Сборы, маршруты и заказы создаются **только через приложение**.

После обновления схемы: `cd backend && npx prisma migrate deploy && npm run prisma:reset:deploy`

Дополнительно:

| Команда | Когда |
|---------|--------|
| `npm run prisma:reset:accounts` | Только 3 аккаунта + 1 НП, без каталога |
| `npm run prisma:seed` | Дозаполнить каталог, если БД уже есть |
| `npm run prisma:seed:catalog` | Только товары, без сброса пользователей |

Картинки: `backend/prisma/seed-assets/products/` — см. `README.md` в этой папке.

Обновить пароли демо-аккаунтов без сброса БД: `npx ts-node -P tsconfig.scripts.json prisma/ensure-demo-users.ts`

## Цикл доставки (как всё связано)

```
Житель оформляет заказ (ПВЗ = пункт в профиле)
        ↓
Админ: Сборы → «Закрыть сбор и отправить рейс»
   (заказы → «подтверждён», создаются точки маршрута)
        ↓
Водитель: Маршрут → **чек-лист закупа** на каждой точке закупа
   (купил / в следующей точке / нет в наличии → возврат + уведомление)
   → кнопка **«В пути»** → заказы → «в пути», доставка в ПВЗ
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
- **Водитель** (`/driver`) — сборы, маршрут, **чек-лист закупа**, точки ПВЗ
- **ПВЗ** (`/employee`) — **Приём** от водителя, **Выдача** жителям
- **Админ** (`/admin`) — **Сборы** (закрыть и отправить рейс), заказы, товары

Переключатель «Житель / Водитель» — только в **Профиле**.

## Переменные окружения

**backend/.env:** `DATABASE_URL`, `JWT_SECRET`, MinIO (`MINIO_*`)

**frontend/.env:** `VITE_API_URL`, `VITE_BASE` (см. `frontend/.env.example`; прод — `frontend/.env.production.example` с `VITE_BASE=/`)

## Защита диплома (с ноутбука)

**Рекомендуемый способ показа:** backend + frontend локально, проектор с ноутбука.

Чеклист и сценарий: **[deploy/DEFENSE-LAPTOP.md](deploy/DEFENSE-LAPTOP.md)**

URL на защите: **http://localhost:5173/coopykt/user**

## Продакшен (Timeweb + coopykt.ru)

Пошаговый деплой: **[deploy/VPS-TIMEWEB.md](deploy/VPS-TIMEWEB.md)**

- VPS: Timeweb Cloud (Ubuntu, от 2 ГБ RAM)
- Домен: **coopykt.ru** (Reg.ru, только DNS → IP VPS)
- HTTPS: Let's Encrypt на nginx (Reg.ru DomainSSL не обязателен)
- Сайт: **https://coopykt.ru/user** (статика в корне домена, без префикса `/coopykt/`)
