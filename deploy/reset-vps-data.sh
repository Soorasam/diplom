#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env.production ]; then
  echo "Нет .env.production"
  exit 1
fi

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"

echo "==> git pull"
git pull --ff-only origin main

echo "==> Пересборка api"
$COMPOSE up -d --build api

echo "==> Миграции"
$COMPOSE exec -T api npx prisma migrate deploy

echo "==> Сброс БД + seed (5 НП, каталог, admin, demo)"
$COMPOSE exec -T api node dist/scripts/prisma/reset-for-deploy.js

echo "==> health"
curl -sf http://127.0.0.1:3000/health && echo ""

echo ""
echo "=== Готово ==="
echo "  admin@coop.local / admin12345"
echo "  demo@coop.local  / demo12345  (житель, Хандыга)"
echo ""
echo "В браузере: Ctrl+F5, выйти из аккаунта или очистить localStorage (coop-auth)."
echo "Старые сборы/заказы/водители удалены. Координатора — через заявку + админ."
