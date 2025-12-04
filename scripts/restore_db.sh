#!/usr/bin/env bash
# Restore PostgreSQL custom-format backup created with pg_dump -Fc
# Usage:
# 1. Upload backup .dump.gz or .dump to server
# 2. On server: gunzip backup.dump.gz  # if gzipped
# 3. ./scripts/restore_db.sh -f backup.dump -h localhost -p 5432 -U postgres -d target_db

set -euo pipefail

FILE=""
HOST=localhost
PORT=5432
USER=postgres
TARGET_DB=""

usage() {
  cat <<EOF
Usage: $0 -f backup_file [-h host] [-p port] [-U user] [-d target_db]
Options:
  -f backup_file   : required. path to .dump file (custom format)
  -h host          : DB host (default: localhost)
  -p port          : DB port (default: 5432)
  -U user          : DB user (default: postgres)
  -d target_db     : target database name. If omitted, script will create DB from dump if possible.

Example:
  ./scripts/restore_db.sh -f e-evkin-backup_20251111.dump -d e_evkin_modern
EOF
}

while getopts ":f:h:p:U:d:" opt; do
  case ${opt} in
    f ) FILE="$OPTARG" ;;
    h ) HOST="$OPTARG" ;;
    p ) PORT="$OPTARG" ;;
    U ) USER="$OPTARG" ;;
    d ) TARGET_DB="$OPTARG" ;;
    \? ) usage; exit 1 ;;
  esac
done

if [[ -z "$FILE" ]]; then
  echo "backup file required"
  usage
  exit 1
fi

if [[ ! -f "$FILE" ]]; then
  echo "File $FILE not found"
  exit 1
fi

# If gzipped, uncompress
if [[ "$FILE" == *.gz ]]; then
  echo "Detected .gz archive, uncompressing..."
  gunzip -k "$FILE"
  FILE="${FILE%.gz}"
fi

# If target DB provided, restore into it
if [[ -n "$TARGET_DB" ]]; then
  echo "Restoring into existing DB: $TARGET_DB"
  # Drop connections and restore
  pg_restore -h "$HOST" -p "$PORT" -U "$USER" -d "$TARGET_DB" -c -v "$FILE"
else
  # Try to create DB from dump (if dump contains CREATE DATABASE)
  echo "Restoring (will use database name from dump or create DB if available)"
  pg_restore -h "$HOST" -p "$PORT" -U "$USER" -C -v "$FILE"
fi

echo "Restore finished."