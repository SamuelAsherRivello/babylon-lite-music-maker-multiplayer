[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $ProjectRoot,
  [Parameter(Mandatory)] [int] $Port,
  [Parameter(Mandatory)] [string] $RoutesJson
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

$canInspectProcesses = $true
try { $owned = @(Get-OwnedProcesses) } catch { $canInspectProcesses = $false; $owned = @() }
if ($canInspectProcesses) {
  foreach ($process in $owned) { & taskkill.exe /PID $process.ProcessId /T /F | Out-Null }
}

$clock = [Diagnostics.Stopwatch]::StartNew()
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
} while ($clock.ElapsedMilliseconds -lt 700 -and $candidate -lt ($Port + 5))
if ($listener -and $candidate -ge ($Port + 5)) { throw "No free project port found from $Port through $($Port + 4)." }

if (-not $reuse) {
  $child = Start-Process cmd.exe -ArgumentList "/d /c npm run dev -- --port $candidate" -WorkingDirectory $root -WindowStyle Hidden -PassThru
  do { $listener = @(Get-NetTCPConnection -LocalPort $candidate -State Listen -ErrorAction SilentlyContinue); if ($listener) { break }; if ($child.HasExited) { throw "Vite launcher exited with code $($child.ExitCode)." }; Start-Sleep -Milliseconds 50 } while ($clock.ElapsedMilliseconds -lt 6000)
  if (-not $listener) { throw "Vite did not listen on $candidate within 6 seconds." }
}

$checks = foreach ($route in $routes) {
  $response = Invoke-WebRequest "http://127.0.0.1:$candidate$($route.route)" -UseBasicParsing -TimeoutSec 1
  [pscustomobject]@{ Label=$route.label; Route=$route.route; Status=$response.StatusCode; Url="http://127.0.0.1:$candidate$($route.route)" }
}
if (@($checks | Where-Object Status -ne 200).Count) { throw 'One or more routes did not return HTTP 200.' }
$checks | ConvertTo-Json -Compress
