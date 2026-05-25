# API на VPS + GitHub Pages

## Схема

```
Браузер
   │
   ├─► https://soorasam.github.io/diplom/     ← frontend (GitHub Pages)
   │
   └─► https://coop.ВАШ-ДОМЕН.ru/api/v1/...  ← backend (VPS + nginx)
           └─► /coop-products/...            ← картинки (nginx → MinIO)
```

## 1. VPS (Ubuntu 22.04+)

```bash
sudo apt update && sudo apt install -y git docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo usermod -aG docker $USER
# перелогиньтесь
```

```bash
git clone https://github.com/Soorasam/diplom.git
cd diplom
git checkout backend
cp deploy/.env.production.example .env.production
nano .env.production   # пароли, домен, CORS, MINIO_PUBLIC_URL
```

Запуск:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Первичные данные (один раз):

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma db seed
docker compose -f docker-compose.prod.yml exec api npx ts-node -P tsconfig.scripts.json prisma/ensure-demo-users.ts
docker compose -f docker-compose.prod.yml exec api npm run storage:seed
```

Проверка локально на сервере: `curl http://127.0.0.1:3000/health`

## 2. Nginx + HTTPS

```bash
sudo cp deploy/nginx.example.conf /etc/nginx/sites-available/coop
sudo nano /etc/nginx/sites-available/coop   # замените coop.example.ru
sudo ln -sf /etc/nginx/sites-available/coop /etc/nginx/sites-enabled/
sudo nginx -t
sudo certbot --nginx -d coop.example.ru
```

В `.env.production`:

- `PUBLIC_ORIGIN` не используется кодом напрямую — ориентир для вас
- `MINIO_PUBLIC_URL=https://coop.example.ru` (без слэша в конце)
- `CORS_ORIGINS` должен содержать `https://soorasam.github.io`

После смены `.env.production`:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## 3. GitHub Pages → ваш API

**Settings → Secrets and variables → Actions → Variables**

| Variable | Значение |
|----------|----------|
| `VITE_API_URL` | `https://coop.example.ru/api/v1` |

Перезапуск деплоя: **Actions → Deploy GitHub Pages → Run workflow**  
или `git push origin backend`.

## 4. Проверка

1. `https://coop.example.ru/health` → `{"status":"ok"}` (или аналог)
2. `https://coop.example.ru/api/v1/...` — каталог (публичные эндпоинты)
3. `https://soorasam.github.io/diplom/` — вход `demo@coop.local` / `demo12345`

## 5. Обновление после push в backend

На VPS:

```bash
cd diplom && git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Frontend на Pages обновится сам через GitHub Actions.

## Частые ошибки

| Симптом | Решение |
|---------|---------|
| CORS в консоли браузера | Добавить `https://soorasam.github.io` в `CORS_ORIGINS`, перезапустить `api` |
| Картинки 404 | Проверить nginx `location /coop-products/` и `MINIO_PUBLIC_URL` |
| API connection refused | `docker compose ps`, логи: `docker compose logs api` |
| Mixed content | Только HTTPS на API, не `http://` в `VITE_API_URL` |
