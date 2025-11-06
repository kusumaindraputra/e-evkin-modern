#!/bin/bash
# E-EVKIN Modern - Database Backup Script

# Configuration
BACKUP_DIR="/var/backups/e-evkin"
DB_NAME="e_evkin_staging"
DB_USER="evkin_user"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/e_evkin_backup_$TIMESTAMP.sql"
RETENTION_DAYS=30

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Create backup
echo "🔄 Creating database backup..."
PGPASSWORD=$DB_PASSWORD pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_FILE

# Compress backup
echo "📦 Compressing backup..."
gzip $BACKUP_FILE

# Remove old backups (older than retention days)
echo "🗑️  Removing old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "e_evkin_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log result
COMPRESSED_FILE="$BACKUP_FILE.gz"
if [ -f "$COMPRESSED_FILE" ]; then
    SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    echo "✅ Backup completed: $COMPRESSED_FILE ($SIZE)"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Keep only last 10 backups to save disk space
echo "📊 Keeping only last 10 backups..."
ls -t $BACKUP_DIR/e_evkin_backup_*.sql.gz | tail -n +11 | xargs -r rm

echo "✅ Backup process completed successfully!"
