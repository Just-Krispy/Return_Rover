param(
    [switch]$RestoreLastBackup,

    [string]$StateFile = ''
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

    throw 'Could not find Far Far West install folder. Re-run with -StateFile and a valid gameRoot in that file.'
}

if (-not $StateFile) {
    $StateFile = Join-Path (Join-Path $env:LOCALAPPDATA 'FarFarWest\Saved\ModHelper') 'last-turnkey-state.json'
}
if (-not (Test-Path $StateFile)) {
    throw "State file not found: $StateFile"
}

$state = Get-Content $StateFile -Raw | ConvertFrom-Json
$gameRoot = if ($state.gameRoot) { $state.gameRoot } else { Resolve-GameRoot -ExplicitPath '' }
$modsPath = Join-Path $gameRoot 'FarFarWest\Content\Paks\~mods'
$ue4ssModsPath = Join-Path $gameRoot 'FarFarWest\Binaries\Win64\ue4ss\Mods'

if (Test-Path $modsPath) {
    foreach ($modPak in $state.installedModPaks) {
        $target = Join-Path $modsPath $modPak
        if (Test-Path $target) {
            Remove-Item $target -Force
            Write-Output "Removed: $target"
        }
    }
}

if ($state.installedScriptMods -and (Test-Path $ue4ssModsPath)) {
    foreach ($scriptMod in $state.installedScriptMods) {
        $name = [IO.Path]::GetFileName([string]$scriptMod)
        if (-not $name) { continue }
        $target = Join-Path $ue4ssModsPath $name
        if (Test-Path $target) {
            Remove-Item $target -Recurse -Force
            Write-Output "Removed UE4SS mod folder: $target"
        }
    }
}

if ($RestoreLastBackup) {
    $saveRoot = if ($state.saveRoot) { $state.saveRoot } else { Join-Path $env:LOCALAPPDATA 'FarFarWest\Saved\SaveGames' }
    $backupPath = $state.saveBackupPath

    if (-not (Test-Path $saveRoot)) {
        throw "Save root not found: $saveRoot"
    }
    if (-not (Test-Path $backupPath)) {
        throw "Saved backup path from state file is missing: $backupPath"
    }

    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $preRestore = Join-Path $saveRoot "backup_before_restore_$stamp"
    New-Item -ItemType Directory -Path $preRestore | Out-Null
    Get-ChildItem $saveRoot -File | Copy-Item -Destination $preRestore

    Get-ChildItem $backupPath -File | Copy-Item -Destination $saveRoot -Force

    Write-Output "Restored save files from: $backupPath"
    Write-Output "Pre-restore backup created: $preRestore"
}

Write-Output 'Revert complete. If you still crash, run Steam file verification and remove any leftover framework files manually.'
