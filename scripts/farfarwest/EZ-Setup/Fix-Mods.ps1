param(
    [string]$GameRoot = '',
    [switch]$NoLaunch
)

$ErrorActionPreference = 'Continue'

function Say {
    param([string]$Message, [string]$Color = 'Cyan')
    Write-Host "[FIX] $Message" -ForegroundColor $Color
}

function Ok {
    param([string]$Message)
    Write-Host "[ OK ] $Message" -ForegroundColor Green
}

function Bad {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
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

Write-Host ''
Write-Host '================================================================' -ForegroundColor Cyan
Write-Host '  Far Far West - Fix Mods (one-click repair)' -ForegroundColor Cyan
Write-Host '================================================================' -ForegroundColor Cyan
Write-Host ''

# ---------- 1. Find game ----------
$resolved = Find-Game -Explicit $GameRoot
if (-not $resolved) {
    Bad 'Far Far West install folder not found.'
    Write-Host 'Send Ryan a screenshot of this window.' -ForegroundColor Yellow
    Read-Host 'Press Enter to close'
    exit 1
}
Ok "Game folder: $resolved"

$win64        = Join-Path $resolved 'FarFarWest\Binaries\Win64'
$ue4ss        = Join-Path $win64 'ue4ss'
$ue4ssMods    = Join-Path $ue4ss 'Mods'
$modsTxt      = Join-Path $ue4ssMods 'mods.txt'
$settingsIni  = Join-Path $ue4ss 'UE4SS-settings.ini'
$shippingExe  = Join-Path $win64 'FarFarWest-Win64-Shipping.exe'
$logPath      = Join-Path $ue4ss 'UE4SS.log'
$logPathAlt   = Join-Path $win64 'UE4SS.log'

if (-not (Test-Path $ue4ssMods)) {
    Bad "UE4SS Mods folder missing: $ue4ssMods"
    Write-Host 'Run the main installer (Run-This-First.cmd) before this fix script.' -ForegroundColor Yellow
    Read-Host 'Press Enter to close'
    exit 1
}
Ok "UE4SS Mods folder: $ue4ssMods"

# ---------- 2. Detect proxy DLL ----------
$proxyCandidates = @('dwmapi.dll', 'xinput1_3.dll', 'd3d11.dll', 'd3d12.dll', 'dsound.dll')
$proxyFound = @()
foreach ($name in $proxyCandidates) {
    $p = Join-Path $win64 $name
    if (Test-Path $p) { $proxyFound += $name }
}
if ($proxyFound.Count -eq 0) {
    Bad 'No UE4SS proxy DLL found next to the game exe (dwmapi.dll / xinput1_3.dll / etc.).'
    Write-Host 'UE4SS itself is not installed. Re-run the main installer.' -ForegroundColor Yellow
    Read-Host 'Press Enter to close'
    exit 1
} else {
    Ok ("UE4SS proxy DLL present: " + ($proxyFound -join ', '))
}

# ---------- 3. Rebuild mods.txt ----------
Say 'Rebuilding mods.txt from installed script mod folders...'
$modDirs = Get-ChildItem -Path $ue4ssMods -Directory -ErrorAction SilentlyContinue | Sort-Object Name

$keepers = @()
foreach ($dir in $modDirs) {
    $hasEnabled = Test-Path (Join-Path $dir.FullName 'enabled.txt')
    $hasLua     = Test-Path (Join-Path $dir.FullName 'Scripts\main.lua')
    $hasDll     = Test-Path (Join-Path $dir.FullName 'dlls\main.dll')
    if ($hasEnabled -and ($hasLua -or $hasDll)) {
        $keepers += $dir.Name
    }
}

if ($keepers.Count -eq 0) {
    Bad 'No valid script mod folders found in ue4ss\Mods.'
    Write-Host 'Re-run the main installer.' -ForegroundColor Yellow
    Read-Host 'Press Enter to close'
    exit 1
}

$builtinTail = @('CheatManagerEnablerMod', 'ConsoleCommandsMod', 'ConsoleEnablerMod', 'SplitScreenMod', 'LineTraceMod', 'BPModLoaderMod', 'BPML_GenericFunctions', 'Keybinds')
$lines = @()
foreach ($name in $keepers) {
    $lines += "$name : 1"
}
foreach ($builtin in $builtinTail) {
    if (-not ($keepers -contains $builtin)) {
        $lines += "$builtin : 0"
    }
}

$lines += ''
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($modsTxt, ($lines -join "`r`n"), $utf8NoBom)
Ok "Wrote mods.txt with $($keepers.Count) enabled mods: $($keepers -join ', ')"

# ---------- 4. Enable UE4SS console so he can SEE it working ----------
Say 'Enabling UE4SS console (so you can see mods loading)...'
if (Test-Path $settingsIni) {
    $iniText = Get-Content $settingsIni -Raw

    function Set-IniValue {
        param([string]$Text, [string]$Key, [string]$Value)
        $pattern = "(?m)^(\s*$Key\s*=\s*).*$"
        if ($Text -match $pattern) {
            return [regex]::Replace($Text, $pattern, "`${1}$Value")
        } else {
            return $Text + "`r`n$Key = $Value`r`n"
        }
    }

    $iniText = Set-IniValue -Text $iniText -Key 'ConsoleEnabled'    -Value '1'
    $iniText = Set-IniValue -Text $iniText -Key 'GuiConsoleEnabled' -Value '1'
    $iniText = Set-IniValue -Text $iniText -Key 'GuiConsoleVisible' -Value '1'

    Set-Content -Path $settingsIni -Value $iniText -Encoding UTF8 -NoNewline
    Ok 'UE4SS console enabled.'
} else {
    Write-Host '[WARN] UE4SS-settings.ini not found - skipping console enable.' -ForegroundColor Yellow
}

# ---------- 5. Clear old log so we can confirm a fresh load ----------
foreach ($lp in @($logPath, $logPathAlt)) {
    if (Test-Path $lp) {
        try {
            Clear-Content $lp -ErrorAction Stop
            Ok "Cleared old log: $lp"
        } catch {
            Write-Host "[WARN] Could not clear log: $lp" -ForegroundColor Yellow
        }
    }
}

# ---------- 6. Launch the Shipping exe directly (bypasses EAC wrapper race) ----------
Write-Host ''
if ($NoLaunch) {
    Say 'Skipping launch (--NoLaunch passed).'
} elseif (Test-Path $shippingExe) {
    Say 'Launching Far Far West directly (bypassing Steam wrapper)...'
    Write-Host ''
    Write-Host '================================================================' -ForegroundColor Green
    Write-Host '  When the game loads, a small UE4SS CONSOLE window should pop' -ForegroundColor Green
    Write-Host '  up. You should see lines like:' -ForegroundColor Green
    Write-Host '     [AutoPickup] Loaded.' -ForegroundColor Green
    Write-Host '     [GoldSandbox] Loaded.' -ForegroundColor Green
    Write-Host '     [XPMod] Loaded.' -ForegroundColor Green
    Write-Host '  If you see those, the mods ARE working.' -ForegroundColor Green
    Write-Host '================================================================' -ForegroundColor Green
    Write-Host ''
    Start-Process -FilePath $shippingExe -WorkingDirectory $win64
    Ok 'Game launched.'
} else {
    Write-Host '[WARN] Shipping exe not found at expected path, falling back to Steam.' -ForegroundColor Yellow
    Start-Process 'steam://run/3124540'
}

Write-Host ''
Say 'Fix complete. Play for a minute, then close the game.' 'Cyan'
Write-Host 'If mods still do nothing, send Ryan this file:' -ForegroundColor Yellow
Write-Host "   $logPath" -ForegroundColor Yellow
Write-Host ''
Read-Host 'Press Enter to close this window'
