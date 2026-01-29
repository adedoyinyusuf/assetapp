$apiRoutes = Get-ChildItem -Path "c:\Apps\assetapp\app\api" -Filter "route.ts" -Recurse

$addedCount = 0
$skippedCount = 0

foreach ($route in $apiRoutes) {
    $content = Get-Content $route.FullName -Raw
    
    # Check if it already has the dynamic export
    if ($content -match "export const dynamic") {
        Write-Host "⏭️  Skipped (already has dynamic): $($route.FullName.Replace('c:\Apps\assetapp\', ''))"
        $skippedCount++
        continue
    }
    
    # Find the last import line
    $lines = Get-Content $route.FullName
    $lastImportIndex = -1
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^import ") {
            $lastImportIndex = $i
        }
    }
    
    if ($lastImportIndex -ge 0) {
        # Insert after last import
        $newLines = @()
        $newLines += $lines[0..$lastImportIndex]
        $newLines += ""
        $newLines += "export const dynamic = 'force-dynamic';"
        $newLines += ""
        if ($lastImportIndex + 1 -lt $lines.Count) {
            $newLines += $lines[($lastImportIndex + 1)..($lines.Count - 1)]
        }
        
        $newLines | Set-Content $route.FullName
        Write-Host "✅ Added dynamic export: $($route.FullName.Replace('c:\Apps\assetapp\', ''))"
        $addedCount++
    }
    else {
        Write-Host "⚠️  No imports found: $($route.FullName.Replace('c:\Apps\assetapp\', ''))"
    }
}

Write-Host "`n📊 Summary:"
Write-Host "   ✅ Added: $addedCount"
Write-Host "   ⏭️  Skipped: $skippedCount"
Write-Host "   📁 Total: $($apiRoutes.Count)"
