param(
    [string]$GameRoot = '',

    [string]$ModRoot = 'C:\mods',

    [switch]$OpenMissingPages,

    [switch]$FreshStart,

    [switch]$LaunchGame,

    [switch]$ExportFriendZip
)

$ErrorActionPreference = 'Stop'

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

function Expand-RelevantArchives {
    param(
        [string[]]$ScanRoots,
        [string]$ExtractRoot
    )

    $namePatterns = @('XP', 'Gold', 'Soul', 'Wandering', 'Trader', 'WhitePrimary', 'Pickup', 'Glow', 'UE4SS')
    $archives = foreach ($root in $ScanRoots) {
        Get-ChildItem $root -File -Filter '*.zip' -ErrorAction SilentlyContinue | Where-Object {
            $archiveName = $_.Name
            ($namePatterns | Where-Object { $archiveName -match $_ }).Count -gt 0
        }
    }

    foreach ($archive in $archives) {
        $target = Join-Path $ExtractRoot ([IO.Path]::GetFileNameWithoutExtension($archive.Name))
        if (-not (Test-Path $target)) {
            Expand-Archive -Path $archive.FullName -DestinationPath $target -Force
            Write-Output "Extracted: $($archive.FullName)"
        }
    }
}

function Find-FirstDirectory {
    param(
        [string]$Root,
        [string]$DirectoryName
    )

    $match = Get-ChildItem $Root -Recurse -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq $DirectoryName } | Select-Object -First 1
    if ($match) {
        return $match.FullName
    }

    return ''
}

function Find-FirstFileByPattern {
    param(
        [string]$Root,
        [string[]]$Patterns,
        [string]$Extension = ''
    )

    $files = Get-ChildItem $Root -Recurse -File -ErrorAction SilentlyContinue
    if ($Extension) {
        $files = $files | Where-Object { $_.Extension -eq $Extension }
    }

    foreach ($pattern in $Patterns) {
        $match = $files | Where-Object { $_.Name -match $pattern -or $_.FullName -match $pattern } | Select-Object -First 1
        if ($match) {
            return $match.FullName
        }
    }

    return ''
}

function Test-UE4SSInstalled {
    param([string]$Win64Path)

    $markers = @(
        (Join-Path $Win64Path 'dwmapi.dll'),
        (Join-Path $Win64Path 'ue4ss\UE4SS.dll'),
        (Join-Path $Win64Path 'ue4ss\UE4SS-settings.ini')
    )

    return ($markers | Where-Object { Test-Path $_ }).Count -eq $markers.Count
}

function Install-UE4SSIfDownloaded {
    param(
        [string]$ExtractRoot,
        [string]$Win64Path
    )

    $ue4ssRoot = Get-ChildItem $ExtractRoot -Recurse -Directory -ErrorAction SilentlyContinue | Where-Object {
        (Test-Path (Join-Path $_.FullName 'dwmapi.dll')) -and
        (Test-Path (Join-Path $_.FullName 'ue4ss\UE4SS.dll')) -and
        (Test-Path (Join-Path $_.FullName 'ue4ss\UE4SS-settings.ini'))
    } | Select-Object -First 1

    if (-not $ue4ssRoot) {
        return $false
    }

    Copy-Item (Join-Path $ue4ssRoot.FullName '*') -Destination $Win64Path -Recurse -Force
    Write-Output "Installed UE4SS framework from: $($ue4ssRoot.FullName)"
    return $true
}

function Install-LocalScriptModTemplates {
    param(
        [string]$TemplatesRoot,
        [string]$DestinationRoot,
        [string[]]$Names
    )

    $installed = @()
    foreach ($name in $Names) {
        $source = Join-Path $TemplatesRoot $name
        if (-not (Test-Path $source)) {
            Write-Output "Skipping local script mod template; missing: $source"
            continue
        }

        if (-not (Test-Path (Join-Path $source 'enabled.txt'))) {
            throw "Local script mod template is missing enabled.txt: $source"
        }
        if (-not (Test-Path (Join-Path $source 'Scripts\main.lua'))) {
            throw "Local script mod template is missing Scripts\main.lua: $source"
        }

        $destination = Join-Path $DestinationRoot $name
        if (Test-Path $destination) {
            Remove-Item $destination -Recurse -Force
        }
        Copy-Item $source -Destination $DestinationRoot -Recurse -Force
        $installed += $destination
    }

    return $installed
}

$resolvedGameRoot = Resolve-GameRoot -ExplicitPath $GameRoot
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$templatesRoot = Join-Path $scriptRoot 'mod-dev\templates'
$paksPath = Join-Path $resolvedGameRoot 'FarFarWest\Content\Paks'
$modsPath = Join-Path $paksPath '~mods'
$win64Path = Join-Path $resolvedGameRoot 'FarFarWest\Binaries\Win64'
$ue4ssModsPath = Join-Path $win64Path 'ue4ss\Mods'
$saveRoot = Join-Path $env:LOCALAPPDATA 'FarFarWest\Saved\SaveGames'
$modHelperRoot = Join-Path $env:LOCALAPPDATA 'FarFarWest\Saved\ModHelper'
$stateFile = Join-Path $modHelperRoot 'last-complete-coop-state.json'
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'

foreach ($path in @($ModRoot, $modsPath, $ue4ssModsPath, $modHelperRoot)) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
}

$extractRoot = Join-Path $ModRoot '_extracted'
New-Item -ItemType Directory -Path $extractRoot -Force | Out-Null

$scanRoots = @(
    $ModRoot,
    (Join-Path $env:USERPROFILE 'Downloads'),
    (Join-Path $env:USERPROFILE 'Desktop')
) | Where-Object { Test-Path $_ } | Select-Object -Unique

Expand-RelevantArchives -ScanRoots $scanRoots -ExtractRoot $extractRoot

$xpModDir = Find-FirstDirectory -Root $extractRoot -DirectoryName 'XPMod'
$traderModDir = Find-FirstDirectory -Root $extractRoot -DirectoryName 'BetterWanderingTraders'
$pickupPak = Find-FirstFileByPattern -Root $extractRoot -Patterns @('WhitePrimary.*\.pak$', 'Pickup.*\.pak$', 'Glow.*\.pak$') -Extension '.pak'

$missing = @()
if (-not $xpModDir) { $missing += [pscustomobject]@{ Name = 'XP-Gold-Souls Multiplier'; Url = 'https://www.nexusmods.com/farfarwest/mods/14?tab=files' } }
if (-not $traderModDir) { $missing += [pscustomobject]@{ Name = 'Better Wandering Traders'; Url = 'https://www.nexusmods.com/farfarwest/mods/59?tab=files' } }
if (-not $pickupPak) { $missing += [pscustomobject]@{ Name = 'White Primary Ammo Pickup Glow'; Url = 'https://www.nexusmods.com/farfarwest/mods/13?tab=files' } }

if ($missing.Count -gt 0) {
    Write-Output 'Missing required downloaded mod content:'
    foreach ($item in $missing) {
        Write-Output "- $($item.Name): $($item.Url)"
        if ($OpenMissingPages) { Start-Process $item.Url }
    }
    exit 2
}

$saveBackupPath = ''
$freshArchivePath = ''
if (Test-Path $saveRoot) {
    $saveBackupPath = Join-Path $saveRoot "backup_complete_coop_$stamp"
    New-Item -ItemType Directory -Path $saveBackupPath -Force | Out-Null
    Get-ChildItem $saveRoot -File | Copy-Item -Destination $saveBackupPath
    Write-Output "Save backup: $saveBackupPath"

    if ($FreshStart) {
        $freshArchivePath = Join-Path $saveRoot "archived_runstate_$stamp"
        New-Item -ItemType Directory -Path $freshArchivePath -Force | Out-Null
        foreach ($pattern in @('*.save', 'backup_*.sav')) {
            Get-ChildItem $saveRoot -File -Filter $pattern -ErrorAction SilentlyContinue | Move-Item -Destination $freshArchivePath -Force
        }
        Write-Output "Fresh start archive: $freshArchivePath"
    }
}

$pickupBase = [IO.Path]::GetFileNameWithoutExtension($pickupPak)
$pickupRoot = Split-Path -Parent $pickupPak
$installedPakFiles = @()
foreach ($extension in @('.pak', '.ucas', '.utoc')) {
    $source = Join-Path $pickupRoot "$pickupBase$extension"
    if (Test-Path $source) {
        Copy-Item $source -Destination $modsPath -Force
        $installedPakFiles += (Join-Path $modsPath ([IO.Path]::GetFileName($source)))
    }
}
Write-Output "Installed Pickup Glow files: $($installedPakFiles -join ', ')"

$installedScriptMods = @()
foreach ($scriptModDir in @($xpModDir, $traderModDir)) {
    $destination = Join-Path $ue4ssModsPath ([IO.Path]::GetFileName($scriptModDir))
    if (Test-Path $destination) {
        Remove-Item $destination -Recurse -Force
    }
    Copy-Item $scriptModDir -Destination $ue4ssModsPath -Recurse -Force
    $installedScriptMods += $destination
}

$installedLocalScriptMods = Install-LocalScriptModTemplates -TemplatesRoot $templatesRoot -DestinationRoot $ue4ssModsPath -Names @('GoldSandbox', 'AutoPickup')
$installedScriptMods += $installedLocalScriptMods
Write-Output "Installed UE4SS mod folders: $($installedScriptMods -join ', ')"

$ue4ssInstalled = Test-UE4SSInstalled -Win64Path $win64Path
if (-not $ue4ssInstalled) {
    $ue4ssInstalled = Install-UE4SSIfDownloaded -ExtractRoot $extractRoot -Win64Path $win64Path
}

$state = [pscustomobject]@{
    timestamp = $stamp
    gameRoot = $resolvedGameRoot
    saveRoot = $saveRoot
    saveBackupPath = $saveBackupPath
    freshArchivePath = $freshArchivePath
    paksPath = $modsPath
    win64Path = $win64Path
    ue4ssModsPath = $ue4ssModsPath
    installedPakFiles = $installedPakFiles
    installedScriptMods = $installedScriptMods
    ue4ssInstalled = [bool]$ue4ssInstalled
}
$state | ConvertTo-Json -Depth 5 | Set-Content -Path $stateFile -Encoding UTF8
Write-Output "State file: $stateFile"

if (-not $ue4ssInstalled) {
    Write-Output ''
    Write-Output 'UE4SS framework is still missing. XPMod and BetterWanderingTraders are staged, but they will not run until UE4SS is installed.'
    Write-Output 'Download UE4SS for FarFarWest from: https://www.nexusmods.com/farfarwest/mods/2?tab=files'
    if ($OpenMissingPages) { Start-Process 'https://www.nexusmods.com/farfarwest/mods/2?tab=files' }
    Write-Output 'After downloading UE4SS, rerun this command:'
    Write-Output 'powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\complete-coop-setup.ps1 -OpenMissingPages -FreshStart -LaunchGame -ExportFriendZip'
    exit 3
}

if ($ExportFriendZip) {
    $exportScript = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'export-friend-modpack.ps1'
    if (Test-Path $exportScript) {
        & $exportScript -Zip
    }
}

if ($LaunchGame) {
    Start-Process 'steam://run/3124540'
    Write-Output 'Launched Far Far West via Steam.'
}

Write-Output 'Complete co-op setup finished.'
