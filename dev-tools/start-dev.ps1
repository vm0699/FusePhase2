# start-dev.ps1 — One-command Fuse dev launcher for Android
#
# Usage:
#   .\dev-tools\start-dev.ps1                    # emulator (Pixel_6_API_31)
#   .\dev-tools\start-dev.ps1 -Device            # physical device via USB
#   .\dev-tools\start-dev.ps1 -AVD Pixel_6_API_31_2

param(
  [switch]$Device,
  [string]$AVD = "Pixel_6_API_31"
)

$ROOT     = Split-Path $PSScriptRoot -Parent
$BACKEND  = Join-Path $ROOT "FUSE - BE"
$FRONTEND = Join-Path $ROOT "fuse"
$ADB      = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$EMULATOR = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
$PROXY_JS = Join-Path $PSScriptRoot "bundle-proxy.js"
$PACKAGE  = "com.swayvick.newfusefe"

function Log($msg)  { Write-Host "[..] $msg" -ForegroundColor Cyan }
function OK($msg)   { Write-Host "[OK] $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "[!!] $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "[XX] $msg" -ForegroundColor Red; exit 1 }

# ── 1. Emulator / device ───────────────────────────────────────────────────────
if (-not $Device) {
    $connected = (& $ADB devices 2>&1) | Where-Object { $_ -match "emulator.*device$" }
    if (-not $connected) {
        Log "Starting emulator: $AVD"
        # Kill any stale offline emulators first
        Get-Process -Name "qemu-system*","emulator*" -ErrorAction SilentlyContinue | Stop-Process -Force
        & $ADB kill-server | Out-Null
        Start-Sleep -Seconds 2
        & $ADB start-server | Out-Null
        Start-Process -FilePath $EMULATOR -ArgumentList "-avd", $AVD -WindowStyle Normal
        Log "Waiting for emulator to come online (up to 120s)..."
        $waited = 0
        do {
            Start-Sleep -Seconds 5; $waited += 5
            $lines = (& $ADB devices 2>&1) | ForEach-Object { "$_" }
            $online = $lines | Where-Object { $_ -match "emulator.*device$" }
        } while (-not $online -and $waited -lt 120)
        if (-not $online) { Fail "Emulator did not come online in time" }
        # Root for SharedPreferences access
        & $ADB root 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        Log "Waiting for Android boot to complete..."
        $waited = 0
        do {
            Start-Sleep -Seconds 4; $waited += 4
            $boot = (& $ADB shell getprop sys.boot_completed 2>&1 | Select-Object -Last 1)
            $boot = "$boot".Trim()
        } while ($boot -ne "1" -and $waited -lt 90)
        if ($boot -ne "1") { Fail "Android did not fully boot in time" }
        OK "Emulator booted"
    } else {
        OK "Emulator already running"
        & $ADB root 2>&1 | Out-Null
        Start-Sleep -Seconds 2
    }
} else {
    $connected = (& $ADB devices 2>&1) | Where-Object { $_ -match "^\S+\s+device$" -and $_ -notmatch "emulator" }
    if (-not $connected) { Fail "No physical device found. Connect via USB and enable USB debugging." }
    OK "Physical device connected"
}

# ── 2. Backend ─────────────────────────────────────────────────────────────────
$backendUp = netstat -ano | findstr ":5000 " | findstr "LISTENING"
if (-not $backendUp) {
    Log "Starting backend..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$BACKEND`" && npm start" -WindowStyle Normal
    Start-Sleep -Seconds 4
    OK "Backend started"
} else {
    OK "Backend already running on :5000"
}

# ── 3. Metro ───────────────────────────────────────────────────────────────────
$metroUp = netstat -ano | findstr ":8081 " | findstr "LISTENING"
if (-not $metroUp) {
    Log "Starting Metro..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$FRONTEND`" && npx expo start --port 8081" -WindowStyle Normal
    Log "Waiting for Metro (up to 60s)..."
    $waited = 0; $ready = $false
    do {
        Start-Sleep -Seconds 3; $waited += 3
        try { Invoke-WebRequest "http://localhost:8081/status" -TimeoutSec 2 -EA Stop | Out-Null; $ready = $true } catch {}
    } while (-not $ready -and $waited -lt 60)
    if ($ready) { OK "Metro ready" } else { Warn "Metro slow to start - proxy will wait for it" }
} else {
    OK "Metro already running on :8081"
}

# ── 4. Bundle proxy ────────────────────────────────────────────────────────────
$proxyUp = netstat -ano | findstr ":8082 " | findstr "LISTENING"
if (-not $proxyUp) {
    Log "Starting bundle proxy (pre-downloads ~18 MB bundle, ~30s wait)..."
    Start-Process -FilePath "node" -ArgumentList $PROXY_JS -WindowStyle Normal
    $waited = 0; $ready = $false
    do {
        Start-Sleep -Seconds 5; $waited += 5
        Write-Host "  [$waited s] waiting for proxy..."
        try { Invoke-WebRequest "http://localhost:8082/status" -TimeoutSec 2 -EA Stop | Out-Null; $ready = $true } catch {}
    } while (-not $ready -and $waited -lt 120)
    if ($ready) { OK "Bundle proxy ready on :8082" } else { Warn "Proxy may still be warming up" }
} else {
    OK "Bundle proxy already running on :8082"
}

# ── 5. ADB reverse tunnels ─────────────────────────────────────────────────────
& $ADB reverse tcp:5000 tcp:5000 | Out-Null
& $ADB reverse tcp:8081 tcp:8081 | Out-Null
& $ADB reverse tcp:8082 tcp:8082 | Out-Null
OK "ADB reverse tunnels: :5000 (backend) :8081 (metro) :8082 (proxy) active"

# ── 5b. Tunnel watchdog — re-asserts tunnels every 5s so they survive USB/emulator reconnects ──
$WATCHDOG   = Join-Path $PSScriptRoot "tunnel-watchdog.ps1"
$pidFile    = Join-Path $PSScriptRoot ".tunnel-watchdog.pid"
$watchdogUp = $false
if (Test-Path $pidFile) {
    $oldPid = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($oldPid -and (Get-Process -Id $oldPid -ErrorAction SilentlyContinue)) { $watchdogUp = $true }
}
if (-not $watchdogUp) {
    $wd = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$WATCHDOG`"", "-AdbPath", "`"$ADB`"" -WindowStyle Minimized -PassThru
    Set-Content -Path $pidFile -Value $wd.Id
    OK "Tunnel watchdog started (auto-heals tunnels on reconnect)"
} else {
    OK "Tunnel watchdog already running"
}

# ── 6. SharedPreferences: route bundle through proxy ──────────────────────────
$prefsDir  = "/data/data/$PACKAGE/shared_prefs"
$prefsFile = "$prefsDir/${PACKAGE}_preferences.xml"
$prefsXml  = "<?xml version='1.0' encoding='utf-8' standalone='yes' ?><map><string name=`"debug_http_host`">localhost:8082</string></map>"
& $ADB shell "mkdir -p $prefsDir && echo '$prefsXml' > $prefsFile" | Out-Null
OK "App configured to use bundle proxy"

# ── 7. Launch app ──────────────────────────────────────────────────────────────
Log "Launching Fuse..."
& $ADB shell am force-stop $PACKAGE | Out-Null
Start-Sleep -Seconds 2
& $ADB shell am start -n "$PACKAGE/.MainActivity" | Out-Null

Write-Host ""
OK "Fuse is running!"
Write-Host ""
Write-Host "  Backend  : http://localhost:5000" -ForegroundColor White
Write-Host "  Metro    : http://localhost:8081" -ForegroundColor White
Write-Host "  Proxy    : http://localhost:8082 (bundle served instantly)" -ForegroundColor White
Write-Host ""
Write-Host "  Next run : .\dev-tools\start-dev.ps1  (already-running services are skipped)" -ForegroundColor Gray
Write-Host "  Logs     : adb logcat -s ReactNativeJS:*" -ForegroundColor Gray
Write-Host ""
