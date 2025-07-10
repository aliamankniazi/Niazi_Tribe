# Environment Validation Script for Windows
# This script validates environment variables and configuration

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

function Test-DatabaseConnection {
    param (
        [string]$dbHost,
        [string]$database,
        [string]$user,
        [string]$password
    )

    try {
        $query = "SELECT 1"
        mysql -h $dbHost -u $user -p$password $database -e $query | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-RedisConnection {
    param (
        [string]$connectionString
    )

    try {
        $redis = $connectionString -split "@"
        if ($redis.Length -gt 1) {
            $redisHost = ($redis[1] -split ":")[0]
            $port = ($redis[1] -split ":")[1]
        } else {
            $redisHost = ($redis[0] -split ":")[0]
            $port = ($redis[0] -split ":")[1]
        }

        $result = Test-NetConnection -ComputerName $redisHost -Port $port -WarningAction SilentlyContinue
        return $result.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

function Test-UrlFormat {
    param (
        [string]$url
    )

    try {
        $uri = [System.Uri]::new($url)
        return $true
    }
    catch {
        return $false
    }
}

function Test-SecretStrength {
    param (
        [string]$secret
    )

    if ($secret.Length -lt 32) {
        return $false
    }

    $hasUpperCase = $secret -cmatch "[A-Z]"
    $hasLowerCase = $secret -cmatch "[a-z]"
    $hasDigit = $secret -match "\d"
    $hasSpecial = $secret -match "[^a-zA-Z0-9]"

    return $hasUpperCase -and $hasLowerCase -and $hasDigit -and $hasSpecial
}

function Test-EnvFile {
    param (
        [string]$envFile
    )

    if (-not (Test-Path $envFile)) {
        Write-ColorOutput $Red "❌ Environment file not found: $envFile"
        return
    }

    Write-ColorOutput $Yellow "`n🔍 Validating $envFile..."
    $envContent = Get-Content $envFile

    # Required variables by category
    $requiredVars = @{
        "Server Configuration" = @(
            @{name="NODE_ENV"; validator={param($v) $v -in @("development", "production", "test")}}
            @{name="PORT"; validator={param($v) $v -match "^\d+$" -and [int]$v -gt 0 -and [int]$v -lt 65536}}
        )
        "Database Configuration" = @(
            @{name="MYSQL_HOST"; validator={param($v) -not [string]::IsNullOrWhiteSpace($v)}}
            @{name="MYSQL_DATABASE"; validator={param($v) -not [string]::IsNullOrWhiteSpace($v)}}
            @{name="MYSQL_USER"; validator={param($v) -not [string]::IsNullOrWhiteSpace($v)}}
            @{name="MYSQL_PASSWORD"; validator={param($v) -not [string]::IsNullOrWhiteSpace($v)}}
        )
        "Redis Configuration" = @(
            @{name="REDIS_URL"; validator={param($v) Test-RedisConnection $v}}
        )
        "Security Configuration" = @(
            @{name="JWT_SECRET"; validator={param($v) Test-SecretStrength $v}}
            @{name="SESSION_SECRET"; validator={param($v) Test-SecretStrength $v}}
        )
        "Email Configuration" = @(
            @{name="SMTP_HOST"; validator={param($v) -not [string]::IsNullOrWhiteSpace($v)}}
            @{name="SMTP_PORT"; validator={param($v) $v -match "^\d+$" -and [int]$v -gt 0 -and [int]$v -lt 65536}}
            @{name="SMTP_USER"; validator={param($v) -not [string]::IsNullOrWhiteSpace($v)}}
            @{name="SMTP_PASS"; validator={param($v) -not [string]::IsNullOrWhiteSpace($v)}}
        )
        "Application URLs" = @(
            @{name="API_URL"; validator={param($v) Test-UrlFormat $v}}
            @{name="CLIENT_URL"; validator={param($v) Test-UrlFormat $v}}
        )
    }

    $missingVars = @()
    $invalidVars = @()

    foreach ($category in $requiredVars.Keys) {
        Write-ColorOutput $Yellow "`n📋 Checking $category..."
        
        foreach ($var in $requiredVars[$category]) {
            $varName = $var.name
            $varLine = $envContent | Where-Object { $_ -match "^$varName=" }
            
            if (-not $varLine) {
                $missingVars += $varName
                Write-ColorOutput $Red "❌ Missing: $varName"
                continue
            }

            $varValue = ($varLine -split "=", 2)[1].Trim("'", '"')
            if (-not (& $var.validator $varValue)) {
                $invalidVars += $varName
                Write-ColorOutput $Red "❌ Invalid: $varName"
            } else {
                Write-ColorOutput $Green "✅ Valid: $varName"
            }
        }
    }

    # Test database connection if all required vars are present
    $dbVars = $requiredVars["Database Configuration"]
    $hasAllDbVars = -not ($dbVars | Where-Object { $_.name -in $missingVars })
    
    if ($hasAllDbVars) {
        Write-ColorOutput $Yellow "`n🗄️ Testing database connection..."
        $dbHost = ($envContent | Where-Object { $_ -match "^MYSQL_HOST=" }) -replace "^MYSQL_HOST=", "" -replace '"', ''
        $dbName = ($envContent | Where-Object { $_ -match "^MYSQL_DATABASE=" }) -replace "^MYSQL_DATABASE=", "" -replace '"', ''
        $dbUser = ($envContent | Where-Object { $_ -match "^MYSQL_USER=" }) -replace "^MYSQL_USER=", "" -replace '"', ''
        $dbPass = ($envContent | Where-Object { $_ -match "^MYSQL_PASSWORD=" }) -replace "^MYSQL_PASSWORD=", "" -replace '"', ''

        if (Test-DatabaseConnection -dbHost $dbHost -database $dbName -user $dbUser -password $dbPass) {
            Write-ColorOutput $Green "✅ Database connection successful"
        } else {
            Write-ColorOutput $Red "❌ Could not connect to database"
        }
    }

    # Summary
    Write-ColorOutput $Yellow "`n📝 Environment Validation Summary for $envFile"
    if ($missingVars.Count -eq 0 -and $invalidVars.Count -eq 0) {
        Write-ColorOutput $Green "✅ All environment variables are properly configured"
    } else {
        if ($missingVars.Count -gt 0) {
            Write-ColorOutput $Red "`n❌ Missing variables:"
            foreach ($var in $missingVars) {
                Write-Output "   - $var"
            }
        }
        if ($invalidVars.Count -gt 0) {
            Write-ColorOutput $Red "`n❌ Invalid variables:"
            foreach ($var in $invalidVars) {
                Write-Output "   - $var"
            }
        }
    }
}

# Main validation process
Write-ColorOutput $Yellow "🔍 Starting Environment Validation..."

# Check for environment files
$envFiles = @(
    ".env",
    ".env.production",
    ".env.local"
)

foreach ($file in $envFiles) {
    Test-EnvFile $file
}

Write-Output "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 