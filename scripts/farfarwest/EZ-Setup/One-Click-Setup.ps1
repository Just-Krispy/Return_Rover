param(
    [string]$GameRoot = '',
    [string]$DropFolder = 'C:\FFW-Mods',
    [switch]$NoLaunch
)

$ErrorActionPreference = 'Stop'

function Say {
    param([string]$Message, [string]$Color = 'Cyan')
    Write-Host "[FFW] $Message" -ForegroundColor $Color
}

function Pause-Wait {
    param([string]$Message)
    Write-Host ""
    Write-Host $Message -ForegroundColor Yellow
    Read-Host "Press Enter when done"
}

# ---------- 1. Admin check ----------
$id = [Security.Principal.WindowsIdentity]::GetCurrent()
$pr = New-Object Security.Principal.WindowsPrincipal($id)
if (-not $pr.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Say "Please re-run PowerShell as Administrator, then run this script again." 'Red'
    Read-Host "Press Enter to close"
    exit 1
}

# ---------- 2. Find game ----------
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

    Say "Could not auto-detect Far Far West. Searching all drives..." 'Yellow'
    foreach ($d in (Get-PSDrive -PSProvider FileSystem).Root) {
        $hit = Get-ChildItem -Path $d -Recurse -Directory -Filter 'FarFarWest' -ErrorAction SilentlyContinue |
            Where-Object { Test-Path (Join-Path $_.FullName 'FarFarWest\Binaries\Win64') } |
            Select-Object -First 1
        if ($hit) { return $hit.FullName }
    }
    return ''
}

$gameRoot = Find-Game -Explicit $GameRoot
if (-not $gameRoot) {
    Say "Far Far West install folder not found." 'Red'
    Say "Re-run this script with: -GameRoot 'X:\path\to\FarFarWest'" 'Red'
    Read-Host "Press Enter to close"
    exit 1
}
Say "Game folder: $gameRoot" 'Green'

# ---------- 3. Download repo ----------
$downloadRoot = Join-Path $env:TEMP 'Return_Rover_Modpack'
$zipPath = Join-Path $downloadRoot 'Return_Rover-main.zip'
$zipUrl = 'https://github.com/Just-Krispy/Return_Rover/archive/refs/heads/main.zip'

Say "Downloading modpack scripts from GitHub..."
if (Test-Path $downloadRoot) { Remove-Item $downloadRoot -Recurse -Force }
New-Item -ItemType Directory -Path $downloadRoot -Force | Out-Null
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
Expand-Archive -Path $zipPath -DestinationPath $downloadRoot -Force

$repoRoot = Join-Path $downloadRoot 'Return_Rover-main'
$turnkey = Join-Path $repoRoot 'scripts\farfarwest\turnkey-coop-modpack.ps1'
if (-not (Test-Path $turnkey)) {
    Say "Downloaded repo is missing turnkey script." 'Red'
    Read-Host "Press Enter to close"
    exit 1
}
Say "Modpack scripts ready: $repoRoot" 'Green'

# ---------- 4. Drop folder ----------
if (-not (Test-Path $DropFolder)) {
    New-Item -ItemType Directory -Path $DropFolder -Force | Out-Null
}
Say "Drop folder: $DropFolder" 'Green'
Say "Opening drop folder in Explorer..."
Start-Process explorer.exe $DropFolder

Write-Host ""
Write-Host "=================== ACTION REQUIRED ===================" -ForegroundColor Yellow
Write-Host "Put these 3 files (or zips) into: $DropFolder" -ForegroundColor Yellow
Write-Host "  1. XP-Gold-Souls Multiplier (.pak or .zip)" -ForegroundColor Yellow
Write-Host "     https://www.nexusmods.com/farfarwest/mods/14" -ForegroundColor Gray
Write-Host "  2. Better Wandering Traders (.pak or .zip)" -ForegroundColor Yellow
Write-Host "     https://www.nexusmods.com/farfarwest/mods/59" -ForegroundColor Gray
Write-Host "  3. White Primary Pickup Glow (.pak or .zip)" -ForegroundColor Yellow
Write-Host "     https://www.nexusmods.com/farfarwest/mods/13" -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Yellow
Pause-Wait "When all 3 files are in the folder, press Enter here."

# ---------- 5. Match files by pattern ----------
function Find-Match {
    param([string[]]$Patterns, [string]$Folder)
    $files = Get-ChildItem -Path $Folder -File -Recurse -ErrorAction SilentlyContinue |
             Where-Object { $_.Extension -in '.pak', '.zip' }
    foreach ($p in $Patterns) {
        $hit = $files | Where-Object { $_.Name -match $p } | Select-Object -First 1
        if ($hit) { return $hit.FullName }
    }
    return ''
}

$xp     = Find-Match @('XP.*Gold.*Soul', 'XP.*Mod', 'XPGoldSouls', 'XP-Gold-Souls') $DropFolder
$bwt    = Find-Match @('Better.*Wandering', 'Wandering.*Trader', 'BetterWanderingTraders') $DropFolder
$pickup = Find-Match @('WhitePrimary', 'Pickup.*Glow', 'PrimaryPickup') $DropFolder

$missing = @()
if (-not $xp)     { $missing += 'XP-Gold-Souls' }
if (-not $bwt)    { $missing += 'Better-Wandering-Traders' }
if (-not $pickup) { $missing += 'Pickup-Glow' }

if ($missing.Count -gt 0) {
    Say "Missing in drop folder: $($missing -join ', ')" 'Red'
    Say "Found files:" 'Yellow'
    Get-ChildItem $DropFolder -File -Recurse | ForEach-Object { Write-Host "  $($_.FullName)" }
    Read-Host "Press Enter to close, then add the missing files and re-run"
    exit 1
}

Say "Matched: XP=$xp" 'Green'
Say "Matched: BWT=$bwt" 'Green'
Say "Matched: Pickup=$pickup" 'Green'

# ---------- 6. Run turnkey ----------
Say "Installing modpack..."
$tkParams = @{
    GameRoot                       = $gameRoot
    XpGoldSoulsPakPath             = $xp
    BetterWanderingTradersPakPath  = $bwt
    PickupGlowPakPath              = $pickup
    FreshStart                     = $true
}
if (-not $NoLaunch) { $tkParams.LaunchGame = $true }

& $turnkey @tkParams

# ---------- 7. Verify ----------
Write-Host ""
Say "Verifying install..." 'Cyan'
$state = "$env:LOCALAPPDATA\FarFarWest\Saved\ModHelper\last-turnkey-state.json"
if (-not (Test-Path $state)) {
    Say "No turnkey state file. Install may have failed." 'Red'
} else {
    $s = Get-Content $state -Raw | ConvertFrom-Json
    $paths = @($s.installedPakFiles) + @($s.installedScriptMods)
    $allOk = $true
    foreach ($p in $paths) {
        $exists = Test-Path $p
        $tag = if ($exists) { 'OK ' } else { 'MISS' }
        $color = if ($exists) { 'Green' } else { 'Red' }
        Write-Host "  [$tag] $p" -ForegroundColor $color
        if (-not $exists) { $allOk = $false }
    }
    if ($allOk) {
        Say "PASS - All mod files installed." 'Green'
    } else {
        Say "FAIL - Some files missing. See list above." 'Red'
    }
}

Write-Host ""
Say "Done. If multiplayer with friends, host a private lobby." 'Cyan'
Read-Host "Press Enter to close"
