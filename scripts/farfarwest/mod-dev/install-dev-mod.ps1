param(
    [Parameter(Mandatory = $true)]
    [string]$ModSource,

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
        if (Test-Path $path) {
            return $path
        }
    }

    throw 'Could not find Far Far West install folder. Re-run with -GameRoot "X:\\SteamLibrary\\steamapps\\common\\FarFarWest".'
}

$resolvedSource = Resolve-Path $ModSource -ErrorAction Stop
if (-not (Test-Path (Join-Path $resolvedSource.Path 'enabled.txt'))) {
    throw 'ModSource must contain enabled.txt'
}
if (-not (Test-Path (Join-Path $resolvedSource.Path 'Scripts\main.lua'))) {
    throw 'ModSource must contain Scripts\main.lua'
}

$gameRootPath = Resolve-GameRoot -ExplicitPath $GameRoot
$modsDestination = Join-Path $gameRootPath 'FarFarWest\Binaries\Win64\ue4ss\Mods'
New-Item -ItemType Directory -Path $modsDestination -Force | Out-Null

$destination = Join-Path $modsDestination ([IO.Path]::GetFileName($resolvedSource.Path))
if (Test-Path $destination) {
    Remove-Item $destination -Recurse -Force
}

Copy-Item $resolvedSource.Path -Destination $modsDestination -Recurse -Force
Write-Output "Installed dev mod: $destination"
Write-Output 'Requires UE4SS framework in FarFarWest\Binaries\Win64 to run.'
