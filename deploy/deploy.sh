#!/usr/bin/env bash
# Разворачивает фронтенд на стенде. Запускается из CI по SSH после git reset,
# либо руками на сервере. Стенд определяется переменной STAND в .env.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

COMPOSE=(docker compose -f docker-compose.stand.yml)

if [[ ! -f .env ]]; then
    echo "Нет .env рядом с docker-compose.stand.yml - скопируйте .env.stand.example и заполните" >&2
    exit 1
fi

# shellcheck disable=SC1091
CERT_DIR=$(grep -E '^CERT_DIR=' .env | cut -d= -f2-)
if [[ ! -f "${CERT_DIR}/stand.crt" || ! -f "${CERT_DIR}/stand.key" ]]; then
    echo "Нет сертификата в ${CERT_DIR} - сначала выполните scripts/gen-cert.sh <IP>" >&2
    exit 1
fi

echo "==> Сборка образа"
"${COMPOSE[@]}" build

echo "==> Запуск"
"${COMPOSE[@]}" up -d --remove-orphans

echo "==> Очистка старых образов"
docker image prune -f >/dev/null

echo "==> Готово"
"${COMPOSE[@]}" ps
