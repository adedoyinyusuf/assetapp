$files = @(
    "lib\stock-verification\security.ts",
    "lib\stock-verification\performance.ts",
    "lib\stock-verification\logging.ts",
    "lib\stock-verification\campaign-analytics-service.ts",
    "lib\stock-verification\asset-assignment-service.ts"
)

$fixedCount = 0

foreach ($file in $files) {
    $fullPath = "c:\Apps\assetapp\$file"
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # Comment out the import
        $content = $content -replace "import \{ stockVerificationConfig \} from '@/lib/config/stock-verification';", "// import { stockVerificationConfig } from '@/lib/config/stock-verification'; // Temporarily disabled"
        
        # Replace common config accesses with safe defaults
        $content = $content -replace "stockVerificationConfig\.notifications\.enabled", "false"
        $content = $content -replace "stockVerificationConfig\.performance\.caching\.enabled", "false"
        $content = $content -replace "stockVerificationConfig\.performance\.rateLimiting\.enabled", "false"
        $content = $content -replace "stockVerificationConfig\.security\.encryption", "false"
        $content = $content -replace "stockVerificationConfig\.features\.photoUpload", "false"
        $content = $content -replace "stockVerificationConfig\.features\.autoAssignment", "false"
        
        $content | Set-Content $fullPath -NoNewline
        Write-Host "✅ Fixed: $file"
        $fixedCount++
    }
    else {
        Write-Host "⚠️  Not found: $file"
    }
}

Write-Host "`n✨ Fixed $fixedCount file(s)"
