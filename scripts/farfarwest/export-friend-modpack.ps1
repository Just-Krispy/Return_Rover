param(
    [string]$GameRoot = '',

    [string]$OutputRoot = '',

    [string[]]$ModPakNames = @(),

    [string[]]$ScriptModNames = @('XPMod', 'BetterWanderingTraders', 'GoldSandbox', 'AutoPickup'),

    [switch]$UseLastTurnkeyState,

    [switch]$Zip
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
        if (Test-Path $path) { return $path }
    }

    throw 'Could not find Far Far West install folder.'
}

$stateRoot = Join-Path $env:LOCALAPPDATA 'FarFarWest\Saved\ModHelper'
$completeStateFile = Join-Path $stateRoot 'last-complete-coop-state.json'
$turnkeyStateFile = Join-Path $stateRoot 'last-turnkey-state.json'
$state = $null
$stateFileUsed = ''

if ($UseLastTurnkeyState -and (Test-Path $turnkeyStateFile)) {
    $state = Get-Content $turnkeyStateFile -Raw | ConvertFrom-Json
    $stateFileUsed = $turnkeyStateFile
}
elseif (Test-Path $completeStateFile) {
    $state = Get-Content $completeStateFile -Raw | ConvertFrom-Json
    $stateFileUsed = $completeStateFile
}
elseif (Test-Path $turnkeyStateFile) {
    $state = Get-Content $turnkeyStateFile -Raw | ConvertFrom-Json
    $stateFileUsed = $turnkeyStateFile
}

if ($state -and (-not $GameRoot) -and $state.gameRoot) {
    $GameRoot = $state.gameRoot
}

$resolvedGameRoot = Resolve-GameRoot -ExplicitPath $GameRoot
$paksPath = Join-Path $resolvedGameRoot 'FarFarWest\Content\Paks\~mods'
$win64Path = Join-Path $resolvedGameRoot 'FarFarWest\Binaries\Win64'
$ue4ssModsPath = Join-Path $win64Path 'ue4ss\Mods'

if (-not $OutputRoot) {
    $OutputRoot = Join-Path ([Environment]::GetFolderPath('Desktop')) 'FarFarWest-Friend-Modpack'
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$packageRoot = Join-Path $OutputRoot "FarFarWest-Modpack-$stamp"
$packagePaks = Join-Path $packageRoot 'paks'
$packageScriptMods = Join-Path $packageRoot 'ue4ss-mods'
$packageFramework = Join-Path $packageRoot 'ue4ss-framework'
$packageScripts = Join-Path $packageRoot 'scripts'
foreach ($path in @($packagePaks, $packageScriptMods, $packageFramework, $packageScripts)) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
}

$copiedPakFiles = @()
if ($state -and $state.installedPakFiles) {
    foreach ($pakFile in $state.installedPakFiles) {
        if (Test-Path $pakFile) {
            Copy-Item $pakFile -Destination $packagePaks -Force
            $copiedPakFiles += [IO.Path]::GetFileName($pakFile)
        }
    }
}
else {
    if ($ModPakNames.Count -gt 0) {
        foreach ($modPakName in $ModPakNames) {
            $source = Join-Path $paksPath $modPakName
            if (Test-Path $source) {
                Copy-Item $source -Destination $packagePaks -Force
                $copiedPakFiles += [IO.Path]::GetFileName($source)
            }
        }
    }
    elseif (Test-Path $paksPath) {
        Get-ChildItem $paksPath -File -Include '*.pak','*.ucas','*.utoc' | ForEach-Object {
            Copy-Item $_.FullName -Destination $packagePaks -Force
            $copiedPakFiles += $_.Name
        }
    }
}

$copiedScriptMods = @()
$scriptModSources = @()
if ($state -and $state.installedScriptMods) {
    foreach ($scriptMod in $state.installedScriptMods) {
        if (Test-Path $scriptMod) {
            $scriptModSources += (Resolve-Path $scriptMod).Path
        }
    }
}

if (Test-Path $ue4ssModsPath) {
    foreach ($scriptMod in $ScriptModNames) {
        $source = Join-Path $ue4ssModsPath $scriptMod
        if (Test-Path $source) {
            $resolvedSource = (Resolve-Path $source).Path
            if ($scriptModSources -notcontains $resolvedSource) {
                $scriptModSources += $resolvedSource
            }
        }
    }
}

foreach ($scriptModSource in $scriptModSources) {
    Copy-Item $scriptModSource -Destination $packageScriptMods -Recurse -Force
    $copiedScriptMods += [IO.Path]::GetFileName($scriptModSource)
}

$frameworkFiles = @(
    'dwmapi.dll',
    'ue4ss\UE4SS-settings.ini',
    'ue4ss\UE4SS.dll'
)
$copiedFrameworkFiles = @()
foreach ($frameworkFile in $frameworkFiles) {
    $source = Join-Path $win64Path $frameworkFile
    if (Test-Path $source) {
        $relativeDirectory = Split-Path $frameworkFile -Parent
        $destinationDirectory = if ($relativeDirectory) { Join-Path $packageFramework $relativeDirectory } else { $packageFramework }
        New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
        Copy-Item $source -Destination $destinationDirectory -Force
        $copiedFrameworkFiles += $frameworkFile
    }
}

$friendInstaller = @'
param(
    [string]$GameRoot = ''
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
        if (Test-Path $path) { return $path }
    }

    throw 'Could not find Far Far West install folder. Re-run with -GameRoot "X:\SteamLibrary\steamapps\common\FarFarWest".'
}

$packageRoot = Split-Path -Parent $PSScriptRoot
$resolvedGameRoot = Resolve-GameRoot -ExplicitPath $GameRoot
$paksDestination = Join-Path $resolvedGameRoot 'FarFarWest\Content\Paks\~mods'
$win64Destination = Join-Path $resolvedGameRoot 'FarFarWest\Binaries\Win64'
$scriptModsDestination = Join-Path $win64Destination 'ue4ss\Mods'
$saveRoot = Join-Path $env:LOCALAPPDATA 'FarFarWest\Saved\SaveGames'

foreach ($path in @($paksDestination, $scriptModsDestination)) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
}

if (Test-Path $saveRoot) {
    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backupPath = Join-Path $saveRoot "backup_before_friend_modpack_$stamp"
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    Get-ChildItem $saveRoot -File | Copy-Item -Destination $backupPath
    Write-Output "Save backup: $backupPath"
}

$paksSource = Join-Path $packageRoot 'paks'
if (Test-Path $paksSource) {
    Get-ChildItem $paksSource -File | Copy-Item -Destination $paksDestination -Force
}

$frameworkSource = Join-Path $packageRoot 'ue4ss-framework'
if (Test-Path $frameworkSource) {
    Copy-Item (Join-Path $frameworkSource '*') -Destination $win64Destination -Recurse -Force
}

$scriptModsSource = Join-Path $packageRoot 'ue4ss-mods'
if (Test-Path $scriptModsSource) {
    Get-ChildItem $scriptModsSource -Directory | Copy-Item -Destination $scriptModsDestination -Recurse -Force
}

Write-Output 'Friend modpack installed. Launch Far Far West and join the same private/friend lobby.'
'@
$friendInstaller | Set-Content -Path (Join-Path $packageScripts 'install-friend-modpack.ps1') -Encoding UTF8

$readme = @"
# Far Far West Friend Modpack

This package mirrors the host's active Far Far West mod setup.

## Included Pak Files

$(($copiedPakFiles | ForEach-Object { "- $_" }) -join "`r`n")

## Included UE4SS Script Mods

$(($copiedScriptMods | ForEach-Object { "- $_" }) -join "`r`n")

## Included UE4SS Framework Files

$(($copiedFrameworkFiles | ForEach-Object { "- $_" }) -join "`r`n")

If the UE4SS framework list is empty, your friend must also download UE4SS for FarFarWest from Nexus mod 2.

## Install

1. Close Far Far West.
2. Extract this package somewhere easy, such as Desktop.
3. Open PowerShell in this package folder.
4. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-friend-modpack.ps1
```

If Steam is installed in a custom location:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-friend-modpack.ps1 -GameRoot "D:\SteamLibrary\steamapps\common\FarFarWest"
```

## Co-op Rules

- Use private/friend lobbies first.
- Keep the same gameplay-affecting mod versions on host and friend PCs.
- If the game crashes after a patch, remove the newest mod first or verify Steam files.
"@
$readme | Set-Content -Path (Join-Path $packageRoot 'README.md') -Encoding UTF8

$manifest = [pscustomobject]@{
    createdAt = (Get-Date).ToString('o')
    gameRoot = $resolvedGameRoot
    stateFileUsed = $stateFileUsed
    copiedPakFiles = $copiedPakFiles
    copiedScriptMods = $copiedScriptMods
    copiedFrameworkFiles = $copiedFrameworkFiles
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -Path (Join-Path $packageRoot 'manifest.json') -Encoding UTF8

Write-Output "Friend modpack exported: $packageRoot"
Write-Output "Pak files: $($copiedPakFiles -join ', ')"
Write-Output "Script mods: $($copiedScriptMods -join ', ')"
Write-Output "UE4SS framework files: $($copiedFrameworkFiles -join ', ')"

if ($Zip) {
    $zipPath = "$packageRoot.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path (Join-Path $packageRoot '*') -DestinationPath $zipPath -Force
    Write-Output "Zip created: $zipPath"
}
