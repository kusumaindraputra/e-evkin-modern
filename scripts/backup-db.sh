#!/bin/bash
# E-EVKIN Database Backup Script
# Runs via cron: 0 2 * * * /root/e-evkin-modern/scripts/backup-db.sh

set -euo pipefail

BACKUP_DIR="/root/e-evkin-backups"
DB_HOST="192.168.102.158"
DB_NAME="db_evkin"
DB_USER="e-evkin"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/db_evkin_${TIMESTAMP}.sql.gz"
KEEP_DAYS=14

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Source .env for password
if [ -f /root/e-evkin-modern/backend/.env ]; then
  DB_PASSWORD=$(grep DB_PASSWORD /root/e-evkin-modern/backend/.env | cut -d'=' -f2-)
else
  echo "ERROR: .env not found"
  exit 1
fi

# Run backup
echo "[$(date)] Starting backup..."
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-privileges --clean --if-exists \
  2>/dev/null | gzip > "$BACKUP_FILE"

# Verify backup
SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")
if [ "$SIZE" -lt 1000 ]; then
  echo "[$(date)] ERROR: Backup too small (${SIZE} bytes), likely failed"
  rm -f "$BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Backup OK: $BACKUP_FILE ($(numfmt --to=iec $SIZE))"

# Cleanup old backups
find "$BACKUP_DIR" -name "db_evkin_*.sql.gz" -mtime +${KEEP_DAYS} -delete
REMAINING=$(ls -1 "$BACKUP_DIR"/db_evkin_*.sql.gz 2>/dev/null | wc -l)
echo "[$(date)] Backups retained: $REMAINING (keeping ${KEEP_DAYS} days)"
