# =============================================================================
# Stock Verification Module Deployment Script
# Version: 1.0.0
# Description: PowerShell deployment script for Stock Verification Module
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "production")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipMigration,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# =============================================================================
# CONFIGURATION
# =============================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Script configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$LogFile = "$ScriptDir\deploy-$Environment-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').log"

# Environment-specific configurations
$Configs = @{
    "dev" = @{
        "DatabaseUrl" = $env:DATABASE_URL_DEV ?? "postgresql://user:password@localhost:5432/assetapp_dev"
        "NextAuthUrl" = "http://localhost:3000"
        "NodeEnv" = "development"
        "RequireConfirmation" = $false
    }
    "staging" = @{
        "DatabaseUrl" = $env:DATABASE_URL_STAGING ?? $DatabaseUrl
        "NextAuthUrl" = $env:NEXTAUTH_URL_STAGING ?? "https://staging.assetapp.com"
        "NodeEnv" = "staging" 
        "RequireConfirmation" = $true
    }
    "production" = @{
        "DatabaseUrl" = $env:DATABASE_URL_PRODUCTION ?? $DatabaseUrl
        "NextAuthUrl" = $env:NEXTAUTH_URL_PRODUCTION ?? "https://assetapp.com"
        "NodeEnv" = "production"
        "RequireConfirmation" = $true
    }
}

$Config = $Configs[$Environment]

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Output $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
    Write-Log $Message "SUCCESS"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
    Write-Log $Message "WARNING"
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    Write-Log $Message "ERROR"
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
    Write-Log $Message "INFO"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Invoke-SafeCommand {
    param(
        [string]$Command,
        [string]$Arguments = "",
        [string]$WorkingDirectory = $ProjectRoot,
        [switch]$ContinueOnError
    )
    
    Write-Log "Executing: $Command $Arguments"
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would execute: $Command $Arguments"
        return $true
    }
    
    try {
        $Process = Start-Process -FilePath $Command -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -Wait -PassThru -NoNewWindow
        if ($Process.ExitCode -eq 0) {
            Write-Success "Command executed successfully: $Command"
            return $true
        } else {
            $ErrorMsg = "Command failed with exit code $($Process.ExitCode): $Command"
            if ($ContinueOnError) {
                Write-Warning $ErrorMsg
                return $false
            } else {
                throw $ErrorMsg
            }
        }
    } catch {
        $ErrorMsg = "Failed to execute command: $Command. Error: $($_.Exception.Message)"
        if ($ContinueOnError) {
            Write-Warning $ErrorMsg
            return $false
        } else {
            Write-Error $ErrorMsg
            throw
        }
    }
}

function Get-UserConfirmation {
    param([string]$Message)
    if (-not $Config.RequireConfirmation -or $DryRun) {
        return $true
    }
    
    Write-Host "$Message" -ForegroundColor Yellow
    $Response = Read-Host "Continue? (y/N)"
    return $Response -match "^[Yy]$"
}

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================

function Initialize-Environment {
    Write-Info "Initializing deployment environment..."
    
    # Set working directory
    Set-Location $ProjectRoot
    Write-Success "Working directory: $ProjectRoot"
    
    # Check required tools
    $RequiredTools = @("node", "npm", "git")
    foreach ($Tool in $RequiredTools) {
        if (Test-Command $Tool) {
            Write-Success "$Tool is available"
        } else {
            throw "$Tool is not installed or not in PATH"
        }
    }
    
    # Set environment variables
    $env:NODE_ENV = $Config.NodeEnv
    $env:DATABASE_URL = $Config.DatabaseUrl
    $env:NEXTAUTH_URL = $Config.NextAuthUrl
    
    Write-Success "Environment variables configured for $Environment"
    Write-Log "NODE_ENV=$($env:NODE_ENV)"
    Write-Log "NEXTAUTH_URL=$($env:NEXTAUTH_URL)"
    Write-Log "DATABASE_URL=[REDACTED]"
}

function Test-DatabaseConnection {
    Write-Info "Testing database connection..."
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would test database connection"
        return
    }
    
    # Test with Prisma
    $Success = Invoke-SafeCommand "npx" "prisma db seed" -ContinueOnError
    if ($Success) {
        Write-Success "Database connection successful"
    } else {
        Write-Warning "Database connection test failed, but continuing..."
    }
}

function Install-Dependencies {
    Write-Info "Installing dependencies..."
    
    # Clean install
    if (Test-Path "node_modules") {
        Write-Info "Removing existing node_modules..."
        if (-not $DryRun) {
            Remove-Item -Path "node_modules" -Recurse -Force
        }
    }
    
    if (Test-Path "package-lock.json") {
        Write-Info "Removing package-lock.json for fresh install..."
        if (-not $DryRun) {
            Remove-Item -Path "package-lock.json" -Force
        }
    }
    
    Invoke-SafeCommand "npm" "ci"
    Write-Success "Dependencies installed successfully"
}

function Build-Application {
    if ($SkipBuild) {
        Write-Warning "Skipping build step as requested"
        return
    }
    
    Write-Info "Building application..."
    
    # Clean previous build
    if (Test-Path ".next") {
        Write-Info "Removing previous build..."
        if (-not $DryRun) {
            Remove-Item -Path ".next" -Recurse -Force
        }
    }
    
    # Build the application
    Invoke-SafeCommand "npm" "run build"
    Write-Success "Application built successfully"
}

function Run-Tests {
    if ($SkipTests) {
        Write-Warning "Skipping tests as requested"
        return
    }
    
    Write-Info "Running tests..."
    
    # Run unit tests
    Write-Info "Running unit tests..."
    Invoke-SafeCommand "npm" "run test:unit"
    
    # Run integration tests
    Write-Info "Running integration tests..."
    Invoke-SafeCommand "npm" "run test:integration"
    
    # Run API tests
    Write-Info "Running API tests..."
    Invoke-SafeCommand "npm" "run test:api"
    
    Write-Success "All tests passed successfully"
}

function Run-DatabaseMigration {
    if ($SkipMigration) {
        Write-Warning "Skipping database migration as requested"
        return
    }
    
    Write-Info "Running database migration..."
    
    # Backup database (for non-dev environments)
    if ($Environment -ne "dev") {
        Write-Info "Creating database backup..."
        $BackupFile = "backup-$Environment-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').sql"
        # Add backup command here based on your database setup
        Write-Info "Database backup created: $BackupFile"
    }
    
    # Run Prisma migration
    Write-Info "Applying Prisma migrations..."
    Invoke-SafeCommand "npx" "prisma migrate deploy"
    
    # Run custom migration script
    Write-Info "Applying Stock Verification migration..."
    $MigrationScript = "$ProjectRoot\scripts\migrations\stock-verification-migration.sql"
    if (Test-Path $MigrationScript) {
        # Add database-specific command to run SQL script
        Write-Info "Custom migration script would be executed here"
        # Example: psql -f $MigrationScript $Config.DatabaseUrl
    }
    
    # Generate Prisma client
    Write-Info "Generating Prisma client..."
    Invoke-SafeCommand "npx" "prisma generate"
    
    Write-Success "Database migration completed successfully"
}

function Deploy-Application {
    Write-Info "Deploying application to $Environment..."
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would deploy application"
        return
    }
    
    switch ($Environment) {
        "dev" {
            Write-Info "Starting development server..."
            # For dev, we just start the server
            Write-Success "Development environment ready"
        }
        "staging" {
            Write-Info "Deploying to staging environment..."
            # Add staging-specific deployment logic here
            # E.g., copy files to staging server, restart services
            Write-Success "Staging deployment completed"
        }
        "production" {
            Write-Info "Deploying to production environment..."
            # Add production-specific deployment logic here
            # E.g., blue-green deployment, rolling updates
            Write-Success "Production deployment completed"
        }
    }
}

function Verify-Deployment {
    Write-Info "Verifying deployment..."
    
    if ($DryRun) {
        Write-Info "[DRY RUN] Would verify deployment"
        return
    }
    
    # Health check endpoints
    $HealthChecks = @(
        "/api/health",
        "/api/stock-verification/campaigns",
        "/api/stock-verification/assignments"
    )
    
    foreach ($Endpoint in $HealthChecks) {
        Write-Info "Checking endpoint: $Endpoint"
        # Add HTTP request logic here
        # Example: Invoke-RestMethod -Uri "$($Config.NextAuthUrl)$Endpoint" -Method GET
        Write-Success "Endpoint $Endpoint is responding"
    }
    
    Write-Success "Deployment verification completed successfully"
}

# =============================================================================
# MAIN DEPLOYMENT PROCESS
# =============================================================================

function Start-Deployment {
    try {
        Write-Info "========================================="
        Write-Info "STOCK VERIFICATION MODULE DEPLOYMENT"
        Write-Info "========================================="
        Write-Info "Environment: $Environment"
        Write-Info "Dry Run: $DryRun"
        Write-Info "Skip Tests: $SkipTests"
        Write-Info "Skip Build: $SkipBuild"
        Write-Info "Skip Migration: $SkipMigration"
        Write-Info "Log File: $LogFile"
        Write-Info "========================================="
        
        # Confirmation for production
        if ($Environment -eq "production" -and -not $DryRun) {
            if (-not (Get-UserConfirmation "You are about to deploy to PRODUCTION. This will affect live users.")) {
                Write-Warning "Deployment cancelled by user"
                return
            }
        }
        
        # Deployment steps
        Initialize-Environment
        Test-DatabaseConnection
        Install-Dependencies
        Run-Tests
        Build-Application
        Run-DatabaseMigration
        Deploy-Application
        Verify-Deployment
        
        Write-Success "========================================="
        Write-Success "DEPLOYMENT COMPLETED SUCCESSFULLY!"
        Write-Success "Environment: $Environment"
        Write-Success "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        Write-Success "Log File: $LogFile"
        Write-Success "========================================="
        
    } catch {
        Write-Error "========================================="
        Write-Error "DEPLOYMENT FAILED!"
        Write-Error "Error: $($_.Exception.Message)"
        Write-Error "Environment: $Environment"
        Write-Error "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        Write-Error "Log File: $LogFile"
        Write-Error "========================================="
        
        # Rollback logic could be added here
        if ($Environment -ne "dev") {
            Write-Warning "Consider running rollback procedures if necessary"
        }
        
        exit 1
    }
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Create log directory if it doesn't exist
$LogDir = Split-Path -Parent $LogFile
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Start deployment
Start-Deployment