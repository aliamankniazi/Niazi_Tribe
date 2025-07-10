# Deployment Setup Script for Windows
# Run this script as administrator

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

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-ColorOutput $Red "⚠️ Please run this script as Administrator!"
    exit 1
}

Write-ColorOutput $Green "🚀 Starting Deployment Setup..."
Write-Output ""

# Check for required tools
Write-ColorOutput $Yellow "📋 Checking required tools..."

$requiredTools = @{
    "git" = "Git"
    "ssh-keygen" = "OpenSSH"
    "node" = "Node.js"
    "npm" = "NPM"
}

$missingTools = @()
foreach ($tool in $requiredTools.Keys) {
    if (-not (Test-Command $tool)) {
        $missingTools += $requiredTools[$tool]
    }
}

if ($missingTools.Count -gt 0) {
    Write-ColorOutput $Red "❌ Missing required tools: $($missingTools -join ', ')"
    Write-Output "Please install the missing tools and run this script again."
    exit 1
}

Write-ColorOutput $Green "✅ All required tools are installed!"
Write-Output ""

# Get GitHub repository information
Write-ColorOutput $Yellow "🔧 GitHub Repository Setup"
$githubUsername = Read-Host "Enter your GitHub username"
$repoName = Read-Host "Enter your repository name"
$githubUrl = "https://github.com/$githubUsername/$repoName.git"

# Initialize Git repository if not already initialized
if (-not (Test-Path ".git")) {
    Write-ColorOutput $Yellow "Initializing Git repository..."
    git init
    Write-ColorOutput $Green "✅ Git repository initialized!"
}

# Create GitHub Actions directory and deployment keys
Write-ColorOutput $Yellow "🔑 Generating deployment keys..."
$keysPath = ".github\keys"
New-Item -ItemType Directory -Force -Path $keysPath | Out-Null
ssh-keygen -t rsa -b 4096 -C "deploy@$repoName" -f "$keysPath\deploy_key" -N '""'

Write-ColorOutput $Green "✅ Deployment keys generated!"
Write-Output ""

# Setup GitHub Actions workflow directory
Write-ColorOutput $Yellow "📁 Setting up GitHub Actions workflow..."
New-Item -ItemType Directory -Force -Path ".github\workflows" | Out-Null

# Configure Git
Write-ColorOutput $Yellow "⚙️ Configuring Git..."
git config receive.denyCurrentBranch updateInstead

# Create or switch to main branch
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "main") {
    Write-ColorOutput $Yellow "Switching to main branch..."
    git checkout -b main
}

# Display next steps
Write-ColorOutput $Green "`n🎉 Local setup completed!"
Write-Output "`nNext steps:"
Write-ColorOutput $Yellow "1. Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):"
Write-Output "   - Name: SSH_PRIVATE_KEY"
Write-Output "   Content: (Copy the content below)"
Write-Output "   ----------------------------------------"
Get-Content "$keysPath\deploy_key"
Write-Output "   ----------------------------------------"

Write-Output "`n2. Add this public key to your server's authorized_keys:"
Write-Output "   ----------------------------------------"
Get-Content "$keysPath\deploy_key.pub"
Write-Output "   ----------------------------------------"

Write-ColorOutput $Yellow "`n3. Add these additional secrets to GitHub:"
Write-Output "   - SERVER_IP: Your server's IP address"
Write-Output "   - SERVER_USER: Your server username"
Write-Output "   - DEPLOY_PATH: Server deployment path (e.g., /var/www/niazitribe)"

Write-ColorOutput $Yellow "`n4. Push your code to GitHub:"
Write-Output "   git remote add origin $githubUrl"
Write-Output "   git add ."
Write-Output '   git commit -m "Initial commit"'
Write-Output "   git push -u origin main"

Write-ColorOutput $Yellow "`n5. On your server:"
Write-Output "   - Create the deployment directory:"
Write-Output "     mkdir -p /var/www/niazitribe"
Write-Output "   - Add the public key to ~/.ssh/authorized_keys"
Write-Output "   - Set proper permissions:"
Write-Output "     chmod 700 ~/.ssh"
Write-Output "     chmod 600 ~/.ssh/authorized_keys"

Write-ColorOutput $Green "`n✨ Setup complete! Follow the steps above to finish the deployment configuration."

# Offer to execute git commands
$executeGit = Read-Host "`nWould you like to push your code to GitHub now? (y/n)"
if ($executeGit -eq "y") {
    Write-ColorOutput $Yellow "`nPushing code to GitHub..."
    git remote add origin $githubUrl
    git add .
    git commit -m "Initial commit with deployment setup"
    git push -u origin main
    Write-ColorOutput $Green "✅ Code pushed to GitHub!"
}

Write-Output "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 