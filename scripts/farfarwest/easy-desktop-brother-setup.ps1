param(
    [string]$GameRoot = '',
    [bool]$FreshStart = $true,
    [bool]$LaunchGame = $true,
    [switch]$SkipRepoDownload
)

$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "[FarFarWest] $Message" -ForegroundColor Cyan
}

function Test-IsAdministrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Resolve-GameRoot {
    param([string]$ExplicitPath)

    if ($ExplicitPath -and (Test-Path $ExplicitPath)) {
        return (Resolve-Path $ExplicitPath).Path
    }

    $candidates = @(
        'C:\Program Files (x86)\Steam\steamapps\common\FarFarWest',
        'D:\SteamLibrary\steamapps\common\FarFarWest',
        'E:\SteamLibrary\steamapps\common\FarFarWest',
        'F:\SteamLibrary\steamapps\common\FarFarWest'
    )

    foreach ($path in $candidates) {
        if (Test-Path $path) {
            return $path
        }
    }

    throw 'Could not find Far Far West install folder. Re-run with -GameRoot "X:\\SteamLibrary\\steamapps\\common\\FarFarWest".'
}

function Find-RepoRoot {
    param(
        [string]$ScriptDir,
        [switch]$SkipDownload
    )

    $candidates = @(
        (Join-Path $ScriptDir 'Return_Rover-main'),
        (Join-Path $ScriptDir 'Return_Rover')
    )

    foreach ($candidate in $candidates) {
        if (Test-Path (Join-Path $candidate 'scripts\farfarwest\turnkey-coop-modpack.ps1')) {
            return (Resolve-Path $candidate).Path
        }
    }

    if ($SkipDownload) {
        throw 'Could not find Return_Rover-main beside this script and -SkipRepoDownload was set.'
    }

    $downloadRoot = Join-Path $env:TEMP 'Return_Rover_Modpack'
    $zipPath = Join-Path $downloadRoot 'Return_Rover-main.zip'
    $zipUrl = 'https://github.com/Just-Krispy/Return_Rover/archive/refs/heads/main.zip'

    Write-Step 'Downloading latest Return_Rover modpack files from GitHub...'
    if (Test-Path $downloadRoot) {
        Remove-Item $downloadRoot -Recurse -Force
    }
    New-Item -ItemType Directory -Path $downloadRoot -Force | Out-Null

    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing

    Write-Step 'Extracting modpack files...'
    Expand-Archive -Path $zipPath -DestinationPath $downloadRoot -Force

    $repoRoot = Join-Path $downloadRoot 'Return_Rover-main'
    if (-not (Test-Path (Join-Path $repoRoot 'scripts\farfarwest\turnkey-coop-modpack.ps1'))) {
        throw 'Downloaded repo is missing scripts/farfarwest/turnkey-coop-modpack.ps1.'
    }

    return $repoRoot
}

function Normalize-PathInput {
    param([string]$InputText)

    if (-not $InputText) {
        return ''
    }

    $clean = $InputText.Trim()
    if ($clean.Length -ge 2) {
        $first = $clean.Substring(0, 1)
        $last = $clean.Substring($clean.Length - 1, 1)
        if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
            $clean = $clean.Substring(1, $clean.Length - 2)
        }
    }

    return $clean
}

function Invoke-Turnkey {
    param(
        [string]$TurnkeyScript,
        [string]$ResolvedGameRoot,
        [bool]$UseFreshStart,
        [bool]$UseLaunchGame,
        [string]$XpSource = '',
        [string]$BwtSource = '',
        [string]$PickupSource = ''
    )

    $params = @{ GameRoot = $ResolvedGameRoot }

    if ($UseFreshStart) {
        $params.FreshStart = $true
    }
    if ($UseLaunchGame) {
        $params.LaunchGame = $true
    }
    if ($XpSource) {
        $params.XpGoldSoulsPakPath = $XpSource
    }
    if ($BwtSource) {
        $params.BetterWanderingTradersPakPath = $BwtSource
    }
    if ($PickupSource) {
        $params.PickupGlowPakPath = $PickupSource
    }

    & $TurnkeyScript @params
}

Write-Step 'Starting easy Far Far West mod-pack setup.'

$resolvedGameRoot = Resolve-GameRoot -ExplicitPath $GameRoot
Write-Step "Detected game folder: $resolvedGameRoot"

if ($resolvedGameRoot -like 'C:\Program Files*' -and -not (Test-IsAdministrator)) {
    throw 'Game is under Program Files. Please re-run PowerShell as Administrator, then run this script again.'
}

$scriptDir = Split-Path -Parent $PSCommandPath
$repoRoot = Find-RepoRoot -ScriptDir $scriptDir -SkipDownload:$SkipRepoDownload
Write-Step "Using mod-pack files from: $repoRoot"

$turnkeyScript = Join-Path $repoRoot 'scripts\farfarwest\turnkey-coop-modpack.ps1'
if (-not (Test-Path $turnkeyScript)) {
    throw "Missing installer script: $turnkeyScript"
}

$autoSuccess = $false
Write-Step 'Attempting automatic install (checks C:\mods, Downloads, and Desktop).'
try {
    Invoke-Turnkey -TurnkeyScript $turnkeyScript -ResolvedGameRoot $resolvedGameRoot -UseFreshStart:$FreshStart -UseLaunchGame:$LaunchGame
    $autoSuccess = $true
}
catch {
    Write-Warning "Automatic install failed: $($_.Exception.Message)"
}

if (-not $autoSuccess) {
    Write-Host ''
    Write-Host 'Auto-detect failed. I will ask for 3 paths now.' -ForegroundColor Yellow
    Write-Host 'Tip: drag each file/folder into this window, then press Enter.' -ForegroundColor Yellow
    Write-Host ''

    $xpPath = Normalize-PathInput (Read-Host 'Path for XP-Gold-Souls (.pak/.zip/or XPMod folder)')
    $bwtPath = Normalize-PathInput (Read-Host 'Path for Better-Wandering-Traders (.pak/.zip/or folder)')
    $pickupPath = Normalize-PathInput (Read-Host 'Path for Pickup-Glow (.pak/.zip)')

    Invoke-Turnkey -TurnkeyScript $turnkeyScript -ResolvedGameRoot $resolvedGameRoot -UseFreshStart:$FreshStart -UseLaunchGame:$LaunchGame -XpSource $xpPath -BwtSource $bwtPath -PickupSource $pickupPath
}

Write-Host ''
Write-Step 'Done. Mod-pack install completed.'
Write-Step 'If multiplayer progression looks wrong, host and friend should run matching gameplay-affecting mod versions.'
Write-Host ''
Read-Host 'Press Enter to close'