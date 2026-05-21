param(
    [string]$GameRoot = ''
)

$ErrorActionPreference = 'Continue'

function Say {
    param([string]$Message, [string]$Color = 'Cyan')
    Write-Host "[FFW-LOGS] $Message" -ForegroundColor $Color
}

function Find-Game {
    param([string]$Explicit)
    if ($Explicit -and (Test-Path $Explicit)) { return (Resolve-Path $Explicit).Path }
    $candidates = @(
        'C:\Program Files (x86)\Steam\steamapps\common\FarFarWest',
        'C:\Program Files\Steam\steamapps\common\FarFarWest',
        'D:\SteamLibrary\steamapps\common\FarFarWest',
        'E:\SteamLibrary\steamapps\common\FarFarWest',
        'F:\SteamLibrary\steamapps\common\FarFarWest',
        'G:\SteamLibrary\steamapps\common\FarFarWest'
    )
    foreach ($c in $candidates) { if (Test-Path $c) { return $c } }
    return ''
}

$resolved = Find-Game -Explicit $GameRoot
if (-not $resolved) {
    Write-Host '[FAIL] Far Far West install folder not found.' -ForegroundColor Red
    Read-Host 'Press Enter to close'
    exit 1
}
Say "Game folder: $resolved" 'Green'

$win64        = Join-Path $resolved 'FarFarWest\Binaries\Win64'
$paks         = Join-Path $resolved 'FarFarWest\Content\Paks'
$mods         = Join-Path $paks '~mods'
$ue4ss        = Join-Path $win64 'ue4ss'
$ue4ssMods    = Join-Path $ue4ss 'Mods'
$shippingExe  = Join-Path $win64 'FarFarWest-Win64-Shipping.exe'
$logPath      = Join-Path $ue4ss 'UE4SS.log'
$logPathAlt   = Join-Path $win64 'UE4SS.log'
$settingsIni  = Join-Path $ue4ss 'UE4SS-settings.ini'
$modsTxt      = Join-Path $ue4ssMods 'mods.txt'
$turnkeyState = Join-Path $env:LOCALAPPDATA 'FarFarWest\Saved\ModHelper\last-turnkey-state.json'

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$staging = Join-Path $env:TEMP "ffw-logs-$stamp"
New-Item -ItemType Directory -Path $staging -Force | Out-Null

function Copy-IfExists {
    param([string]$Src, [string]$DestName)
    if (-not $Src) { return $false }
    if (Test-Path $Src) {
        Copy-Item $Src -Destination (Join-Path $staging $DestName) -Force -ErrorAction SilentlyContinue
        return $true
    }
    return $false
}

Say 'Collecting files...'

$collected = [ordered]@{}
$collected['UE4SS.log (ue4ss\)']        = Copy-IfExists $logPath      'UE4SS.log'
$collected['UE4SS.log (Win64\)']        = Copy-IfExists $logPathAlt   'UE4SS-Win64.log'
$collected['UE4SS-settings.ini']        = Copy-IfExists $settingsIni  'UE4SS-settings.ini'
$collected['mods.txt']                  = Copy-IfExists $modsTxt      'mods.txt'
$collected['last-turnkey-state.json']   = Copy-IfExists $turnkeyState 'last-turnkey-state.json'

$summary = New-Object System.Text.StringBuilder
$null = $summary.AppendLine("Far Far West Diagnostic Bundle")
$null = $summary.AppendLine("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$null = $summary.AppendLine("Computer: $env:COMPUTERNAME  User: $env:USERNAME")
$null = $summary.AppendLine("Game root: $resolved")
$null = $summary.AppendLine("Windows: $((Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue).Caption)")
$null = $summary.AppendLine('')

$null = $summary.AppendLine('== Key files collected ==')
foreach ($k in $collected.Keys) {
    $mark = if ($collected[$k]) { 'YES' } else { 'NO ' }
    $null = $summary.AppendLine("  [$mark] $k")
}
$null = $summary.AppendLine('')

# Game exe version
$null = $summary.AppendLine('== Game executable ==')
if (Test-Path $shippingExe) {
    $vi = (Get-Item $shippingExe).VersionInfo
    $null = $summary.AppendLine("  Path: $shippingExe")
    $null = $summary.AppendLine("  FileVersion:    $($vi.FileVersion)")
    $null = $summary.AppendLine("  ProductVersion: $($vi.ProductVersion)")
    $null = $summary.AppendLine("  Size: $((Get-Item $shippingExe).Length) bytes")
    $null = $summary.AppendLine("  Last write: $((Get-Item $shippingExe).LastWriteTime)")
} else {
    $null = $summary.AppendLine("  MISSING: $shippingExe")
}
$null = $summary.AppendLine('')

# Win64 root directory listing
$null = $summary.AppendLine('== Files in Binaries\Win64\ (root) ==')
if (Test-Path $win64) {
    Get-ChildItem -Path $win64 -File -ErrorAction SilentlyContinue | Sort-Object Name | ForEach-Object {
        $null = $summary.AppendLine(("  {0,-50} {1,12} bytes  {2}" -f $_.Name, $_.Length, $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm')))
    }
} else {
    $null = $summary.AppendLine("  MISSING: $win64")
}
$null = $summary.AppendLine('')

# UE4SS folder listing
$null = $summary.AppendLine('== Files in Binaries\Win64\ue4ss\ (root) ==')
if (Test-Path $ue4ss) {
    Get-ChildItem -Path $ue4ss -File -ErrorAction SilentlyContinue | Sort-Object Name | ForEach-Object {
        $null = $summary.AppendLine(("  {0,-50} {1,12} bytes  {2}" -f $_.Name, $_.Length, $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm')))
    }
    $null = $summary.AppendLine('')
    $null = $summary.AppendLine('  Subfolders:')
    Get-ChildItem -Path $ue4ss -Directory -ErrorAction SilentlyContinue | Sort-Object Name | ForEach-Object {
        $childCount = @(Get-ChildItem -Path $_.FullName -Recurse -ErrorAction SilentlyContinue).Count
        $null = $summary.AppendLine(("    {0}  ({1} items)" -f $_.Name, $childCount))
    }
} else {
    $null = $summary.AppendLine("  MISSING: $ue4ss")
}
$null = $summary.AppendLine('')

# Mods folder listing
$null = $summary.AppendLine('== UE4SS Mods folder (per-mod state) ==')
if (Test-Path $ue4ssMods) {
    Get-ChildItem -Path $ue4ssMods -Directory -ErrorAction SilentlyContinue | Sort-Object Name | ForEach-Object {
        $hasEnabled  = Test-Path (Join-Path $_.FullName 'enabled.txt')
        $hasLua      = Test-Path (Join-Path $_.FullName 'Scripts\main.lua')
        $hasDll      = Test-Path (Join-Path $_.FullName 'dlls\main.dll')
        $luaSize     = if ($hasLua) { (Get-Item (Join-Path $_.FullName 'Scripts\main.lua')).Length } else { 0 }
        $null = $summary.AppendLine(("  {0,-30} enabled={1,-5} lua={2,-5} ({3} bytes) dll={4}" -f $_.Name, $hasEnabled, $hasLua, $luaSize, $hasDll))
    }
} else {
    $null = $summary.AppendLine("  MISSING: $ue4ssMods")
}
$null = $summary.AppendLine('')

# mods.txt content
$null = $summary.AppendLine('== mods.txt content ==')
if (Test-Path $modsTxt) {
    $null = $summary.AppendLine((Get-Content $modsTxt -Raw))
} else {
    $null = $summary.AppendLine('  MISSING')
}
$null = $summary.AppendLine('')

# UE4SS-settings.ini console-related keys
$null = $summary.AppendLine('== UE4SS-settings.ini key values ==')
if (Test-Path $settingsIni) {
    $iniRaw = Get-Content $settingsIni -Raw
    foreach ($key in @('ConsoleEnabled', 'GuiConsoleEnabled', 'GuiConsoleVisible', 'MajorVersion', 'MinorVersion', 'bUseUObjectArrayCache')) {
        $m = [regex]::Match($iniRaw, "(?m)^\s*$key\s*=\s*(.+?)\s*$")
        if ($m.Success) {
            $null = $summary.AppendLine(("  {0} = {1}" -f $key, $m.Groups[1].Value))
        } else {
            $null = $summary.AppendLine("  $key  (NOT SET)")
        }
    }
} else {
    $null = $summary.AppendLine('  MISSING')
}
$null = $summary.AppendLine('')

# ~mods folder (pak mods)
$null = $summary.AppendLine('== ~mods pak files ==')
if (Test-Path $mods) {
    Get-ChildItem -Path $mods -File -ErrorAction SilentlyContinue | Sort-Object Name | ForEach-Object {
        $null = $summary.AppendLine(("  {0,-50} {1,12} bytes" -f $_.Name, $_.Length))
    }
} else {
    $null = $summary.AppendLine("  MISSING: $mods")
}
$null = $summary.AppendLine('')

# UE4SS log tail (last 200 lines, regardless of pattern)
$null = $summary.AppendLine('== UE4SS.log (last 200 lines) ==')
$activeLog = ''
foreach ($candidate in @($logPath, $logPathAlt)) {
    if (Test-Path $candidate) { $activeLog = $candidate; break }
}
if ($activeLog) {
    $null = $summary.AppendLine("  Source: $activeLog")
    $null = $summary.AppendLine("  Size: $((Get-Item $activeLog).Length) bytes")
    $null = $summary.AppendLine("  Last write: $((Get-Item $activeLog).LastWriteTime)")
    $null = $summary.AppendLine('  ---')
    Get-Content -Path $activeLog -Tail 200 -ErrorAction SilentlyContinue | ForEach-Object {
        $null = $summary.AppendLine($_)
    }
} else {
    $null = $summary.AppendLine('  NO UE4SS.log FOUND - UE4SS is not injecting at all.')
    $null = $summary.AppendLine('  This means the proxy DLL is not being loaded by the game.')
    $null = $summary.AppendLine('  Likely causes: EAC blocking, wrong proxy DLL choice, or UE4SS version mismatch.')
}

# Save summary
$summaryPath = Join-Path $staging 'SUMMARY.txt'
Set-Content -Path $summaryPath -Value $summary.ToString() -Encoding UTF8

# Create zip on Desktop
$desktop = [Environment]::GetFolderPath('Desktop')
$zipOut = Join-Path $desktop "FFW-Logs-$stamp.zip"
if (Test-Path $zipOut) { Remove-Item $zipOut -Force }

$toZip = Get-ChildItem -Path $staging -File | ForEach-Object { $_.FullName }
Compress-Archive -Path $toZip -DestinationPath $zipOut -Force

Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ''
Write-Host '================================================================' -ForegroundColor Green
Write-Host '  Diagnostic bundle ready!' -ForegroundColor Green
Write-Host '================================================================' -ForegroundColor Green
Write-Host ''
Write-Host "File: $zipOut" -ForegroundColor Cyan
Write-Host "Size: $((Get-Item $zipOut).Length) bytes" -ForegroundColor Cyan
Write-Host ''
Write-Host 'Text or email this zip file to Ryan.' -ForegroundColor Yellow
Write-Host ''

# Open Explorer with the zip selected
Start-Process explorer.exe "/select,`"$zipOut`""

Read-Host 'Press Enter to close'
