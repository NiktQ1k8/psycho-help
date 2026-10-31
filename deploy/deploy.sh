#!/usr/bin/env bash
# Разворачивает фронтенд на стенде. Запускается из CI по SSH после git reset,
# либо руками на сервере. Стенд определяется переменной STAND в .env.
# CI: ./deploy/deploy.sh /tmp/psycho-web.tar.gz psycho-web:<commit SHA>
# Без аргументов сохраняется ручная сборка на сервере.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if (( $# != 0 && $# != 2 )); then
    echo "Использование: $0 [архив образа psycho-web:<commit SHA>]" >&2
    exit 2
fi

if (( $# == 2 )); then
    if [[ ! -r "$1" || ! "$2" =~ ^psycho-web:[0-9a-f]{40}$ ]]; then
        echo "Нужны доступный архив и имя образа psycho-web:<commit SHA>" >&2
        exit 2
    fi
fi

# Деплои обоих репозиториев идут на один сервер. Одновременная сборка фронта
# и бэкенда не влезает в память, а два "docker image prune" начинают гонку.
# Замок выстраивает деплои в очередь независимо от того, кто их запустил.
exec 9>/tmp/psycho-deploy.lock
flock -w 900 9 || {
    echo "Другой деплой идёт дольше 15 минут, выхожу" >&2
    exit 1
}

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

if (( $# == 2 )); then
    image_archive=$1
    image_ref=$2
    target_image=$("${COMPOSE[@]}" config --images web)
    case "$target_image" in
        psycho-web:dev|psycho-web:prod) ;;
        *) echo "Неожиданное имя образа стенда: $target_image" >&2; exit 1 ;;
    esac

    echo "==> Загрузка готового образа"
    docker image load --input "$image_archive"
    image_revision=$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$image_ref")
    if [[ "$image_revision" != "${image_ref#psycho-web:}" ]]; then
        echo "Коммит внутри образа не совпадает с ожидаемым" >&2
        exit 1
    fi
    docker image tag "$image_ref" "$target_image"
    # Оставляем тег стенда, чтобы теги каждого коммита не занимали диск вечно.
    docker image rm "$image_ref" >/dev/null
else
    echo "==> Сборка образа"
    "${COMPOSE[@]}" build
fi

echo "==> Запуск"
"${COMPOSE[@]}" up --no-build --pull never --remove-orphans --wait --wait-timeout 120 web

echo "==> Очистка старых образов"
docker image prune -f >/dev/null

echo "==> Готово"
"${COMPOSE[@]}" ps
