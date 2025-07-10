# Enhanced Deployment Check Script for Windows
# This script performs comprehensive verification of your deployment setup

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

function Test-Command($Command) {
    return [bool](Get-Command -Name $Command -ErrorAction SilentlyContinue)
}

function Test-Port($Port) {
    $result = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $result.TcpTestSucceeded
}

function Test-EnvFile($Path) {
    if (Test-Path $Path) {
        $content = Get-Content $Path
        $requiredVars = @(
            "NODE_ENV",
            "PORT",
            "MYSQL_HOST",
            "MYSQL_DATABASE",
            "REDIS_URL",
            "JWT_SECRET"
        )
        $missingVars = @()
        foreach ($var in $requiredVars) {
            if (-not ($content | Where-Object { $_ -match "^$var=" })) {
                $missingVars += $var
            }
        }
        return $missingVars
    }
    return $null
}

Write-ColorOutput $Green "🔍 Starting Enhanced Deployment Verification..."
Write-Output ""

# Check required files
Write-ColorOutput $Yellow "📋 Checking required files..."
$requiredFiles = @(
    ".github\workflows\deploy.yml",
    ".env.example",
    "package.json",
    "apps\api\package.json",
    "apps\ui\package.json",
    "apps\api\tsconfig.json",
    "apps\ui\tsconfig.json"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-ColorOutput $Red "❌ Missing required files:"
    foreach ($file in $missingFiles) {
        Write-Output "   - $file"
    }
} else {
    Write-ColorOutput $Green "✅ All required files present!"
}
Write-Output ""

# Check Git configuration
Write-ColorOutput $Yellow "📦 Checking Git configuration..."
$hasGit = Test-Path ".git"
$hasRemote = $false
$hasMain = $false
$hasGitignore = Test-Path ".gitignore"

if ($hasGit) {
    Write-ColorOutput $Green "✅ Git repository initialized"
    $remote = git remote -v
    if ($remote) {
        Write-ColorOutput $Green "✅ Git remote configured: $remote"
        $hasRemote = $true
    } else {
        Write-ColorOutput $Red "❌ No Git remote configured"
    }

    $branch = git branch --show-current
    if ($branch -eq "main") {
        Write-ColorOutput $Green "✅ On main branch"
        $hasMain = $true
    } else {
        Write-ColorOutput $Red "❌ Not on main branch (current: $branch)"
    }

    # Check if sensitive files are gitignored
    if ($hasGitignore) {
        $gitignore = Get-Content ".gitignore"
        $requiredIgnores = @(".env", "node_modules/", ".env.local", ".env.production")
        $missingIgnores = @()
        foreach ($ignore in $requiredIgnores) {
            if (-not ($gitignore | Where-Object { $_ -match $ignore })) {
                $missingIgnores += $ignore
            }
        }
        if ($missingIgnores.Count -gt 0) {
            Write-ColorOutput $Red "❌ Missing .gitignore entries:"
            foreach ($ignore in $missingIgnores) {
                Write-Output "   - $ignore"
            }
        } else {
            Write-ColorOutput $Green "✅ .gitignore properly configured"
        }
    } else {
        Write-ColorOutput $Red "❌ No .gitignore file found"
    }
} else {
    Write-ColorOutput $Red "❌ Git repository not initialized"
}
Write-Output ""

# Check Node.js and dependencies
Write-ColorOutput $Yellow "📦 Checking Node.js setup..."
if (Test-Command "node") {
    $nodeVersion = node -v
    Write-ColorOutput $Green "✅ Node.js installed: $nodeVersion"
    
    # Check package.json
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    Write-ColorOutput $Green "✅ Package name: $($packageJson.name)"
    Write-ColorOutput $Green "✅ Version: $($packageJson.version)"
    
    # Check for critical dependencies
    $criticalDeps = @("typescript", "react", "next", "express")
    $missingDeps = @()
    foreach ($dep in $criticalDeps) {
        if (-not ($packageJson.dependencies.$dep -or $packageJson.devDependencies.$dep)) {
            $missingDeps += $dep
        }
    }
    if ($missingDeps.Count -gt 0) {
        Write-ColorOutput $Red "❌ Missing critical dependencies: $($missingDeps -join ', ')"
    } else {
        Write-ColorOutput $Green "✅ All critical dependencies present"
    }
} else {
    Write-ColorOutput $Red "❌ Node.js not installed"
}
Write-Output ""

# Check environment files
Write-ColorOutput $Yellow "🔧 Checking environment configuration..."
$envFiles = @{
    ".env" = "Development environment"
    ".env.production" = "Production environment"
}

foreach ($file in $envFiles.Keys) {
    $missingVars = Test-EnvFile $file
    if ($null -eq $missingVars) {
        Write-ColorOutput $Red "❌ Missing $($envFiles[$file]) file: $file"
    } elseif ($missingVars.Count -gt 0) {
        Write-ColorOutput $Red "❌ Missing variables in $file:"
        foreach ($var in $missingVars) {
            Write-Output "   - $var"
        }
    } else {
        Write-ColorOutput $Green "✅ $($envFiles[$file]) properly configured"
    }
}
Write-Output ""

# Check ports
Write-ColorOutput $Yellow "🌐 Checking required ports..."
$ports = @{
    3000 = "Next.js"
    4000 = "API Server"
    6379 = "Redis"
    3306 = "MySQL"
}

foreach ($port in $ports.Keys) {
    if (Test-Port $port) {
        Write-ColorOutput $Red "⚠️ Port $port ($($ports[$port])) is already in use"
    } else {
        Write-ColorOutput $Green "✅ Port $port ($($ports[$port])) is available"
    }
}
Write-Output ""

# Check deployment keys
Write-ColorOutput $Yellow "🔑 Checking deployment keys..."
if (Test-Path ".github\keys\deploy_key") {
    Write-ColorOutput $Green "✅ Deployment private key exists"
    # Check key permissions
    $acl = Get-Acl ".github\keys\deploy_key"
    if ($acl.Access.Count -gt 2) {
        Write-ColorOutput $Red "⚠️ Deployment key permissions too permissive"
    } else {
        Write-ColorOutput $Green "✅ Deployment key permissions are secure"
    }
} else {
    Write-ColorOutput $Red "❌ Deployment private key missing"
}

if (Test-Path ".github\keys\deploy_key.pub") {
    Write-ColorOutput $Green "✅ Deployment public key exists"
} else {
    Write-ColorOutput $Red "❌ Deployment public key missing"
}
Write-Output ""

# Check database configuration
Write-ColorOutput $Yellow "🗄️ Checking database setup..."
if (Test-Command "mysql") {
    Write-ColorOutput $Green "✅ MySQL client installed"
    # Check if MySQL service is running
    $mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
    if ($mysqlService -and $mysqlService.Status -eq "Running") {
        Write-ColorOutput $Green "✅ MySQL service is running"
    } else {
        Write-ColorOutput $Red "❌ MySQL service is not running"
    }
} else {
    Write-ColorOutput $Red "❌ MySQL client not installed"
}
Write-Output ""

# Summary and recommendations
Write-ColorOutput $Yellow "`n📝 Deployment Setup Summary:"
$readyToDeploy = $true

if ($missingFiles.Count -gt 0) {
    Write-ColorOutput $Red "❌ Missing required files"
    Write-Output "   Run setup-deployment.ps1 to create missing files"
    $readyToDeploy = $false
}

if (-not $hasGit -or -not $hasRemote -or -not $hasMain) {
    Write-ColorOutput $Red "❌ Git setup incomplete"
    Write-Output "   Run setup-deployment.ps1 to configure Git"
    $readyToDeploy = $false
}

if (-not (Test-Command "node")) {
    Write-ColorOutput $Red "❌ Node.js setup incomplete"
    Write-Output "   Install Node.js from https://nodejs.org/"
    $readyToDeploy = $false
}

if (-not (Test-Path ".github\keys\deploy_key")) {
    Write-ColorOutput $Red "❌ Deployment keys missing"
    Write-Output "   Run setup-deployment.ps1 to generate deployment keys"
    $readyToDeploy = $false
}

if ($readyToDeploy) {
    Write-ColorOutput $Green "`n✅ Your setup is ready for deployment!"
    Write-Output "Next steps:"
    Write-Output "1. Push your changes to GitHub"
    Write-Output "2. Check GitHub Actions for deployment status"
    Write-Output "3. Monitor server logs after deployment"
} else {
    Write-ColorOutput $Red "`n⚠️ Your setup needs attention before deployment"
    Write-Output "Fix the issues above before deploying"
}

Write-Output "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 