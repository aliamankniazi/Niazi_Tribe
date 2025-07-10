# Deployment Rollback Script for Windows
# This script helps revert deployment changes in case of issues

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

function Get-DeploymentBackup {
    param (
        [string]$backupDir = ".\backup"
    )
    
    if (-not (Test-Path $backupDir)) {
        Write-ColorOutput $Red "❌ No backup directory found at $backupDir"
        return $null
    }

    $backups = Get-ChildItem $backupDir -Directory | Sort-Object LastWriteTime -Descending
    if ($backups.Count -eq 0) {
        Write-ColorOutput $Red "❌ No backups found in $backupDir"
        return $null
    }

    return $backups[0].FullName
}

function Stop-ApplicationServices {
    Write-ColorOutput $Yellow "🛑 Stopping application services..."
    
    # Stop PM2 processes if running
    if (Get-Command "pm2" -ErrorAction SilentlyContinue) {
        pm2 stop all
        Write-ColorOutput $Green "✅ Stopped PM2 processes"
    }

    # Stop any running Node.js processes
    $nodeProcesses = Get-Process "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Stop-Process -Name "node" -Force
        Write-ColorOutput $Green "✅ Stopped Node.js processes"
    }
}

function Restore-Database {
    param (
        [string]$backupPath
    )

    Write-ColorOutput $Yellow "🗄️ Restoring database..."
    
    # Get database credentials from .env
    $envContent = Get-Content ".env" -ErrorAction SilentlyContinue
    if (-not $envContent) {
        Write-ColorOutput $Red "❌ Could not read .env file"
        return $false
    }

    $dbHost = ($envContent | Where-Object { $_ -match "^MYSQL_HOST=" }) -replace "^MYSQL_HOST=", ""
    $dbName = ($envContent | Where-Object { $_ -match "^MYSQL_DATABASE=" }) -replace "^MYSQL_DATABASE=", ""
    $dbUser = ($envContent | Where-Object { $_ -match "^MYSQL_USER=" }) -replace "^MYSQL_USER=", ""
    $dbPass = ($envContent | Where-Object { $_ -match "^MYSQL_PASSWORD=" }) -replace "^MYSQL_PASSWORD=", ""

    if (-not $dbHost -or -not $dbName -or -not $dbUser -or -not $dbPass) {
        Write-ColorOutput $Red "❌ Missing database configuration in .env"
        return $false
    }

    # Find latest database backup
    $latestBackup = Get-ChildItem "$backupPath\db" -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $latestBackup) {
        Write-ColorOutput $Red "❌ No database backup found"
        return $false
    }

    # Restore database
    try {
        mysql -h $dbHost -u $dbUser -p$dbPass $dbName | Out-File -FilePath $latestBackup.FullName
        Write-ColorOutput $Green "✅ Database restored successfully"
        return $true
    }
    catch {
        Write-ColorOutput $Red "❌ Failed to restore database: $_"
        return $false
    }
}

function Restore-Files {
    param (
        [string]$backupPath
    )

    Write-ColorOutput $Yellow "📂 Restoring application files..."

    # Restore application files
    try {
        # Restore API files
        if (Test-Path "$backupPath\api") {
            Remove-Item ".\apps\api\*" -Recurse -Force
            Copy-Item "$backupPath\api\*" ".\apps\api\" -Recurse -Force
            Write-ColorOutput $Green "✅ API files restored"
        }

        # Restore UI files
        if (Test-Path "$backupPath\ui") {
            Remove-Item ".\apps\ui\*" -Recurse -Force
            Copy-Item "$backupPath\ui\*" ".\apps\ui\" -Recurse -Force
            Write-ColorOutput $Green "✅ UI files restored"
        }

        # Restore environment files
        if (Test-Path "$backupPath\.env") {
            Copy-Item "$backupPath\.env" ".\.env" -Force
            Write-ColorOutput $Green "✅ Environment files restored"
        }

        return $true
    }
    catch {
        Write-ColorOutput $Red "❌ Failed to restore files: $_"
        return $false
    }
}

function Start-ApplicationServices {
    Write-ColorOutput $Yellow "🚀 Starting application services..."

    # Install dependencies
    Write-ColorOutput $Yellow "📦 Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $Red "❌ Failed to install dependencies"
        return $false
    }

    # Build applications
    Write-ColorOutput $Yellow "🔨 Building applications..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $Red "❌ Failed to build applications"
        return $false
    }

    # Start PM2 processes
    if (Get-Command "pm2" -ErrorAction SilentlyContinue) {
        Write-ColorOutput $Yellow "🚀 Starting PM2 processes..."
        pm2 start
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput $Red "❌ Failed to start PM2 processes"
            return $false
        }
        Write-ColorOutput $Green "✅ PM2 processes started"
    }

    return $true
}

# Main rollback process
Write-ColorOutput $Yellow "🔄 Starting deployment rollback..."

# Get latest backup
$backupPath = Get-DeploymentBackup
if (-not $backupPath) {
    Write-ColorOutput $Red "❌ Cannot proceed with rollback - no backup found"
    exit 1
}

Write-ColorOutput $Green "📦 Using backup from: $backupPath"

# Confirm rollback
Write-ColorOutput $Yellow "`n⚠️ WARNING: This will rollback your deployment to the last backup."
Write-ColorOutput $Yellow "All current data and changes will be lost."
$confirmation = Read-Host "Are you sure you want to proceed? (y/N)"
if ($confirmation -ne "y") {
    Write-ColorOutput $Yellow "Rollback cancelled"
    exit 0
}

# Stop services
Stop-ApplicationServices

# Restore database
$dbRestored = Restore-Database -backupPath $backupPath
if (-not $dbRestored) {
    Write-ColorOutput $Red "❌ Database rollback failed"
    exit 1
}

# Restore files
$filesRestored = Restore-Files -backupPath $backupPath
if (-not $filesRestored) {
    Write-ColorOutput $Red "❌ File rollback failed"
    exit 1
}

# Start services
$servicesStarted = Start-ApplicationServices
if (-not $servicesStarted) {
    Write-ColorOutput $Red "❌ Failed to start services after rollback"
    Write-ColorOutput $Yellow "Please check the logs and start services manually"
    exit 1
}

Write-ColorOutput $Green "`n✅ Rollback completed successfully!"
Write-Output "Next steps:"
Write-Output "1. Verify application functionality"
Write-Output "2. Check logs for any errors"
Write-Output "3. Update deployment status in your tracking system"

Write-Output "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 