# Server Setup Script for Windows
# This script configures a Windows server for deployment

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

function Install-ChocolateyIfNeeded {
    if (-not (Get-Command "choco" -ErrorAction SilentlyContinue)) {
        Write-ColorOutput $Yellow "🍫 Installing Chocolatey..."
        try {
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
            Write-ColorOutput $Green "✅ Chocolatey installed successfully"
            return $true
        }
        catch {
            Write-ColorOutput $Red "❌ Failed to install Chocolatey: $_"
            return $false
        }
    }
    Write-ColorOutput $Green "✅ Chocolatey is already installed"
    return $true
}

function Write-ErrorLog {
    param (
        [string]$message,
        [string]$errorDetails,
        [string]$component
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logDir = ".\logs"
    $logFile = Join-Path $logDir "setup_errors.log"

    # Create logs directory if it doesn't exist
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir | Out-Null
    }

    # Format log entry
    $logEntry = @"
[$timestamp] $component Error
Message: $message
Details: $errorDetails
--------------------------------------------------
"@

    # Write to log file
    Add-Content -Path $logFile -Value $logEntry

    # Display error in console
    Write-ColorOutput $Red "❌ $component Error: $message"
    Write-ColorOutput $Yellow "See $logFile for details"
}

function Install-RequiredSoftware {
    Write-ColorOutput $Yellow "📦 Installing required software..."

    $packages = @(
        @{name="nodejs-lts"; description="Node.js LTS"},
        @{name="mysql"; description="MySQL Server"},
        @{name="redis"; description="Redis Server"},
        @{name="git"; description="Git"},
        @{name="python"; description="Python"},
        @{name="visualstudio2019buildtools"; description="Visual Studio Build Tools"}
    )

    $failedInstalls = @()

    foreach ($package in $packages) {
        Write-ColorOutput $Yellow "Installing $($package.description)..."
        try {
            $result = choco install $package.name -y
            if ($LASTEXITCODE -ne 0) {
                throw "Installation failed with exit code $LASTEXITCODE"
            }
            Write-ColorOutput $Green "✅ $($package.description) installed successfully"
        }
        catch {
            $failedInstalls += $package.name
            Write-ErrorLog `
                -message "Failed to install $($package.name)" `
                -errorDetails $_.Exception.Message `
                -component "Package Installation"
        }
    }

    # Install global npm packages
    Write-ColorOutput $Yellow "Installing global npm packages..."
    try {
        npm install -g pm2 typescript ts-node
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install global npm packages"
        }
        Write-ColorOutput $Green "✅ Global npm packages installed successfully"
    }
    catch {
        $failedInstalls += "npm-globals"
        Write-ErrorLog `
            -message "Failed to install global npm packages" `
            -errorDetails $_.Exception.Message `
            -component "NPM Installation"
    }

    return $failedInstalls.Count -eq 0
}

function Configure-Firewall {
    Write-ColorOutput $Yellow "🔒 Configuring Windows Firewall..."

    $ports = @(
        @{port=3000; description="Next.js"},
        @{port=4000; description="API Server"},
        @{port=6379; description="Redis"},
        @{port=3306; description="MySQL"}
    )

    $failedRules = @()

    foreach ($port in $ports) {
        $ruleName = "Niazi-Tribe - $($port.description)"
        
        try {
            # Remove existing rule if it exists
            Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

            # Add new rule
            New-NetFirewallRule -DisplayName $ruleName `
                               -Direction Inbound `
                               -Protocol TCP `
                               -LocalPort $port.port `
                               -Action Allow `
                               -Profile Any `
                               -ErrorAction Stop
            
            Write-ColorOutput $Green "✅ Firewall rule added for $($port.description) (Port $($port.port))"
        }
        catch {
            $failedRules += $ruleName
            Write-ErrorLog `
                -message "Failed to configure firewall rule for port $($port.port)" `
                -errorDetails $_.Exception.Message `
                -component "Firewall Configuration"
        }
    }

    return $failedRules.Count -eq 0
}

function Configure-Services {
    Write-ColorOutput $Yellow "⚙️ Configuring Windows Services..."

    $failedServices = @()

    # Configure MySQL
    Write-ColorOutput $Yellow "Configuring MySQL..."
    try {
        $services = Get-Service -Name "MySQL*"
        if ($services) {
            Set-Service -Name $services.Name -StartupType Automatic
            Start-Service -Name $services.Name
            Write-ColorOutput $Green "✅ MySQL service configured"
        } else {
            throw "MySQL service not found"
        }
    }
    catch {
        $failedServices += "MySQL"
        Write-ErrorLog `
            -message "Failed to configure MySQL service" `
            -errorDetails $_.Exception.Message `
            -component "Service Configuration"
    }

    # Configure Redis
    Write-ColorOutput $Yellow "Configuring Redis..."
    try {
        $services = Get-Service -Name "Redis"
        if ($services) {
            Set-Service -Name $services.Name -StartupType Automatic
            Start-Service -Name $services.Name
            Write-ColorOutput $Green "✅ Redis service configured"
        } else {
            throw "Redis service not found"
        }
    }
    catch {
        $failedServices += "Redis"
        Write-ErrorLog `
            -message "Failed to configure Redis service" `
            -errorDetails $_.Exception.Message `
            -component "Service Configuration"
    }

    return $failedServices.Count -eq 0
}

function Create-DeploymentUser {
    Write-ColorOutput $Yellow "👤 Creating deployment user..."

    try {
        $deployUser = "niazitribe_deploy"
        $deployPass = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})

        # Create local user
        $userExists = Get-LocalUser -Name $deployUser -ErrorAction SilentlyContinue
        if (-not $userExists) {
            New-LocalUser -Name $deployUser `
                         -Password (ConvertTo-SecureString -String $deployPass -AsPlainText -Force) `
                         -Description "Niazi-Tribe Deployment User" `
                         -PasswordNeverExpires `
                         -ErrorAction Stop

            # Add to necessary groups
            Add-LocalGroupMember -Group "Users" -Member $deployUser -ErrorAction Stop
            Write-ColorOutput $Green "✅ Deployment user created"
            
            # Save credentials to a secure file
            $credentials = @{
                username = $deployUser
                password = $deployPass
            }
            $credentials | ConvertTo-Json | Out-File ".\deployment_credentials.json"
            Write-ColorOutput $Yellow "⚠️ Deployment credentials saved to deployment_credentials.json"
            Write-ColorOutput $Yellow "⚠️ IMPORTANT: Save these credentials securely and delete the file"
            return $true
        } else {
            Write-ColorOutput $Yellow "⚠️ Deployment user already exists"
            return $true
        }
    }
    catch {
        Write-ErrorLog `
            -message "Failed to create deployment user" `
            -errorDetails $_.Exception.Message `
            -component "User Creation"
        return $false
    }
}

function Create-DeploymentStructure {
    Write-ColorOutput $Yellow "📂 Creating deployment directory structure..."

    try {
        $deploymentPath = "C:\niazitribe"
        $directories = @(
            "",
            "\apps",
            "\apps\api",
            "\apps\ui",
            "\backup",
            "\backup\db",
            "\logs",
            "\temp"
        )

        foreach ($dir in $directories) {
            $path = $deploymentPath + $dir
            if (-not (Test-Path $path)) {
                New-Item -ItemType Directory -Path $path -ErrorAction Stop
                Write-ColorOutput $Green "✅ Created directory: $path"
            }
        }

        # Set permissions
        $acl = Get-Acl $deploymentPath
        $deployUser = "niazitribe_deploy"
        $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
            $deployUser,
            "Modify",
            "ContainerInherit,ObjectInherit",
            "None",
            "Allow"
        )
        $acl.SetAccessRule($accessRule)
        Set-Acl $deploymentPath $acl -ErrorAction Stop

        Write-ColorOutput $Green "✅ Deployment directory structure created"
        return $true
    }
    catch {
        Write-ErrorLog `
            -message "Failed to create deployment structure" `
            -errorDetails $_.Exception.Message `
            -component "Directory Setup"
        return $false
    }
}

# Main setup process
Write-ColorOutput $Yellow "🚀 Starting server setup..."

# Initialize error tracking
$setupErrors = @()

# Check for admin privileges
if (-not (Test-AdminPrivileges)) {
    Write-ColorOutput $Red "❌ This script requires administrator privileges"
    Write-ColorOutput $Yellow "Please run PowerShell as Administrator and try again"
    exit 1
}

# Install Chocolatey
if (-not (Install-ChocolateyIfNeeded)) {
    Write-ErrorLog `
        -message "Failed to install Chocolatey" `
        -errorDetails "See previous error messages" `
        -component "Package Manager"
    $setupErrors += "Chocolatey"
}

# Install required software
if (-not (Install-RequiredSoftware)) {
    $setupErrors += "Software Installation"
}

# Configure firewall
if (-not (Configure-Firewall)) {
    $setupErrors += "Firewall"
}

# Configure services
if (-not (Configure-Services)) {
    $setupErrors += "Services"
}

# Create deployment user
if (-not (Create-DeploymentUser)) {
    $setupErrors += "Deployment User"
}

# Create deployment structure
if (-not (Create-DeploymentStructure)) {
    $setupErrors += "Directory Structure"
}

# Final status report
if ($setupErrors.Count -eq 0) {
    Write-ColorOutput $Green "`n✅ Server setup completed successfully!"
    Write-Output "Next steps:"
    Write-Output "1. Configure environment variables"
    Write-Output "2. Set up SSL certificates"
    Write-Output "3. Configure backup schedules"
    Write-Output "4. Set up monitoring"
} else {
    Write-ColorOutput $Red "`