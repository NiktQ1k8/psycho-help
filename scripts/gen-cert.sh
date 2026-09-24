#!/usr/bin/env bash
# Генерирует самоподписанный сертификат для обоих стендов.
# Запускается на сервере один раз:
#
#   ./scripts/gen-cert.sh 203.0.113.10
#
# subjectAltName с IP обязателен: современные браузеры игнорируют CN и без
# SAN не примут сертификат даже с ручным подтверждением исключения.
set -euo pipefail

IP="${1:-}"
OUT_DIR="${2:-/opt/psycho/certs}"
DAYS="${DAYS:-825}"

if [[ -z "$IP" ]]; then
    echo "Использование: $0 <IP> [каталог]" >&2
    exit 1
fi

mkdir -p "$OUT_DIR"

if [[ -f "$OUT_DIR/stand.key" ]]; then
    echo "В $OUT_DIR уже есть сертификат. Удалите его вручную, если нужен новый." >&2
    exit 1
fi

openssl req -x509 -nodes -newkey rsa:2048 -sha256 -days "$DAYS" \
    -keyout "$OUT_DIR/stand.key" \
    -out    "$OUT_DIR/stand.crt" \
    -subj   "/C=RU/O=Psychological Help/CN=$IP" \
    -addext "subjectAltName=IP:$IP" \
    -addext "basicConstraints=critical,CA:FALSE" \
    -addext "keyUsage=critical,digitalSignature,keyEncipherment" \
    -addext "extendedKeyUsage=serverAuth"

chmod 644 "$OUT_DIR/stand.crt"
chmod 600 "$OUT_DIR/stand.key"

echo "Готово, срок действия $DAYS дней:"
openssl x509 -in "$OUT_DIR/stand.crt" -noout -subject -dates -ext subjectAltName
