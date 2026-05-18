param(
    [Parameter(Mandatory = $true)]
    [string]$ModPakName,

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

$gameRootPath = Resolve-GameRoot -ExplicitPath $GameRoot
$modsPath = Join-Path $gameRootPath 'FarFarWest\Content\Paks\~mods'

if (-not (Test-Path $modsPath)) {
    throw "Mods folder not found at $modsPath"
}

$target = Join-Path $modsPath $ModPakName
if (-not (Test-Path $target)) {
    throw "Mod file not found: $target"
}

$base = [IO.Path]::GetFileNameWithoutExtension($target)
$removed = @()
foreach ($extension in @('.pak', '.ucas', '.utoc')) {
    $candidate = Join-Path $modsPath "$base$extension"
    if (Test-Path $candidate) {
        Remove-Item $candidate -Force
        $removed += $candidate
    }
}

if ($removed.Count -eq 0) {
    throw "No companion files removed for: $target"
}

Write-Output "Removed: $($removed -join ', ')"
Write-Output 'If the game still crashes, verify Steam files and remove any UE4SS dependencies from the game root.'
