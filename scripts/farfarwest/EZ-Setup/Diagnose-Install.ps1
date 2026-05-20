param(
    [string]$GameRoot = ''
)

$ErrorActionPreference = 'Continue'

function Say {
    param([string]$Message, [string]$Color = 'Cyan')
    Write-Host "[FFW-DIAG] $Message" -ForegroundColor $Color
}

function Status {
    param([string]$Label, [bool]$Ok, [string]$Detail = '')
    $tag = if ($Ok) { 'OK  ' } else { 'MISS' }
    $color = if ($Ok) { 'Green' } else { 'Red' }
    if ($Detail) {
        Write-Host "[$tag] $Label - $Detail" -ForegroundColor $color
    } else {
        Write-Host "[$tag] $Label" -ForegroundColor $color
    }
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
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) { return $candidate }
    }
    return ''
}

Say 'Starting Far Far West mod diagnostic.'
$resolvedGameRoot = Find-Game -Explicit $GameRoot
Status 'Game root found' ([bool]$resolvedGameRoot) $resolvedGameRoot
if (-not $resolvedGameRoot) {
    Say 'Game root not found. Send this screenshot to Ryan.' 'Red'
    Read-Host 'Press Enter to close'
    exit 1
}

$win64 = Join-Path $resolvedGameRoot 'FarFarWest\Binaries\Win64'
$paks = Join-Path $resolvedGameRoot 'FarFarWest\Content\Paks'
$mods = Join-Path $paks '~mods'
$ue4ss = Join-Path $win64 'ue4ss'
$ue4ssMods = Join-Path $ue4ss 'Mods'
$state = Join-Path $env:LOCALAPPDATA 'FarFarWest\Saved\ModHelper\last-turnkey-state.json'

Status 'Win64 folder' (Test-Path $win64) $win64
Status 'Paks folder' (Test-Path $paks) $paks
Status '~mods folder' (Test-Path $mods) $mods
Status 'ue4ss folder' (Test-Path $ue4ss) $ue4ss
Status 'ue4ss Mods folder' (Test-Path $ue4ssMods) $ue4ssMods
Status 'Turnkey state file' (Test-Path $state) $state

Write-Host ''
Say 'Installed pak files in ~mods:'
if (Test-Path $mods) {
    $pakFiles = Get-ChildItem -Path $mods -File -ErrorAction SilentlyContinue | Sort-Object Name
    if ($pakFiles.Count -eq 0) {
        Write-Host '  No files found in ~mods.' -ForegroundColor Red
    } else {
        foreach ($file in $pakFiles) {
            Write-Host "  $($file.Name)  [$($file.Length) bytes]"
        }
    }

    $pakBases = @{}
    foreach ($file in $pakFiles) {
        $base = [IO.Path]::GetFileNameWithoutExtension($file.Name)
        if (-not $pakBases.ContainsKey($base)) { $pakBases[$base] = @{} }
        $pakBases[$base][$file.Extension.ToLowerInvariant()] = $true
    }
    foreach ($base in $pakBases.Keys) {
        $hasPak = $pakBases[$base].ContainsKey('.pak')
        $hasUcas = $pakBases[$base].ContainsKey('.ucas')
        $hasUtoc = $pakBases[$base].ContainsKey('.utoc')
        Status "pak triplet $base" ($hasPak -and $hasUcas -and $hasUtoc) "pak=$hasPak ucas=$hasUcas utoc=$hasUtoc"
    }
}

Write-Host ''
Say 'UE4SS script mod folders:'
$presentMods = @()
if (Test-Path $ue4ssMods) {
    $scriptMods = Get-ChildItem -Path $ue4ssMods -Directory -ErrorAction SilentlyContinue | Sort-Object Name
    if ($scriptMods.Count -eq 0) {
        Write-Host '  No script mod folders found.' -ForegroundColor Red
    } else {
        foreach ($dir in $scriptMods) {
            $enabled = Test-Path (Join-Path $dir.FullName 'enabled.txt')
            $lua = Test-Path (Join-Path $dir.FullName 'Scripts\main.lua')
            Status $dir.Name ($enabled -and $lua) "enabled=$enabled lua=$lua"
            if ($enabled -and $lua) { $presentMods += $dir.Name }
        }
    }
}

Write-Host ''
Say 'UE4SS mods.txt check (most common silent failure):'
$modsTxt = Join-Path $ue4ssMods 'mods.txt'
if (-not (Test-Path $modsTxt)) {
    Status 'mods.txt present' $false $modsTxt
    Write-Host '  mods.txt is missing. UE4SS will not load any script mod even if enabled.txt is present.' -ForegroundColor Red
    Write-Host '  Run Fix-Mods.cmd to repair.' -ForegroundColor Yellow
} else {
    Status 'mods.txt present' $true $modsTxt
    $modsTxtRaw = Get-Content $modsTxt -Raw -ErrorAction SilentlyContinue
    $missing = @()
    foreach ($name in $presentMods) {
        $pattern = "(?m)^\s*" + [regex]::Escape($name) + "\s*:\s*1\s*$"
        if ($modsTxtRaw -notmatch $pattern) { $missing += $name }
    }
    if ($missing.Count -eq 0) {
        Status 'all enabled mods listed in mods.txt as :1' $true ''
    } else {
        Status 'all enabled mods listed in mods.txt as :1' $false ("missing: " + ($missing -join ', '))
        Write-Host '  Run Fix-Mods.cmd to repair.' -ForegroundColor Yellow
    }
}

Write-Host ''
Say 'UE4SS proxy DLL check:'
$proxyCandidates = @('dwmapi.dll', 'xinput1_3.dll', 'd3d11.dll', 'd3d12.dll', 'dsound.dll')
$proxyHits = @()
foreach ($p in $proxyCandidates) {
    if (Test-Path (Join-Path $win64 $p)) { $proxyHits += $p }
}
Status 'UE4SS proxy DLL next to game exe' ($proxyHits.Count -gt 0) ($proxyHits -join ', ')
if ($proxyHits.Count -eq 0) {
    Write-Host '  UE4SS itself is not installed - mods cannot load. Re-run the main installer.' -ForegroundColor Red
}

Write-Host ''
Say 'UE4SS console visibility check (so you can SEE mods load):'
$settingsIni = Join-Path $ue4ss 'UE4SS-settings.ini'
if (Test-Path $settingsIni) {
    $iniRaw = Get-Content $settingsIni -Raw
    $guiOn = ($iniRaw -match '(?m)^\s*GuiConsoleVisible\s*=\s*1\s*$') -and ($iniRaw -match '(?m)^\s*GuiConsoleEnabled\s*=\s*1\s*$')
    Status 'UE4SS GUI console enabled' $guiOn ''
    if (-not $guiOn) {
        Write-Host '  Run Fix-Mods.cmd to enable - it shows a live window proving mods loaded.' -ForegroundColor Yellow
    }
} else {
    Status 'UE4SS-settings.ini present' $false $settingsIni
}

Write-Host ''
Say 'Turnkey state contents:'
if (Test-Path $state) {
    try {
        $stateObj = Get-Content $state -Raw | ConvertFrom-Json
        Write-Host "  timestamp: $($stateObj.timestamp)"
        Write-Host "  gameRoot: $($stateObj.gameRoot)"
        Write-Host "  installedModPaks: $($stateObj.installedModPaks -join ', ')"
        Write-Host "  installedScriptMods: $($stateObj.installedScriptMods -join ', ')"
    } catch {
        Write-Host "  Could not read state JSON: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ''
Say 'UE4SS log check:'
$logCandidates = @(
    (Join-Path $ue4ss 'UE4SS.log'),
    (Join-Path $win64 'UE4SS.log')
)
$logPath = ''
foreach ($candidate in $logCandidates) {
    if (Test-Path $candidate) { $logPath = $candidate; break }
}
Status 'UE4SS log found' ([bool]$logPath) $logPath
if ($logPath) {
    Say 'Recent relevant UE4SS log lines:'
    $lines = Select-String -Path $logPath -Pattern 'GoldSandbox|WalletMonitor|AutoPickup|XPMod|BetterWandering|Lua|error|failed|panic' -ErrorAction SilentlyContinue
    $recent = @($lines | Select-Object -Last 60)
    if ($recent.Count -eq 0) {
        Write-Host '  No relevant log lines found.' -ForegroundColor Yellow
    } else {
        foreach ($line in $recent) {
            Write-Host "  $($line.Line)"
        }
    }
}

Write-Host ''
Say 'What to send Ryan:' 'Yellow'
Write-Host '  1. Screenshot from the first red MISS line, if any.'
Write-Host '  2. Screenshot of Recent relevant UE4SS log lines.'
Write-Host '  3. Tell him whether the game was started after install and whether it was a private lobby/new session.'
Read-Host 'Press Enter to close'
