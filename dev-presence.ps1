param([switch]$SkipNgrok)

$Backend = "C:\projects\employee-presence\backend"
$Ngrok = "C:\Users\MOUHAMED GUEYE\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"
$Port = 8002

Write-Host "=== Employee Presence ($Port) ===" -ForegroundColor Cyan

# Kill only PHP on our port (leave other projects untouched)
$conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($conn) { 
    $p = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    if ($p -and $p.ProcessName -eq "php") { Stop-Process -Id $p.Id -Force }
}

# Kill ngrok API if running (only one ngrok instance at a time)
$ngrokApi = Get-NetTCPConnection -LocalPort 4040 -ErrorAction SilentlyContinue
if ($ngrokApi) { Stop-Process -Id $ngrokApi.OwningProcess -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 2

# Start Laravel
Write-Host "Starting Laravel on :$Port ..." -ForegroundColor Yellow
$php = Start-Process -NoNewWindow -FilePath "php" -ArgumentList "artisan serve --host=127.0.0.1 --port=$Port" -WorkingDirectory $Backend -PassThru

Start-Sleep -Seconds 2

if (-not $SkipNgrok) {
    Write-Host "Starting ngrok..." -ForegroundColor Yellow
    $ng = Start-Process -NoNewWindow -FilePath $Ngrok -ArgumentList "http $Port --log=stdout" -PassThru
    Start-Sleep -Seconds 4

    # Get URL
    try {
        $api = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
        $url = $api.tunnels[0].public_url
        Write-Host "URL: $url" -ForegroundColor Green
    } catch {
        Write-Host "ngrok started, check URL at http://127.0.0.1:4040" -ForegroundColor Yellow
    }
}

Write-Host "Done. Press any key to stop all..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Stop-Process -Id $php.Id -Force -ErrorAction SilentlyContinue
if ($ng) { Stop-Process -Id $ng.Id -Force -ErrorAction SilentlyContinue }
