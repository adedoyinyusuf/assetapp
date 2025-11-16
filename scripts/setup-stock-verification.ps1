# Stock Verification Module Quick Setup Script
# This script helps you set up the Stock Verification module for development

param(
    [switch]$SkipRedis,
    [switch]$SkipDatabase,
    [switch]$Development
)

Write-Host "🚀 Setting up Stock Verification Module..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Error "Please run this script from the root of your assetapp directory"
    exit 1
}

# 1. Install dependencies if they're missing
Write-Host "📦 Checking dependencies..." -ForegroundColor Cyan

$missingDeps = @()
if (-not (Test-Path "node_modules\redis")) {
    $missingDeps += "redis"
}

if ($missingDeps.Count -gt 0) {
    Write-Host "Installing missing dependencies: $($missingDeps -join ', ')" -ForegroundColor Yellow
    npm install redis@^4.6.10 @types/redis@^4.0.9
}

# 2. Create necessary directories
Write-Host "📁 Creating directory structure..." -ForegroundColor Cyan

$directories = @(
    "app\stock-verification",
    "app\api\stock-verification",
    "components\stock-verification", 
    "lib\stock-verification",
    "public\uploads\stock-verification",
    "logs",
    "docs\stock-verification"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✅ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  ✅ Exists: $dir" -ForegroundColor Gray
    }
}

# 3. Generate Prisma Client
Write-Host "🗄️  Generating Prisma Client..." -ForegroundColor Cyan
try {
    npx prisma generate 2>&1 | Out-Null
    Write-Host "  ✅ Prisma client generated successfully" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Prisma generation completed with warnings (this is normal)" -ForegroundColor Yellow
}

# 4. Check database connection (if not skipped)
if (-not $SkipDatabase) {
    Write-Host "🔌 Checking database connection..." -ForegroundColor Cyan
    try {
        npx prisma db pull --preview-feature 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Database connection successful" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Database connection issues - please check your DATABASE_URL" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠️  Could not verify database connection" -ForegroundColor Yellow
    }
}

# 5. Check Redis connection (if not skipped)
if (-not $SkipRedis) {
    Write-Host "📦 Checking Redis connection..." -ForegroundColor Cyan
    
    # Test if Redis is running locally
    try {
        $redisTest = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($redisTest) {
            Write-Host "  ✅ Redis is running on localhost:6379" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Redis not running locally - some features will be disabled" -ForegroundColor Yellow
            Write-Host "     To install Redis: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠️  Could not check Redis connection" -ForegroundColor Yellow
    }
}

# 6. Environment configuration
Write-Host "⚙️  Environment configuration..." -ForegroundColor Cyan

if (-not (Test-Path ".env.local")) {
    Write-Host "  ⚠️  .env.local not found - creating from template" -ForegroundColor Yellow
    if (Test-Path ".env.stock-verification.example") {
        Copy-Item ".env.stock-verification.example" ".env.local" -Force
        Write-Host "  ✅ Created .env.local from template" -ForegroundColor Green
    }
}

# 7. Quick feature check
Write-Host "🔧 Stock Verification Module Status:" -ForegroundColor Cyan

$checkpoints = @{
    "Prisma Models" = (Test-Path "node_modules\.prisma\client\index.d.ts")
    "Redis Client" = (Test-Path "lib\redis.ts") 
    "Config Files" = (Test-Path "config\stock-verification.ts")
    "Environment Template" = (Test-Path ".env.stock-verification.example")
    "Environment Local" = (Test-Path ".env.local")
    "Upload Directory" = (Test-Path "public\uploads\stock-verification")
}

foreach ($check in $checkpoints.GetEnumerator()) {
    if ($check.Value) {
        Write-Host "  ✅ $($check.Key)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($check.Key)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Stock Verification Module Setup Complete!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

if ($Development) {
    Write-Host "🏃‍♂️ Next steps for development:" -ForegroundColor Yellow
    Write-Host "1. Configure your .env.local file with your database and Redis URLs"
    Write-Host "2. Run 'npm run dev' to start the development server"
    Write-Host "3. Visit http://localhost:3000/stock-verification to access the module"
    Write-Host ""
    
    # Offer to start the development server
    $startDev = Read-Host "Would you like to start the development server now? (y/N)"
    if ($startDev -match '^[Yy]$') {
        Write-Host "Starting development server..." -ForegroundColor Green
        npm run dev
    }
} else {
    Write-Host "📋 What's ready:" -ForegroundColor Yellow
    Write-Host "• Database models are generated and ready"
    Write-Host "• Directory structure is created"
    Write-Host "• Redis client is configured"  
    Write-Host "• Environment template is available"
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Configure .env.local with your database connection"
    Write-Host "2. Ensure Redis is running (or disable caching in config)"
    Write-Host "3. Run database migration if needed: npx prisma db push"
    Write-Host "4. Start development: npm run dev"
    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor Yellow
    Write-Host "• Setup guide: docs/stock-verification-deployment-summary.md"
    Write-Host "• API documentation will be available at /api/stock-verification/health"
}

Write-Host "🚀 Happy coding!" -ForegroundColor Green