# Automated Backup Script for Windows
# This script creates comprehensive backups of the application

# Enable color output
$Host.UI.RawUI.ForegroundColor = "White"
$Green = [System.ConsoleColor]::Green
$Yellow = [System.ConsoleColor]::Yellow
$Red = [System.ConsoleColor]::Red

function Write-ColorOutput($Color, $Message) {
    $prevColor = $Host.UI.RawUI.ForegroundColor
    $Host.UI.RawUI.ForegroundColor = $Color
    Write-Output $Message
    $Host.UI.RawUI.ForegroundColor = $prevColor
}

function Get-FormattedDate {
    return Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
}

function New-BackupDirectory {
    param (
        [string]$baseDir = ".\backup"
    )

    $timestamp = Get-FormattedDate
    $backupDir = Join-Path $baseDir $timestamp

    try {
        if (-not (Test-Path $baseDir)) {
            New-Item -ItemType Directory -Path $baseDir | Out-Null
        }

        New-Item -ItemType Directory -Path $backupDir | Out-Null
        New-Item -ItemType Directory -Path (Join-Path $backupDir "db") | Out-Null
        New-Item -ItemType Directory -Path (Join-Path $backupDir "api") | Out-Null
        New-Item -ItemType Directory -Path (Join-Path $backupDir "ui") | Out-Null
        New-Item -ItemType Directory -Path (Join-Path $backupDir "logs") | Out-Null
        New-Item -ItemType Directory -Path (Join-Path $backupDir "config") | Out-Null

        return $backupDir
    }
    catch {
        Write-ColorOutput $Red "❌ Failed to create backup directory: $_"
        return $null
    }
}

function Backup-Database {
    param (
        [string]$backupDir
    )

    Write-ColorOutput $Yellow "🗄️ Backing up database..."

    try {
        # Get database credentials from .env
        $envContent = Get-Content ".env" -ErrorAction Stop
        $dbHost = ($envContent | Where-Object { $_ -match "^MYSQL_HOST=" }) -replace "^MYSQL_HOST=", "" -replace '"', ''
        $dbName = ($envContent | Where-Object { $_ -match "^MYSQL_DATABASE=" }) -replace "^MYSQL_DATABASE=", "" -replace '"', ''
        $dbUser = ($envContent | Where-Object { $_ -match "^MYSQL_USER=" }) -replace "^MYSQL_USER=", "" -replace '"', ''
        $dbPass = ($envContent | Where-Object { $_ -match "^MYSQL_PASSWORD=" }) -replace "^MYSQL_PASSWORD=", "" -replace '"', ''

        if (-not $dbHost -or -not $dbName -or -not $dbUser -or -not $dbPass) {
            throw "Missing database configuration in .env"
        }

        $timestamp = Get-FormattedDate
        $backupFile = Join-Path $backupDir "db\backup_$timestamp.sql"

        # Create database backup
        try {
            $pinfo = New-Object System.Diagnostics.ProcessStartInfo
            $pinfo.FileName = "mysqldump"
            $pinfo.RedirectStandardOutput = $true
            $pinfo.UseShellExecute = $false
            $pinfo.Arguments = "-h $dbHost -u $dbUser -p$dbPass $dbName"

            $p = New-Object System.Diagnostics.Process
            $p.StartInfo = $pinfo
            $p.Start() | Out-Null
            $output = $p.StandardOutput.ReadToEnd()
            $p.WaitForExit()

            if ($p.ExitCode -eq 0) {
                Set-Content -Path $backupFile -Value $output
                Write-ColorOutput $Green "✅ Database backup created: $backupFile"
                return $true
            } else {
                throw "Database backup failed with exit code: $($p.ExitCode)"
            }
        }
        catch {
            Write-ColorOutput $Red "❌ Database backup failed: $_"
            return $false
        }
    }
    catch {
        Write-ColorOutput $Red "❌ Database backup failed: $_"
        return $false
    }
}

function Backup-ApplicationFiles {
    param (
        [string]$backupDir
    )

    Write-ColorOutput $Yellow "📂 Backing up application files..."

    try {
        # Backup API files
        if (Test-Path ".\apps\api") {
            Copy-Item ".\apps\api\*" -Destination (Join-Path $backupDir "api") -Recurse -Force
            Write-ColorOutput $Green "✅ API files backed up"
        }

        # Backup UI files
        if (Test-Path ".\apps\ui") {
            Copy-Item ".\apps\ui\*" -Destination (Join-Path $backupDir "ui") -Recurse -Force
            Write-ColorOutput $Green "✅ UI files backed up"
        }

        # Backup environment files
        $envFiles = @(".env", ".env.production", ".env.local")
        foreach ($file in $envFiles) {
            if (Test-Path $file) {
                Copy-Item $file -Destination (Join-Path $backupDir "config") -Force
                Write-ColorOutput $Green "✅ $file backed up"
            }
        }

        # Backup logs
        if (Test-Path ".\logs") {
            Copy-Item ".\logs\*" -Destination (Join-Path $backupDir "logs") -Recurse -Force
            Write-ColorOutput $Green "✅ Log files backed up"
        }

        return $true
    }
    catch {
        Write-ColorOutput $Red "❌ Application backup failed: $_"
        return $false
    }
}

function Compress-Backup {
    param (
        [string]$backupDir
    )

    Write-ColorOutput $Yellow "📦 Compressing backup..."

    try {
        $timestamp = Get-FormattedDate
        $zipFile = "$backupDir.zip"

        Compress-Archive -Path $backupDir -DestinationPath $zipFile -Force
        if (Test-Path $zipFile) {
            Remove-Item $backupDir -Recurse -Force
            Write-ColorOutput $Green "✅ Backup compressed: $zipFile"
            return $true
        } else {
            throw "Zip file was not created"
        }
    }
    catch {
        Write-ColorOutput $Red "❌ Backup compression failed: $_"
        return $false
    }
}

function Remove-OldBackups {
    param (
        [string]$backupDir = ".\backup",
        [int]$keepCount = 5
    )

    Write-ColorOutput $Yellow "🧹 Cleaning up old backups..."

    try {
        $backups = Get-ChildItem $backupDir -Filter "*.zip" | Sort-Object LastWriteTime -Descending
        if ($backups.Count -gt $keepCount) {
            $toDelete = $backups | Select-Object -Skip $keepCount
            foreach ($backup in $toDelete) {
                Remove-Item $backup.FullName -Force
                Write-ColorOutput $Green "✅ Removed old backup: $($backup.Name)"
            }
        }
        return $true
    }
    catch {
        Write-ColorOutput $Red "❌ Cleanup failed: $_"
        return $false
    }
}

# Parse command line arguments
param (
    [switch]$scheduled = $false,
    [string]$backupDir = ".\backup",
    [int]$keepCount = 5
)

# Main backup process
Write-ColorOutput $Yellow "🚀 Starting system backup..."

# Create backup directory
$currentBackupDir = New-BackupDirectory -baseDir $backupDir
if (-not $currentBackupDir) {
    Write-ColorOutput $Red "❌ Backup failed - could not create backup directory"
    exit 1
}

# Backup database
$dbSuccess = Backup-Database -backupDir $currentBackupDir
if (-not $dbSuccess) {
    Write-ColorOutput $Red "❌ Database backup failed"
    if (-not $scheduled) {
        Write-Output "`nPress any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}

# Backup application files
$appSuccess = Backup-ApplicationFiles -backupDir $currentBackupDir
if (-not $appSuccess) {
    Write-ColorOutput $Red "❌ Application backup failed"
    if (-not $scheduled) {
        Write-Output "`nPress any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}

# Compress backup
$compressSuccess = Compress-Backup -backupDir $currentBackupDir
if (-not $compressSuccess) {
    Write-ColorOutput $Red "❌ Backup compression failed"
    if (-not $scheduled) {
        Write-Output "`nPress any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    exit 1
}

# Clean up old backups
$cleanupSuccess = Remove-OldBackups -backupDir $backupDir -keepCount $keepCount
if (-not $cleanupSuccess) {
    Write-ColorOutput $Yellow "⚠️ Warning: Failed to clean up old backups"
}

Write-ColorOutput $Green "`n✅ System backup completed successfully!"
Write-Output "Backup location: $currentBackupDir.zip"

if (-not $scheduled) {
    Write-Output "`nPress any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} 