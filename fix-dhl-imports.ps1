Write-Host "Removing all DHL references..." -ForegroundColor Yellow

# Files to check
$files = @(
    "components/Checkout.tsx",
    "components/SellList.tsx", 
    "app/checkout/page.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Checking $file..." -ForegroundColor Cyan
        
        # Read content
        $content = Get-Content $file -Raw
        
        # Remove import statements
        $content = $content -replace "import\s+DHLShippingLabel\s+from\s+['\"].*DHLShippingLabel['\"];?\s*\r?\n", ""
        
        # Remove component usage
        $content = $content -replace "<DHLShippingLabel\s*/>", ""
        
        # Save
        $content | Set-Content $file -NoNewline
        
        Write-Host "✓ Fixed $file" -ForegroundColor Green
    }
}

Write-Host "`nDone! Run 'npm run build' to test." -ForegroundColor Green