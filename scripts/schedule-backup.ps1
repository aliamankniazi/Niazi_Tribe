# Backup Scheduler Script for Windows
# This script creates a scheduled task to run backups automatically

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

function Test-AdminPrivileges {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal $currentUser
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check for admin privileges
if (-not (Test-AdminPrivileges)) {
    Write-ColorOutput $Red "❌ This script requires administrator privileges"
    Write-ColorOutput $Yellow "Please run PowerShell as Administrator and try again"
    exit 1
}

# Script parameters
$taskName = "NiaziTribeBackup"
$scriptPath = Join-Path $PSScriptRoot "backup-system.ps1"
$backupDir = "C:\niazitribe\backup"

# Ensure backup directory exists
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

Write-ColorOutput $Yellow "🕒 Setting up automated backup schedule..."

# Create action to run backup script
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -scheduled -backupDir `"$backupDir`""

# Create daily trigger (runs at 2 AM)
$trigger = New-ScheduledTaskTrigger -Daily -At 2am

# Set task settings
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopOnIdleEnd `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -RestartCount 3

# Get current user for task principal
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -RunLevel Highest

# Remove existing task if it exists
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# Register new task
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Automated backup for Niazi-Tribe application"

    Write-ColorOutput $Green "✅ Backup schedule created successfully!"
    Write-Output "Task Name: $taskName"
    Write-Output "Schedule: Daily at 2 AM"
    Write-Output "Backup Location: $backupDir"
    Write-Output "Script: $scriptPath"
}
catch {
    Write-ColorOutput $Red "❌ Failed to create backup schedule: $_"
    exit 1
}

Write-Output "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 