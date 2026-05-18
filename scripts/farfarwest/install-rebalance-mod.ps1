param(
    [Parameter(Mandatory = $true)]
    [string]$ModPakPath,

    [string]$GameRoot = '',

    [switch]$NoSaveBackup
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

$resolvedPak = Resolve-Path $ModPakPath -ErrorAction Stop
if ([IO.Path]::GetExtension($resolvedPak.Path) -ne '.pak') {
    throw 'Only .pak mods are supported by this installer.'
}

$gameRootPath = Resolve-GameRoot -ExplicitPath $GameRoot
$paksPath = Join-Path $gameRootPath 'FarFarWest\Content\Paks'
$modsPath = Join-Path $paksPath '~mods'

if (-not (Test-Path $paksPath)) {
    throw "Paks folder not found at $paksPath. Confirm this is a Far Far West install root."
}

if (-not (Test-Path $modsPath)) {
    New-Item -ItemType Directory -Path $modsPath | Out-Null
}

$saveRoot = Join-Path $env:LOCALAPPDATA 'FarFarWest\Saved\SaveGames'
$backupPath = ''
if ((-not $NoSaveBackup) -and (Test-Path $saveRoot)) {
    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backupPath = Join-Path $saveRoot "backup_pre_mod_$stamp"
    New-Item -ItemType Directory -Path $backupPath | Out-Null
    Get-ChildItem $saveRoot -File | Copy-Item -Destination $backupPath
}

$destination = Join-Path $modsPath ([IO.Path]::GetFileName($resolvedPak.Path))
$sourceBase = [IO.Path]::GetFileNameWithoutExtension($resolvedPak.Path)
$sourceDir = Split-Path -Parent $resolvedPak.Path

$installed = @()
foreach ($extension in @('.pak', '.ucas', '.utoc')) {
    $source = Join-Path $sourceDir "$sourceBase$extension"
    if (-not (Test-Path $source)) {
        continue
    }

    $target = Join-Path $modsPath ([IO.Path]::GetFileName($source))
    Copy-Item $source -Destination $target -Force
    $installed += $target
}

if ($installed.Count -eq 0) {
    throw "Failed to install any pak companion files for: $resolvedPak"
}

Write-Output "Installed: $($installed -join ', ')"
if ($backupPath) {
    Write-Output "Save backup: $backupPath"
}
Write-Output 'Next: launch Far Far West, test in solo/private session first, then keep only one progression mod active at a time.'
