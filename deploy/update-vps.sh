#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${DEPLOY_BRANCH:-backend}"

echo "==> git pull ($BRANCH)"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

if [ ! -f .env.production ]; then
  echo "Нет .env.production — скопируйте deploy/.env.production.example"
  exit 1
fi

echo "==> docker compose (api + db + minio)"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo "==> миграции (также при старте api)"
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T api npx prisma migrate deploy

echo "==> frontend build"
cd frontend
if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
fi
npm ci
npm run build:prod
sudo mkdir -p /var/www/coopykt
sudo cp -r dist/* /var/www/coopykt/

echo "==> health"
curl -sf http://127.0.0.1:3000/health && echo ""
echo "Готово: https://coopykt.ru/user"
