# PowerShell script to clean up unnecessary files
# This script will remove migration scripts and backup directories

Write-Host "Cleaning up unnecessary files..." -ForegroundColor Yellow

# Remove migration scripts
$scripts = @(
    "migrate-to-plain-php.ps1",
    "remove-laravel.ps1",
    "clean-vendor.ps1",
    "replace-with-plain-php.ps1"
)

foreach ($script in $scripts) {
    if (Test-Path -Path $script) {
        Write-Host "Removing $script..." -ForegroundColor Cyan
        Remove-Item -Path $script -Force
    }
}

# Remove backup directories
$backupDirs = Get-ChildItem -Directory | Where-Object { $_.Name -like "*backup*" }
foreach ($dir in $backupDirs) {
    Write-Host "Removing backup directory: $($dir.Name)..." -ForegroundColor Cyan
    Remove-Item -Path $dir.FullName -Recurse -Force
}

# Remove any remaining Laravel-specific files
$laravelFiles = @(
    "artisan",
    "server.php"
)

foreach ($file in $laravelFiles) {
    if (Test-Path -Path $file) {
        Write-Host "Removing Laravel file: $file..." -ForegroundColor Cyan
        Remove-Item -Path $file -Force
    }
}

# Clean up composer.json if it exists
if (Test-Path -Path "composer.json") {
    Write-Host "Updating composer.json..." -ForegroundColor Cyan
    $composerJson = Get-Content -Path "composer.json" -Raw | ConvertFrom-Json
    
    # Create a backup of composer.json
    Copy-Item -Path "composer.json" -Destination "composer.json.bak"
    
    # Remove Laravel dependencies
    $laravel_packages = @(
        "laravel/framework",
        "laravel/sanctum",
        "laravel/tinker",
        "laravel/scout"
    )
    
    $updated = $false
    foreach ($package in $laravel_packages) {
        if ($composerJson.require.PSObject.Properties.Name -contains $package) {
            $composerJson.require.PSObject.Properties.Remove($package)
            $updated = $true
        }
    }
    
    if ($updated) {
        $composerJson | ConvertTo-Json -Depth 10 | Set-Content -Path "composer.json"
        Write-Host "Removed Laravel dependencies from composer.json" -ForegroundColor Green
    }
}

# Remove this cleanup script itself
Write-Host "Cleanup completed. This script will self-delete after execution." -ForegroundColor Green
# The following line will be executed when the script completes
# Remove-Item -Path $MyInvocation.MyCommand.Path -Force 