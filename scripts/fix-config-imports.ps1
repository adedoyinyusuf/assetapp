$files = @(
    "lib\stock-verification\security.ts",
    "lib\stock-verification\performance.ts",
    "lib\stock-verification\logging.ts",
    "lib\stock-verification\campaign-analytics-service.ts",
    "lib\stock-verification\asset-assignment-service.ts"
)

$oldImport = "@/config/stock-verification"
$newImport = "@/lib/config/stock-verification"

$fixedCount = 0

foreach ($file in $files) {
    $fullPath = "c:\Apps\assetapp\$file"
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        if ($content -match [regex]::Escape($oldImport)) {
            $newContent = $content -replace [regex]::Escape($oldImport), $newImport
            $newContent | Set-Content $fullPath -NoNewline
            Write-Host "✅ Fixed: $file"
            $fixedCount++
        }
        else {
            Write-Host "⏭️  Already correct: $file"
        }
    }
    else {
        Write-Host "⚠️  Not found: $file"
    }
}

Write-Host "`n✨ Fixed $fixedCount file(s)"
