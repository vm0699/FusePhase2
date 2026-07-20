# tunnel-watchdog.ps1 — keeps ADB reverse tunnels alive permanently.
#
# adb reverse tunnels are tied to the USB session and silently drop on
# cable replug, device sleep, or adb server restart. Metro's port (8081)
# gets re-asserted automatically by the Expo/RN CLI when it detects a
# device, but nothing does that for the backend port (5000) or bundle
# proxy (8082) — so they rot silently and "Network request failed"
# comes back with no obvious cause.
#
# This script re-asserts all three tunnels every 5s for as long as it runs.
# Started automatically by start-dev.ps1. Close this window to stop it.

param(
  [string]$AdbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
)

Write-Host "[watchdog] Keeping ADB reverse tunnels alive: :5000 (backend) :8081 (metro) :8082 (proxy)" -ForegroundColor DarkGray
Write-Host "[watchdog] Close this window to stop." -ForegroundColor DarkGray

while ($true) {
    & $AdbPath reverse tcp:5000 tcp:5000 2>$null | Out-Null
    & $AdbPath reverse tcp:8081 tcp:8081 2>$null | Out-Null
    & $AdbPath reverse tcp:8082 tcp:8082 2>$null | Out-Null
    Start-Sleep -Seconds 5
}
