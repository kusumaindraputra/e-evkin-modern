<#
PowerShell script to create PostgreSQL backup (custom format) and compress it.
Usage:
  # Use .env file if present
  .\scripts\backup_db.ps1

  # Or provide parameters
  .\scripts\backup_db.ps1 -Host localhost -Port 5432 -DbName e_evkin_modern -User postgres

Output:
  - ./backups/e-evkin-backup_YYYYMMDD_HHMMSS.dump.gz (compressed custom-format dump)

Requirements:
  - `pg_dump` in PATH (PostgreSQL client installed)
  - PowerShell 5+ (Windows) or PowerShell core on Linux
#>

param(
    [string]$Host,
    [int]$Port = 5432,
    [string]$DbName,
    [string]$User = 'postgres',
    [switch]$UseEnvFile,
    [string]$EnvFilePath = 'backend/.env.production'
)

function Read-EnvFile($path) {
    if (-not (Test-Path $path)) { return @{} }
    $lines = Get-Content $path | Where-Object { $_ -and ($_ -notmatch '^\s*#') }
    $obj = @{}
    foreach ($ln in $lines) {
        if ($ln -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$') {
            $k = $matches[1]
            $v = $matches[2]
            # Trim possible quotes
            if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Trim('"') }
            if ($v.StartsWith("'") -and $v.EndsWith("'")) { $v = $v.Trim("'") }
            $obj[$k] = $v
        }
    }
    return $obj
}

# If requested, attempt to read env file
if ($UseEnvFile -or (-not $Host -or -not $DbName)) {
    $envPath = Resolve-Path -LiteralPath $EnvFilePath -ErrorAction SilentlyContinue
    if ($envPath) {
        Write-Host "Reading env file: $envPath" -ForegroundColor Cyan
        $env = Read-EnvFile $envPath
        if (-not $Host -and $env.ContainsKey('DB_HOST')) { $Host = $env['DB_HOST'] }
        if ($env.ContainsKey('DB_PORT')) { $Port = [int]$env['DB_PORT'] }
        if (-not $DbName -and $env.ContainsKey('DB_NAME')) { $DbName = $env['DB_NAME'] }
        if ($env.ContainsKey('DB_USER')) { $User = $env['DB_USER'] }
        if ($env.ContainsKey('DB_PASS')) { $Global:DB_PASS = $env['DB_PASS'] }
    }
}

if (-not $Host) { $Host = 'localhost' }
if (-not $DbName) {
    Write-Host "Database name required. Provide -DbName or set DB_NAME in $EnvFilePath" -ForegroundColor Red
    exit 1
}

# Check pg_dump
$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    Write-Host "pg_dump not found in PATH. Install PostgreSQL client or add pg_dump to PATH." -ForegroundColor Red
    exit 1
}

# Prepare output
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path -Path (Get-Location) -ChildPath "backups"
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
$dumpFile = Join-Path $backupDir "e-evkin-backup_$timestamp.dump"
$compressedFile = "$dumpFile.gz"

# Build pg_dump arguments (custom format)
# Use -Fc for custom format (recommended for pg_restore)
$pgArgs = @("-h", $Host, "-p", $Port.ToString(), "-U", $User, "-F", "c", "-f", $dumpFile, $DbName)

# Inform user (do not echo password)
Write-Host "Creating backup for database '$DbName' on $Host:$Port as user '$User'..." -ForegroundColor Green

# If DB_PASS available, use PGPASSWORD env var for this process
if ($Global:DB_PASS) {
    $env:PGPASSWORD = $Global:DB_PASS
} else {
    # Prompt for password
    $secure = Read-Host -AsSecureString "Enter DB password for $User (leave empty to use existing PGPASSWORD)"
    if ($secure.Length -gt 0) {
        $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        $pwd = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        $env:PGPASSWORD = $pwd
    }
}

# Run pg_dump
$start = Get-Date
$proc = Start-Process -FilePath $pgDump.Path -ArgumentList $pgArgs -NoNewWindow -Wait -PassThru -RedirectStandardError STDERR.txt -RedirectStandardOutput STDOUT.txt
if ($proc.ExitCode -ne 0) {
    Write-Error "pg_dump failed. See STDERR.txt"
    Get-Content STDERR.txt -Tail 50
    exit $proc.ExitCode
}

Write-Host "pg_dump completed. Compressing dump..." -ForegroundColor Green
# Compress with gzip
if (Test-Path $compressedFile) { Remove-Item $compressedFile }
# Use gzip if available
$gzip = Get-Command gzip -ErrorAction SilentlyContinue
if ($gzip) {
    & $gzip -f $dumpFile
} else {
    # Use .NET compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.CompressionLevel]$level = [System.IO.Compression.CompressionLevel]::Optimal
    $sourceStream = [System.IO.File]::OpenRead($dumpFile)
    $destStream = [System.IO.File]::Create($compressedFile)
    $gzipStream = New-Object System.IO.Compression.GzipStream($destStream, $level)
    $sourceStream.CopyTo($gzipStream)
    $gzipStream.Close(); $sourceStream.Close(); $destStream.Close()
    Remove-Item $dumpFile
}
$end = Get-Date
$duration = $end - $start
Write-Host "Backup saved to: $compressedFile" -ForegroundColor Cyan
Write-Host "Duration: $($duration.ToString())" -ForegroundColor Cyan

# Unset PGPASSWORD
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host "Done." -ForegroundColor Green
