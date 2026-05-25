# Деплой на Timeweb Cloud + домен coopykt.ru (Reg.ru)

## Что получится

| URL | Назначение |
|-----|------------|
| https://coopykt.ru/user | React (житель; `VITE_BASE=/`) |
| https://coopykt.ru/api/v1 | NestJS API |
| https://coopykt.ru/coop-products/... | Картинки товаров (MinIO) |

SSL: **Let's Encrypt** (бесплатно, на VPS). Reg.ru DomainSSL не нужен.

## 1. Timeweb Cloud

1. Создайте VPS: **Ubuntu 22.04**, минимум **2 ГБ RAM** (1 ГБ мало для Postgres + MinIO + API).
2. В панели Timeweb откройте **сеть / firewall**: порты **22**, **80**, **443**.
3. Запишите **публичный IPv4** сервера.

## 2. Reg.ru — DNS для coopykt.ru

В разделе DNS домена (без хостинга Reg.ru):

| Тип | Имя | Значение |
|-----|-----|----------|
| A | @ | IP вашего VPS |
| A | www | IP вашего VPS |

Проверка (с ПК, через 5–30 мин):

```bash
ping coopykt.ru
```

## 3. Подключение к VPS

```bash
ssh root@IP_ВАШЕГО_VPS
apt update && apt upgrade -y
apt install -y git nginx certbot python3-certbot-nginx
```

Установите Docker: https://docs.docker.com/engine/install/ubuntu/ 

```bash
docker compose version
```

## 4. Проект на сервере

```bash
cd /opt
git clone https://github.com/Soorasam/diplom.git
cd diplom
cp deploy/.env.production.example .env.production
nano .env.production
```

Замените все `замените_*` на свои пароли. `CORS_ORIGINS` и `MINIO_PUBLIC_URL` оставьте как в примере для coopykt.ru.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Первый запуск БД и миграции:

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec api npm run prisma:reset:deploy
docker compose -f docker-compose.prod.yml exec api npm run storage:seed
```

Скрипт `prisma:reset:deploy` удаляет все сборы, заказы, маршруты и шаблоны; оставляет каталог, 5 НП, 5 ПВЗ (по 1 на НП) и демо-аккаунты.

Проверка API:

```bash
curl -s http://127.0.0.1:3000/api/v1/health
```

## 5. Сборка frontend

На VPS (нужен Node 20):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
cd /opt/diplom/frontend
cp .env.production.example .env.production
npm ci
npm run build:prod
mkdir -p /var/www/coopykt
cp -r dist/* /var/www/coopykt/
```

Локально можно так же: `cp frontend/.env.production.example frontend/.env.production` → `npm run build:prod` → залить `dist/` на сервер.

## 6. Nginx + HTTPS

```bash
cp /opt/diplom/deploy/nginx.coopykt.ru.conf /etc/nginx/sites-available/coopykt
ln -sf /etc/nginx/sites-available/coopykt /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
```

Временно для получения сертификата — закомментируйте в конфиге блоки `listen 443` и строки `ssl_certificate`, оставьте только `listen 80` и `root` / `location`, затем:

```bash
certbot --nginx -d coopykt.ru -d www.coopykt.ru
```

Certbot допишет SSL. Либо верните полный файл из репозитория и снова `nginx -t && systemctl reload nginx`.

```bash
systemctl enable nginx
systemctl reload nginx
```

Сайт: **https://coopykt.ru/user** (вход жителя; админ `/admin`, ПВЗ `/employee`, водитель `/driver`)

## 7. Обновление после git pull

```bash
cd /opt/diplom
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
cd frontend && npm ci && npm run build:prod && cp -r dist/* /var/www/coopykt/
```

## 8. Защита диплома

На защите можно показывать **https://coopykt.ru/user** или локально — см. [DEFENSE-LAPTOP.md](DEFENSE-LAPTOP.md).

Демо-аккаунты: см. README (admin, demo, 5 сотрудников ПВЗ — пароль `employee12345`).

## Частые проблемы

| Симптом | Решение |
|---------|---------|
| Сайт не открывается | DNS A-запись, firewall 80/443 на Timeweb |
| API 502 | `docker compose ... ps`, логи `docker compose ... logs api` |
| Нет картинок | `storage:seed`, `MINIO_PUBLIC_URL=https://coopykt.ru` |
| CORS ошибка | В `.env.production` добавьте точный origin `https://coopykt.ru` |
| 1 ГБ RAM, контейнеры падают | Увеличьте тариф до 2 ГБ |
