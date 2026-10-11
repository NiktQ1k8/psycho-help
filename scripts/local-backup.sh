#!/bin/sh
# PostgreSQL dump + files; no backend tables, models or API calls.
set -eu
umask 077
export LC_ALL=C

fail() { printf '%s\n' "$*" >&2; exit 1; }
[ "$#" -ge 1 ] && [ "$#" -le 2 ] || fail "Usage: $0 backup [archive.tar.gz] | restore archive.tar.gz"
action=$1
case "$action" in backup|restore) ;; *) fail "Use backup or restore" ;; esac
[ "$action" != restore ] || [ -n "${2:-}" ] || fail 'Specify the backup archive'
archive=${2:-.local-data/backup-$(date -u +%Y-%m-%dT%H-%M-%S)-$$.tar.gz}
case "$archive" in /*) ;; *) archive=$PWD/$archive ;; esac
db=${LOCAL_DB_CONTAINER:-db}
files=${LOCAL_FILES_CONTAINER:-app}
images=${LOCAL_FILES_PATH:-/srv/images}
case "$images" in /) fail 'The file directory must not be /' ;; /*) ;; *) fail 'The file directory must be absolute' ;; esac

# Resolve PostgreSQL defaults inside its container; credentials stay there.
postgres() {
    docker exec -i -e PGUSER="${LOCAL_DB_USER:-}" -e PGDATABASE="${LOCAL_DB_NAME:-}" "$db" sh -c '
        exec "$@" -U "${PGUSER:-${POSTGRES_USER:-postgres}}" -d "${PGDATABASE:-${POSTGRES_DB:-${POSTGRES_USER:-postgres}}}"
    ' sh "$@"
}

if [ "$action" = backup ]; then
    [ ! -e "$archive" ] && [ ! -L "$archive" ] || fail "File already exists: $archive"
    mkdir -p -- "$(dirname -- "$archive")"
    work=$(mktemp -d "$(dirname -- "$archive")/.backup.XXXXXX")
else
    [ -f "$archive" ] || fail "Archive not found: $archive"
    work=$(mktemp -d)
fi
trap 'rm -rf -- "$work"' 0
trap 'exit 1' HUP INT TERM

if [ "$action" = backup ]; then
    postgres pg_dump --format=custom --no-owner --no-privileges > "$work/database.dump"
    docker exec "$files" tar -czf - -C "$images" . > "$work/files.tar.gz"
    tar -czf "$work/backup.tar.gz" -C "$work" database.dump files.tar.gz
    # Publish atomically, refusing to overwrite an existing archive.
    ln -- "$work/backup.tar.gz" "$archive"
    printf 'Backup saved: %s\n' "$archive"
else
    tar -tzf "$archive" > "$work/members"
    # Read only regular, unique root members without extracting arbitrary paths.
    extract() {
        [ "$(grep -cxF "$1" "$work/members")" = 1 ] || fail "Invalid archive member: $1"
        tar -tvzf "$archive" -- "$1" > "$work/details"
        [ "$(cut -c1 "$work/details")" = '-' ] || fail "Not a regular file: $1"
        tar -xOzf "$archive" -- "$1" > "$2"
    }
    extract database.dump "$work/database.dump"
    # The earlier demo archive called this member images.tar.gz.
    file_member=files.tar.gz
    grep -qxF "$file_member" "$work/members" || file_member=images.tar.gz
    extract "$file_member" "$work/files.tar.gz"
    tar -tzf "$work/files.tar.gz" --quoting-style=literal > "$work/names"
    tar -tvzf "$work/files.tar.gz" > "$work/types"
    awk '/(^\/|(^|\/)\.\.(\/|$))/ {bad=1} END {exit bad}' "$work/names" || fail 'Unsafe file paths in archive'
    awk 'substr($0,1,1) != "-" && substr($0,1,1) != "d" {bad=1} END {exit bad}' "$work/types" || fail 'Only regular files and directories may be restored'
    docker exec "$files" test -d "$images"
    docker exec "$files" find "$images" -type l > "$work/links"
    [ ! -s "$work/links" ] || fail 'The destination must not contain symbolic links'
    docker exec -i "$db" pg_restore --list < "$work/database.dump" > /dev/null
    # One transaction: a database error rolls back the entire restore.
    postgres pg_restore --clean --if-exists --single-transaction --exit-on-error \
        --no-owner --no-privileges < "$work/database.dump"
    docker exec -i "$files" tar -xzf - --no-same-owner --no-same-permissions -C "$images" < "$work/files.tar.gz"
    printf 'Backup restored: %s\n' "$archive"
fi
