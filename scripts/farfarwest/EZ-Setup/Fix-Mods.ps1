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

# ---------- 2. Detect proxy DLL and install UE4SS if missing ----------
$proxyCandidates = @('dwmapi.dll', 'xinput1_3.dll', 'd3d11.dll', 'd3d12.dll', 'dsound.dll')
function Get-ProxyHits {
    param([string]$Win64Path, [string[]]$Names)
    $hits = @()
    foreach ($n in $Names) {
        if (Test-Path (Join-Path $Win64Path $n)) { $hits += $n }
    }
    return $hits
}

$proxyFound = Get-ProxyHits -Win64Path $win64 -Names $proxyCandidates

if ($proxyFound.Count -eq 0) {
    Say 'UE4SS proxy DLL missing. Downloading and installing UE4SS automatically...' 'Yellow'

    $tempRoot = Join-Path $env:TEMP "ue4ss-install-$(Get-Random)"
    New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
    $zipPath = Join-Path $tempRoot 'UE4SS.zip'
    $extractPath = Join-Path $tempRoot 'extracted'

    $downloadUrls = @(
        'https://github.com/UE4SS-RE/RE-UE4SS/releases/latest/download/UE4SS_v3.0.1.zip',
        'https://github.com/UE4SS-RE/RE-UE4SS/releases/download/v3.0.1/UE4SS_v3.0.1.zip'
    )

    $downloaded = $false
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $apiUrl = 'https://api.github.com/repos/UE4SS-RE/RE-UE4SS/releases/latest'
        $release = Invoke-RestMethod -Uri $apiUrl -UseBasicParsing -Headers @{ 'User-Agent' = 'FFW-Fix-Mods' } -ErrorAction Stop
        $asset = $release.assets | Where-Object {
            $_.name -match '^UE4SS.*\.zip$' -and $_.name -notmatch 'pdb|source|sourceonly|dev|zCustomGameConfigs'
        } | Select-Object -First 1
        if ($asset) {
            $downloadUrls = @($asset.browser_download_url) + $downloadUrls
            Say "Latest UE4SS release: $($release.tag_name) ($($asset.name))" 'Cyan'
        }
    } catch {
        Say "GitHub API lookup failed, will try pinned URL. ($($_.Exception.Message))" 'Yellow'
    }

    foreach ($url in $downloadUrls) {
        try {
            Say "Downloading: $url"
            Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing -Headers @{ 'User-Agent' = 'FFW-Fix-Mods' } -ErrorAction Stop
            if ((Get-Item $zipPath).Length -gt 100000) {
                $downloaded = $true
                break
            }
        } catch {
            Say "Download failed: $($_.Exception.Message)" 'Yellow'
        }
    }

    if (-not $downloaded) {
        Bad 'Could not download UE4SS automatically.'
        Write-Host ''
        Write-Host 'Manual install:' -ForegroundColor Yellow
        Write-Host '  1. Go to https://github.com/UE4SS-RE/RE-UE4SS/releases/latest' -ForegroundColor Yellow
        Write-Host '  2. Download the UE4SS_vX.Y.Z.zip file' -ForegroundColor Yellow
        Write-Host "  3. Extract its contents into: $win64" -ForegroundColor Yellow
        Write-Host '  4. Re-run Fix-Mods.cmd' -ForegroundColor Yellow
        Remove-Item $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
        Read-Host 'Press Enter to close'
        exit 1
    }

    try {
        Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force -ErrorAction Stop
    } catch {
        Bad "Could not unzip UE4SS: $($_.Exception.Message)"
        Read-Host 'Press Enter to close'
        exit 1
    }

    # Some UE4SS zips have a top-level wrapper folder, some don't. Find the level
    # that contains the proxy DLL or the ue4ss subfolder.
    $payloadRoot = $extractPath
    $inner = Get-ChildItem -Path $extractPath -Directory -ErrorAction SilentlyContinue
    if ($inner.Count -eq 1 -and -not (Get-ProxyHits -Win64Path $extractPath -Names $proxyCandidates) -and -not (Test-Path (Join-Path $extractPath 'ue4ss'))) {
        $payloadRoot = $inner[0].FullName
    }

    Say 'Installing UE4SS into the game folder...'

    # Top-level files (proxy DLL, etc.) -> Win64
    Get-ChildItem -Path $payloadRoot -File -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item $_.FullName -Destination (Join-Path $win64 $_.Name) -Force
    }

    # ue4ss\ runtime files -> Win64\ue4ss\, but PRESERVE existing Mods so Gavin's script mods survive
    $srcUe4ss = Join-Path $payloadRoot 'ue4ss'
    $destUe4ss = Join-Path $win64 'ue4ss'
    if (Test-Path $srcUe4ss) {
        New-Item -ItemType Directory -Path $destUe4ss -Force | Out-Null

        Get-ChildItem -Path $srcUe4ss -File -ErrorAction SilentlyContinue | ForEach-Object {
            $destFile = Join-Path $destUe4ss $_.Name
            if (-not (Test-Path $destFile)) {
                Copy-Item $_.FullName -Destination $destFile -Force
            }
        }

        Get-ChildItem -Path $srcUe4ss -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'Mods' } | ForEach-Object {
            Copy-Item $_.FullName -Destination $destUe4ss -Recurse -Force
        }

        $srcMods = Join-Path $srcUe4ss 'Mods'
        if (Test-Path $srcMods) {
            New-Item -ItemType Directory -Path $ue4ssMods -Force | Out-Null
            Get-ChildItem -Path $srcMods -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                $modDest = Join-Path $ue4ssMods $_.Name
                if (-not (Test-Path $modDest)) {
                    Copy-Item $_.FullName -Destination $modDest -Recurse -Force
                }
            }
            $srcModsTxt = Join-Path $srcMods 'mods.txt'
            $destModsTxt = Join-Path $ue4ssMods 'mods.txt'
            if ((Test-Path $srcModsTxt) -and (-not (Test-Path $destModsTxt))) {
                Copy-Item $srcModsTxt -Destination $destModsTxt -Force
            }
        }
    }

    Remove-Item $tempRoot -Recurse -Force -ErrorAction SilentlyContinue

    $proxyFound = Get-ProxyHits -Win64Path $win64 -Names $proxyCandidates
    if ($proxyFound.Count -eq 0) {
        Bad 'UE4SS extract finished but no proxy DLL is present. Install may have failed.'
        Read-Host 'Press Enter to close'
        exit 1
    }
    Ok ("UE4SS installed. Proxy DLL: " + ($proxyFound -join ', '))
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
