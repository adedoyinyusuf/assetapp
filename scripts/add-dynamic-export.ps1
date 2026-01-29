$files = @(
    'app\maintenance\page.tsx',
    'app\maintenance\requests\new\page.tsx',
    'app\procurement\page.tsx',
    'app\procurement\purchase-orders\page.tsx',
    'app\operations\depreciation\page.tsx',
    'app\operations\disposal\page.tsx',
    'app\reports\overview\page.tsx'
)

foreach ($file in $files) {
    $path = Join-Path 'c:\Apps\assetapp' $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        if ($content -notmatch "export const dynamic") {
            # Find first import line and add after imports
            $lines = Get-Content $path
            $lastImportIndex = 0
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match "^import ") {
                    $lastImportIndex = $i
                }
            }
            # Insert after last import
            $newLines = @()
            $newLines += $lines[0..$lastImportIndex]
            $newLines += ""
            $newLines += "export const dynamic = 'force-dynamic';"
            $newLines += $lines[($lastImportIndex + 1)..($lines.Count - 1)]
            $newLines | Set-Content $path
            Write-Host "✅ Updated $file"
        } else {
            Write-Host "⏭️  Skipped $file (already has dynamic export)"
        }
    } else {
        Write-Host "❌ Not found: $file"
    }
}

Write-Host "`n✨ Done!"
