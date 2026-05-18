param(
    [string]$XpGoldSoulsPakPath = '',

    [string]$BetterWanderingTradersPakPath = '',

    [string]$PickupGlowPakPath = '',

    [string]$GameRoot = '',

    [switch]$FreshStart,

    [switch]$SkipLocalQoLMods,

    [switch]$LaunchGame
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

        New-Item -ItemType Directory -Path $DestinationRoot -Force | Out-Null
        $destination = Join-Path $DestinationRoot $name
        if (Test-Path $destination) {
            Remove-Item $destination -Recurse -Force
        }
        Copy-Item $source -Destination $DestinationRoot -Recurse -Force
        $installed += $destination
    }

    return $installed
}

function Ensure-ExtractedZip {
    param(
        [string]$ZipPath,
        [string]$ExtractRoot
    )

    if (-not $ZipPath -or -not (Test-Path $ZipPath)) {
        return ''
    }
    if ([IO.Path]::GetExtension($ZipPath).ToLowerInvariant() -ne '.zip') {
        return ''
    }

    New-Item -ItemType Directory -Path $ExtractRoot -Force | Out-Null
    $destination = Join-Path $ExtractRoot ([IO.Path]::GetFileNameWithoutExtension($ZipPath))
    if (-not (Test-Path $destination)) {
        Expand-Archive -Path $ZipPath -DestinationPath $destination -Force
    }

    return $destination
}

function Test-Ue4ssModDirectory {
    param([string]$Path)

    if (-not (Test-Path $Path -PathType Container)) {
        return $false
    }

    $enabled = Test-Path (Join-Path $Path 'enabled.txt')
    $luaMain = Test-Path (Join-Path $Path 'Scripts\main.lua')
    $dllMain = Test-Path (Join-Path $Path 'dlls\main.dll')

    return $enabled -and ($luaMain -or $dllMain)
}

function Get-ScanRoots {
    param(
        [string[]]$HintPaths,
        [string]$ExtractRoot
    )

    $roots = @(
        $ExtractRoot,
        'C:\mods',
        (Join-Path $env:USERPROFILE 'Downloads'),
        (Join-Path $env:USERPROFILE 'Desktop')
    )

    foreach ($hint in $HintPaths) {
        if (-not $hint) {
            continue
        }

        if (Test-Path $hint -PathType Container) {
            $roots += (Resolve-Path $hint).Path
            continue
        }

        if (Test-Path $hint -PathType Leaf) {
            $roots += (Split-Path -Parent (Resolve-Path $hint).Path)
            continue
        }

        $parent = Split-Path -Parent $hint
        if ($parent -and (Test-Path $parent)) {
            $roots += (Resolve-Path $parent).Path
        }
    }

    return @($roots | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique)
}

function Find-ScriptModDirectory {
    param(
        [string]$ModName,
        [string]$HintPath,
        [string[]]$ScanRoots,
        [string]$ExtractRoot
    )

    $localRoots = @($ScanRoots)

    if ($HintPath -and (Test-Path $HintPath -PathType Container) -and (Test-Ue4ssModDirectory -Path $HintPath)) {
        return (Resolve-Path $HintPath).Path
    }

    if ($HintPath -and (Test-Path $HintPath -PathType Leaf)) {
        $resolvedHint = (Resolve-Path $HintPath).Path
        if ([IO.Path]::GetExtension($resolvedHint).ToLowerInvariant() -eq '.zip') {
            $expanded = Ensure-ExtractedZip -ZipPath $resolvedHint -ExtractRoot $ExtractRoot
            if ($expanded) {
                $localRoots += $expanded
            }
        }
    }

    foreach ($root in @($localRoots | Select-Object -Unique)) {
        $direct = Join-Path $root $ModName
        if (Test-Ue4ssModDirectory -Path $direct) {
            return (Resolve-Path $direct).Path
        }

        $match = Get-ChildItem $root -Recurse -Directory -ErrorAction SilentlyContinue | Where-Object {
            $_.Name -eq $ModName -and (Test-Ue4ssModDirectory -Path $_.FullName)
        } | Select-Object -First 1
        if ($match) {
            return $match.FullName
        }
    }

    return ''
}

function Find-PakFile {
    param(
        [string]$HintPath,
        [string[]]$Patterns,
        [string[]]$ScanRoots,
        [string]$ExtractRoot
    )

    $localRoots = @($ScanRoots)

    if ($HintPath -and (Test-Path $HintPath -PathType Leaf)) {
        $resolvedHint = (Resolve-Path $HintPath).Path
        if ([IO.Path]::GetExtension($resolvedHint).ToLowerInvariant() -eq '.pak') {
            return $resolvedHint
        }

        if ([IO.Path]::GetExtension($resolvedHint).ToLowerInvariant() -eq '.zip') {
            $expanded = Ensure-ExtractedZip -ZipPath $resolvedHint -ExtractRoot $ExtractRoot
            if ($expanded) {
                $localRoots += $expanded
            }
        }
    }

    foreach ($root in @($localRoots | Select-Object -Unique)) {
        $files = Get-ChildItem $root -Recurse -File -Filter '*.pak' -ErrorAction SilentlyContinue
        foreach ($pattern in $Patterns) {
            $match = $files | Where-Object { $_.Name -match $pattern -or $_.FullName -match $pattern } | Select-Object -First 1
            if ($match) {
                return $match.FullName
            }
        }
    }

    return ''
}

function Install-CommunityScriptMod {
    param(
        [string]$SourcePath,
        [string]$DestinationRoot
    )

    $resolvedSource = (Resolve-Path $SourcePath -ErrorAction Stop).Path
    $name = [IO.Path]::GetFileName($resolvedSource)
    $destination = Join-Path $DestinationRoot $name

    New-Item -ItemType Directory -Path $DestinationRoot -Force | Out-Null
    if (Test-Path $destination) {
        Remove-Item $destination -Recurse -Force
    }

    Copy-Item $resolvedSource -Destination $DestinationRoot -Recurse -Force
    return $destination
}

function Add-PakSetToState {
    param(
        [string]$PakPath,
        [string]$ModsPath,
        [string[]]$Current
    )

    $next = @($Current)
    $base = [IO.Path]::GetFileNameWithoutExtension($PakPath)
    foreach ($ext in @('.pak', '.ucas', '.utoc')) {
        $candidate = Join-Path $ModsPath "$base$ext"
        if ((Test-Path $candidate) -and ($next -notcontains $candidate)) {
            $next += $candidate
        }
    }

    return $next
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$installScript = Join-Path $scriptRoot 'install-rebalance-mod.ps1'
if (-not (Test-Path $installScript)) {
    throw "Missing dependency script: $installScript"
}

$resolvedGameRoot = Resolve-GameRoot -ExplicitPath $GameRoot
$ue4ssModsPath = Join-Path $resolvedGameRoot 'FarFarWest\Binaries\Win64\ue4ss\Mods'
$modsPath = Join-Path $resolvedGameRoot 'FarFarWest\Content\Paks\~mods'
$templatesRoot = Join-Path $scriptRoot 'mod-dev\templates'
$extractRoot = 'C:\mods\_extracted'
$scanRoots = Get-ScanRoots -HintPaths @($XpGoldSoulsPakPath, $BetterWanderingTradersPakPath, $PickupGlowPakPath) -ExtractRoot $extractRoot
$saveRoot = Join-Path $env:LOCALAPPDATA 'FarFarWest\Saved\SaveGames'
$modStateRoot = Join-Path $env:LOCALAPPDATA 'FarFarWest\Saved\ModHelper'
$stateFile = Join-Path $modStateRoot 'last-turnkey-state.json'
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'

if (-not (Test-Path $saveRoot)) {
    throw "SaveGames folder not found at $saveRoot"
}
if (-not (Test-Path $modStateRoot)) {
    New-Item -ItemType Directory -Path $modStateRoot | Out-Null
}

$saveBackupPath = Join-Path $saveRoot "backup_turnkey_$stamp"
New-Item -ItemType Directory -Path $saveBackupPath | Out-Null
Get-ChildItem $saveRoot -File | Copy-Item -Destination $saveBackupPath

$freshArchivePath = ''
if ($FreshStart) {
    $freshArchivePath = Join-Path $saveRoot "archived_runstate_$stamp"
    New-Item -ItemType Directory -Path $freshArchivePath | Out-Null

    $runStatePatterns = @('*.save', 'backup_*.sav')
    foreach ($pattern in $runStatePatterns) {
        Get-ChildItem $saveRoot -File -Filter $pattern -ErrorAction SilentlyContinue | Move-Item -Destination $freshArchivePath -Force
    }
}

$installedScriptMods = @()
$installedPakFiles = @()

$xpScriptSource = Find-ScriptModDirectory -ModName 'XPMod' -HintPath $XpGoldSoulsPakPath -ScanRoots $scanRoots -ExtractRoot $extractRoot
if ($xpScriptSource) {
    $installedScriptMods += Install-CommunityScriptMod -SourcePath $xpScriptSource -DestinationRoot $ue4ssModsPath
}
else {
    $xpPakPath = Find-PakFile -HintPath $XpGoldSoulsPakPath -Patterns @('XP.*\.pak$', 'Gold.*\.pak$', 'Soul.*\.pak$') -ScanRoots $scanRoots -ExtractRoot $extractRoot
    if (-not $xpPakPath) {
        throw 'Could not find XP-Gold-Souls source. Pass -XpGoldSoulsPakPath to a .pak, .zip, or XPMod folder.'
    }
    & $installScript -ModPakPath $xpPakPath -GameRoot $resolvedGameRoot -NoSaveBackup
    $installedPakFiles = Add-PakSetToState -PakPath $xpPakPath -ModsPath $modsPath -Current $installedPakFiles
}

$bwtScriptSource = Find-ScriptModDirectory -ModName 'BetterWanderingTraders' -HintPath $BetterWanderingTradersPakPath -ScanRoots $scanRoots -ExtractRoot $extractRoot
if ($bwtScriptSource) {
    $installedScriptMods += Install-CommunityScriptMod -SourcePath $bwtScriptSource -DestinationRoot $ue4ssModsPath
}
else {
    $bwtPakPath = Find-PakFile -HintPath $BetterWanderingTradersPakPath -Patterns @('Better.*Wandering.*Trader.*\.pak$', 'Wandering.*Trader.*\.pak$', 'Trader.*\.pak$') -ScanRoots $scanRoots -ExtractRoot $extractRoot
    if (-not $bwtPakPath) {
        throw 'Could not find Better Wandering Traders source. Pass -BetterWanderingTradersPakPath to a .pak, .zip, or BetterWanderingTraders folder.'
    }
    & $installScript -ModPakPath $bwtPakPath -GameRoot $resolvedGameRoot -NoSaveBackup
    $installedPakFiles = Add-PakSetToState -PakPath $bwtPakPath -ModsPath $modsPath -Current $installedPakFiles
}

$pickupPakPath = Find-PakFile -HintPath $PickupGlowPakPath -Patterns @('WhitePrimary.*\.pak$', 'Pickup.*\.pak$', 'Glow.*\.pak$') -ScanRoots $scanRoots -ExtractRoot $extractRoot
if (-not $pickupPakPath) {
    throw 'Could not find Pickup Glow .pak source. Pass -PickupGlowPakPath to a .pak or .zip containing the WhitePrimaryPickup files.'
}
& $installScript -ModPakPath $pickupPakPath -GameRoot $resolvedGameRoot -NoSaveBackup
$installedPakFiles = Add-PakSetToState -PakPath $pickupPakPath -ModsPath $modsPath -Current $installedPakFiles

if (-not $SkipLocalQoLMods) {
    $installedScriptMods += Install-LocalScriptModTemplates -TemplatesRoot $templatesRoot -DestinationRoot $ue4ssModsPath -Names @('GoldSandbox', 'AutoPickup')
}

$installedModPaks = @($installedPakFiles | ForEach-Object { [IO.Path]::GetFileName($_) })

$state = [pscustomobject]@{
    timestamp = $stamp
    gameRoot = $resolvedGameRoot
    saveRoot = $saveRoot
    saveBackupPath = $saveBackupPath
    freshStart = [bool]$FreshStart
    freshArchivePath = $freshArchivePath
    installedPakFiles = $installedPakFiles
    installedModPaks = $installedModPaks
    installedScriptMods = $installedScriptMods
}
$state | ConvertTo-Json -Depth 4 | Set-Content -Path $stateFile -Encoding UTF8

Write-Output "Turnkey setup complete."
Write-Output "Game root: $resolvedGameRoot"
Write-Output "Save backup: $saveBackupPath"
if ($freshArchivePath) {
    Write-Output "Fresh start archive: $freshArchivePath"
}
Write-Output "Installed pak files: $($installedModPaks -join ', ')"
if ($installedScriptMods.Count -gt 0) {
    $scriptNames = @($installedScriptMods | ForEach-Object { [IO.Path]::GetFileName([string]$_) })
    Write-Output "Installed UE4SS script mods: $($scriptNames -join ', ')"
}
Write-Output "State file: $stateFile"
Write-Output 'Host a private lobby first. If your friend joins modded sessions, they should use the same gameplay-affecting mod versions.'

if ($LaunchGame) {
    Start-Process 'steam://run/3124540'
    Write-Output 'Launched Far Far West via Steam.'
}
