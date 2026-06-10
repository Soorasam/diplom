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

echo "==> Пересборка api (скрипт очистки)"
$COMPOSE up -d --build api

echo "==> Удаление всех сборов и заказов"
$COMPOSE exec -T api node dist/scripts/prisma/reset-rounds-orders.js

echo "==> health"
curl -sf http://127.0.0.1:3000/health && echo ""

echo ""
echo "=== Готово ==="
echo "Сборы и заказы удалены. Пользователи и каталог на месте."
