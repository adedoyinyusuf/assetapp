$file = "app\api\stock-verification\health\route.ts"
$content = Get-Content $file -Raw

# Replace config references with safe defaults
$content = $content -replace 'stockVerificationConfig\.performance\.caching\.enabled', 'false'
$content = $content -replace 'stockVerificationConfig\.features', '{photoUpload:false,autoAssignment:false,advancedReporting:false,realTimeNotifications:false,bulkOperations:false,mobileApp:false,offlineMode:false,aiAssistedVerification:false}'
$content = $content -replace 'stockVerificationConfig\.integrations\.storage\.provider', "'local'"
$content = $content -replace 'stockVerificationConfig\.integrations\.storage\.bucket', "'default'"
$content = $content -replace 'stockVerificationConfig\s*\?', 'true ?'

$content | Set-Content $file -NoNewline
Write-Host "✅ Replaced all stockVerificationConfig references with safe defaults"
