# Script to download flag images
$flags = @(
    "us", "germany", "uk", "france", "italy", "spain", "netherlands", 
    "sweden", "norway", "denmark", "finland", "poland", "canada", 
    "brazil", "mexico", "argentina", "australia", "newzealand", 
    "japan", "southkorea", "india", "china", "singapore", 
    "switzerland", "austria", "belgium", "portugal", "greece", 
    "turkey", "uae", "saudi"
)

$baseUrl = "https://flagcdn.com/w160"

foreach ($flag in $flags) {
    $url = "$baseUrl/$flag.png"
    $output = "public/flags/$flag.png"
    
    Write-Host "Downloading $flag..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
        Write-Host "✓ Downloaded $flag.png"
    } catch {
        Write-Host "✗ Failed to download $flag.png - $_"
    }
}

Write-Host "`nAll flags downloaded!"
