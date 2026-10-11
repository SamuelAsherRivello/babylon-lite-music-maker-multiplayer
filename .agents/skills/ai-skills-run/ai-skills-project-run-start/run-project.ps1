[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $ProjectRoot,
  [Parameter(Mandatory)] [int] $Port,
  [Parameter(Mandatory)] [string] $RoutesJson,
  [switch] $DisableHmr,
  [int] $PortCount = 20,
  [int] $StartupTimeoutSeconds = 15
)

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($ProjectRoot).TrimEnd('\')
$routes = $RoutesJson | ConvertFrom-Json

function Get-OwnedProcesses {
  Get-CimInstance Win32_Process -ErrorAction Stop | Where-Object {
    $_.Name -in @('node.exe','npm.exe','cmd.exe') -and $_.CommandLine -and
    $_.CommandLine -like "*$root*"
  }
}
function Get-LogText([string] $path) {
  if (-not (Test-Path -LiteralPath $path)) { return '' }
  $text = Get-Content -Raw -LiteralPath $path -ErrorAction SilentlyContinue
  if ($null -eq $text) { return '' }
  return $text.Trim()
}

$canInspectProcesses = $true
try { $owned = @(Get-OwnedProcesses) } catch { $canInspectProcesses = $false; $owned = @() }
if ($canInspectProcesses) {
  foreach ($process in $owned) { & taskkill.exe /PID $process.ProcessId /T /F | Out-Null }
}

$candidate = $Port
$reuse = $false
do {
  $listener = @(Get-NetTCPConnection -LocalPort $candidate -State Listen -ErrorAction SilentlyContinue)
  if (-not $listener) { break }
  if (-not $canInspectProcesses) {
    $reuse = $true
    foreach ($route in $routes) {
      try { Invoke-WebRequest "http://127.0.0.1:$candidate$($route.route)" -UseBasicParsing -TimeoutSec 1 | Out-Null }
      catch { $reuse = $false; break }
    }
    if ($reuse) { break }
  }
  $candidate++
  Start-Sleep -Milliseconds 25
} while ($candidate -lt ($Port + $PortCount))
if ($listener -and $candidate -ge ($Port + $PortCount)) { throw "No free project port found from $Port through $($Port + $PortCount - 1)." }

if (-not $reuse) {
  # Use strictPort so Vite cannot silently move to a different port than the
  # one selected by this helper. This also works when listener inspection is
  # restricted but the port is occupied by another process.
  $launchSucceeded = $false
  while ($candidate -lt ($Port + $PortCount)) {
    $logPath = Join-Path ([IO.Path]::GetTempPath()) ("codex-vite-" + [guid]::NewGuid().ToString('N') + '.log')
    $hmrArgument = if ($DisableHmr) { ' --no-hmr' } else { '' }
    $child = Start-Process cmd.exe -ArgumentList "/d /c cd /d `"$root`" && npm run dev -- --host 127.0.0.1 --port $candidate --strictPort$hmrArgument > `"$logPath`" 2>&1" -WorkingDirectory $root -WindowStyle Hidden -PassThru
    $startupDeadline = [DateTime]::UtcNow.AddSeconds($StartupTimeoutSeconds)
    do {
      $listener = @(Get-NetTCPConnection -LocalPort $candidate -State Listen -ErrorAction SilentlyContinue)
      $diagnostics = Get-LogText $logPath
      if ($listener -or $diagnostics -match 'Local:\s+http://127\.0\.0\.1:' -or $diagnostics -match 'ready in') { $launchSucceeded = $true; break }
      if ($child.HasExited) { break }
      Start-Sleep -Milliseconds 50
    } while ([DateTime]::UtcNow -lt $startupDeadline)
    if ($launchSucceeded) { break }
    if (-not $child.HasExited) { & taskkill.exe /PID $child.ProcessId /T /F | Out-Null }
    $diagnostics = Get-LogText $logPath
    if ($diagnostics -match 'Port .* is in use|EADDRINUSE|strictPort') { $candidate++; continue }
    throw "Vite launcher failed on $candidate with code $($child.ExitCode). $diagnostics"
  }
  if (-not $launchSucceeded) { throw "No available project port found from $Port through $($Port + $PortCount - 1)." }
}

$checks = foreach ($route in $routes) {
  $response = Invoke-WebRequest "http://127.0.0.1:$candidate$($route.route)" -UseBasicParsing -TimeoutSec 1
  $title = if ($response.Content -match '<title[^>]*>\s*([^<]+?)\s*</title>') { $matches[1].Trim() } else { '' }
  [pscustomobject]@{ Label=$route.label; Route=$route.route; Status=$response.StatusCode; Title=$title; Url="http://127.0.0.1:$candidate$($route.route)" }
}
if (@($checks | Where-Object Status -ne 200).Count) { throw 'One or more routes did not return HTTP 200.' }
$checks | ConvertTo-Json -Compress
