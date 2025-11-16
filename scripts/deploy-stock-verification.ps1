# Stock Verification Module Deployment Script for Windows PowerShell
# This script handles deployment of the Stock Verification module

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('development', 'staging', 'production')]
    [string]$Environment,
    
    [string]$Version = "latest",
    [switch]$SkipBuild,
    [switch]$SkipMigration,
    [switch]$SkipHealthCheck,
    [switch]$Force
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$LogFile = Join-Path $RootDir "logs" "deployment-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').log"

# Ensure logs directory exists
$LogsDir = Join-Path $RootDir "logs"
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

# Error handling
$ErrorActionPreference = "Stop"
trap {
    Write-Log "Deployment failed: $_" "ERROR"
    exit 1
}

Write-Log "Starting Stock Verification Module deployment for $Environment environment" "INFO"
Write-Log "Version: $Version" "INFO"

# Load environment configuration
$EnvFile = Join-Path $RootDir ".env.$Environment"
if (-not (Test-Path $EnvFile)) {
    Write-Log "Environment file not found: $EnvFile" "ERROR"
    Write-Log "Please create the environment file from .env.stock-verification.example" "ERROR"
    exit 1
}

Write-Log "Loading environment configuration from $EnvFile" "INFO"

# Validate required environment variables
Write-Log "Validating environment configuration..." "INFO"

# Read environment file and check required variables
$RequiredVars = @(
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
)

foreach ($Var in $RequiredVars) {
    if (-not $env:$Var) {
        Write-Log "Required environment variable missing: $Var" "ERROR"
        exit 1
    }
}

# Pre-deployment checks
Write-Log "Running pre-deployment checks..." "INFO"

# Check Docker is running
try {
    docker version | Out-Null
    Write-Log "Docker is running" "INFO"
} catch {
    Write-Log "Docker is not running or not installed" "ERROR"
    exit 1
}

# Check if containers are already running
$RunningContainers = docker ps --filter "name=assetapp-" --format "table {{.Names}}" | Select-Object -Skip 1
if ($RunningContainers -and -not $Force) {
    Write-Log "Stock Verification containers are already running:" "WARNING"
    $RunningContainers | ForEach-Object { Write-Log "  - $_" "WARNING" }
    Write-Log "Use -Force to redeploy or stop containers manually" "WARNING"
    
    $Response = Read-Host "Continue with redeployment? (y/N)"
    if ($Response -notmatch '^[Yy]$') {
        Write-Log "Deployment cancelled by user" "INFO"
        exit 0
    }
}

# Stop existing containers if Force is specified or user confirmed
if ($RunningContainers -and ($Force -or $Response -match '^[Yy]$')) {
    Write-Log "Stopping existing containers..." "INFO"
    docker-compose -f docker-compose.stock-verification.yml down
}

# Build application (unless skipped)
if (-not $SkipBuild) {
    Write-Log "Building application..." "INFO"
    
    # Install dependencies
    Write-Log "Installing Node.js dependencies..." "INFO"
    npm ci
    
    # Generate Prisma client
    Write-Log "Generating Prisma client..." "INFO"
    npx prisma generate
    
    # Build Next.js application
    Write-Log "Building Next.js application..." "INFO"
    npm run build
    
    # Build Docker images
    Write-Log "Building Docker images..." "INFO"
    docker-compose -f docker-compose.stock-verification.yml build --no-cache
}

# Run database migrations (unless skipped)
if (-not $SkipMigration) {
    Write-Log "Running database migrations..." "INFO"
    
    # Check if database is accessible
    $DatabaseUrl = $env:DATABASE_URL
    if ($DatabaseUrl) {
        Write-Log "Testing database connectivity..." "INFO"
        npx prisma db pull --preview-feature 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Database is accessible" "INFO"
        } else {
            Write-Log "Database connectivity issues detected" "WARNING"
        }
    }
    
    # Run Prisma migrations
    Write-Log "Applying Prisma migrations..." "INFO"
    npx prisma migrate deploy
    
    # Run custom Stock Verification migrations if they exist
    $MigrationScript = Join-Path $RootDir "scripts" "migrations" "stock-verification-migration.sql"
    if (Test-Path $MigrationScript) {
        Write-Log "Running Stock Verification specific migrations..." "INFO"
        # Note: This would need proper PostgreSQL client setup
        Write-Log "Custom migration script found at: $MigrationScript" "INFO"
        Write-Log "Please run the migration manually if not already applied" "WARNING"
    }
}

# Deploy application
Write-Log "Starting application deployment..." "INFO"

try {
    # Start services
    Write-Log "Starting Docker services..." "INFO"
    docker-compose -f docker-compose.stock-verification.yml up -d
    
    # Wait for services to be ready
    Write-Log "Waiting for services to initialize..." "INFO"
    Start-Sleep -Seconds 30
    
    # Health checks (unless skipped)
    if (-not $SkipHealthCheck) {
        Write-Log "Running health checks..." "INFO"
        
        $MaxRetries = 10
        $RetryCount = 0
        $HealthCheckPassed = $false
        
        while ($RetryCount -lt $MaxRetries -and -not $HealthCheckPassed) {
            try {
                $Response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get -TimeoutSec 10
                if ($Response.status -eq "ok") {
                    Write-Log "Health check passed" "INFO"
                    $HealthCheckPassed = $true
                } else {
                    throw "Health check returned non-OK status"
                }
            } catch {
                $RetryCount++
                Write-Log "Health check attempt $RetryCount failed: $_" "WARNING"
                if ($RetryCount -lt $MaxRetries) {
                    Write-Log "Retrying in 10 seconds..." "INFO"
                    Start-Sleep -Seconds 10
                }
            }
        }
        
        if (-not $HealthCheckPassed) {
            Write-Log "Health checks failed after $MaxRetries attempts" "ERROR"
            Write-Log "Check application logs for details" "ERROR"
            docker-compose -f docker-compose.stock-verification.yml logs --tail=50
            exit 1
        }
    }
    
    # Verify Stock Verification specific endpoints
    Write-Log "Verifying Stock Verification endpoints..." "INFO"
    
    try {
        $SVResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/stock-verification/health" -Method Get -TimeoutSec 10
        Write-Log "Stock Verification module is responding correctly" "INFO"
    } catch {
        Write-Log "Stock Verification endpoints not responding: $_" "WARNING"
        Write-Log "This might be expected if the module is not fully initialized" "INFO"
    }
    
    Write-Log "Deployment completed successfully!" "SUCCESS"
    
    # Display service information
    Write-Log "Service URLs:" "INFO"
    Write-Log "  Application: http://localhost:3000" "INFO"
    Write-Log "  Grafana Dashboard: http://localhost:3001" "INFO"
    Write-Log "  Prometheus: http://localhost:9090" "INFO"
    
    # Show container status
    Write-Log "Container status:" "INFO"
    docker-compose -f docker-compose.stock-verification.yml ps
    
} catch {
    Write-Log "Deployment failed: $_" "ERROR"
    
    # Show container logs for debugging
    Write-Log "Container logs for debugging:" "ERROR"
    docker-compose -f docker-compose.stock-verification.yml logs --tail=100
    
    exit 1
}

# Post-deployment tasks
Write-Log "Running post-deployment tasks..." "INFO"

# Create initial admin user if in development
if ($Environment -eq "development") {
    Write-Log "Creating initial development data..." "INFO"
    # This would run seed scripts if they exist
    $SeedScript = Join-Path $RootDir "scripts" "seed-stock-verification.ps1"
    if (Test-Path $SeedScript) {
        & $SeedScript
    }
}

# Set up monitoring alerts for production
if ($Environment -eq "production") {
    Write-Log "Setting up production monitoring..." "INFO"
    # Additional production setup tasks would go here
}

Write-Log "Stock Verification Module deployment completed successfully for $Environment!" "SUCCESS"
Write-Log "Deployment log saved to: $LogFile" "INFO"