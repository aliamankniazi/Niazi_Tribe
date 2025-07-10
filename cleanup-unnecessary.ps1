# Remove Laravel and unnecessary files
Write-Host "Cleaning up unnecessary files..."

# Remove Laravel-specific files
$laravelFiles = @(
    "env.example",
    "env.local.example",
    "env.production.example",
    "composer.json.bak",
    "setup-database.sql"
)

foreach ($file in $laravelFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removed $file"
    }
}

# Clean up vendor directory
Write-Host "Cleaning up vendor directory..."
$vendorDirsToRemove = @(
    "illuminate",
    "laravel"
)

foreach ($dir in $vendorDirsToRemove) {
    $path = Join-Path "vendor" $dir
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force
        Write-Host "Removed $path"
    }
}

# Update composer.json to remove Laravel dependencies
$composerJson = Get-Content "composer.json" | ConvertFrom-Json
$composerJson.require = @{}
$composerJson | ConvertTo-Json | Set-Content "composer.json"
Write-Host "Updated composer.json"

# Remove unnecessary test and deployment files
$unnecessaryFiles = @(
    "test-deployment.sh",
    "pre-deployment-check.js",
    "check-warnings.js",
    "MYSQL_INSTALLATION_GUIDE.md",
    "MYSQL_SETUP.md"
)

foreach ($file in $unnecessaryFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removed $file"
    }
}

Write-Host "Cleanup completed successfully!" 