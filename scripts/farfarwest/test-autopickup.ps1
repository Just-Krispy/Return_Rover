param(
    [string]$GameRoot = '',
    [string]$ModSource = '',
    [int]$DurationSeconds = 0,
    [switch]$NoInstall,
    [switch]$NoLaunch,
    [switch]$UseShippingExe,
    [switch]$StopGameAtEnd,
    [switch]$KeepDebugConfig,
    [int]$PickupRadius = 450,
    [int]$MaxCandidatesPerTick = 16,
    [int]$CandidateLogLimit = 250,
    [int]$NearbyDiscoveryLogLimit = 250,
    [int]$DebugSummaryEveryTicks = 20
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

    throw 'Could not find Far Far West install folder. Re-run with -GameRoot "X:\SteamLibrary\steamapps\common\FarFarWest".'
}

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $encoding = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Set-JsonProperty {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Json,
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        $Value
    )

    if ($Json.PSObject.Properties.Match($Name).Count -gt 0) {
        $Json.$Name = $Value
    } else {
        Add-Member -InputObject $Json -NotePropertyName $Name -NotePropertyValue $Value
    }
}

function Set-AutoPickupValidationConfig {
    param([string]$ConfigPath)

    $json = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json
    Set-JsonProperty -Json $json -Name 'enabled' -Value $true
    Set-JsonProperty -Json $json -Name 'autoPickup' -Value $true
    Set-JsonProperty -Json $json -Name 'pickupRadius' -Value $PickupRadius
    Set-JsonProperty -Json $json -Name 'scanAllLoadedLevels' -Value $true
    Set-JsonProperty -Json $json -Name 'trackConstructedActors' -Value $true
    Set-JsonProperty -Json $json -Name 'maxLevelsPerTick' -Value 12
    Set-JsonProperty -Json $json -Name 'maxActorsPerTick' -Value 450
    Set-JsonProperty -Json $json -Name 'maxTrackedActors' -Value 240
    Set-JsonProperty -Json $json -Name 'maxCandidatesPerTick' -Value $MaxCandidatesPerTick
    Set-JsonProperty -Json $json -Name 'candidateLogLimit' -Value $CandidateLogLimit
    Set-JsonProperty -Json $json -Name 'nearbyDiscoveryLogLimit' -Value $NearbyDiscoveryLogLimit
    Set-JsonProperty -Json $json -Name 'debugSummaryEveryTicks' -Value $DebugSummaryEveryTicks
    Set-JsonProperty -Json $json -Name 'debug' -Value $true

    $content = ($json | ConvertTo-Json -Depth 10) + [Environment]::NewLine
    Write-Utf8NoBom -Path $ConfigPath -Content $content
}

function Copy-ModSource {
    param(
        [string]$Source,
        [string]$ModsDestination
    )

    $resolvedSource = Resolve-Path $Source -ErrorAction Stop
    if (-not (Test-Path (Join-Path $resolvedSource.Path 'enabled.txt'))) {
        throw 'ModSource must contain enabled.txt'
    }
    if (-not (Test-Path (Join-Path $resolvedSource.Path 'Scripts\main.lua'))) {
        throw 'ModSource must contain Scripts\main.lua'
    }

    New-Item -ItemType Directory -Path $ModsDestination -Force | Out-Null
    $destination = Join-Path $ModsDestination ([IO.Path]::GetFileName($resolvedSource.Path))
    if (Test-Path $destination) {
        Remove-Item $destination -Recurse -Force
    }
    Copy-Item $resolvedSource.Path -Destination $ModsDestination -Recurse -Force
    return $destination
}

function Start-FarFarWest {
    param([string]$Root)

    $launcher = Join-Path $Root 'FarFarWest.exe'
    $shipping = Join-Path $Root 'FarFarWest\Binaries\Win64\FarFarWest-Win64-Shipping.exe'
    $exe = if ($UseShippingExe -or -not (Test-Path $launcher)) { $shipping } else { $launcher }
    if (-not (Test-Path $exe)) {
        throw "Could not find game executable: $exe"
    }

    $workingDirectory = if ($exe -eq $shipping) { Split-Path -Parent $shipping } else { $Root }
    Start-Process -FilePath $exe -WorkingDirectory $workingDirectory | Out-Null
    return $exe
}

function Get-UniqueMatches {
    param(
        [string[]]$Lines,
        [string]$Pattern
    )

    $matches = New-Object System.Collections.Generic.List[string]
    foreach ($line in $Lines) {
        $match = [regex]::Match($line, $Pattern)
        if ($match.Success) {
            $value = $match.Groups[1].Value
            if ($value -and -not $matches.Contains($value)) {
                $matches.Add($value)
            }
        }
    }
    return $matches.ToArray()
}

function Write-ValidationSummary {
    param(
        [string]$SourceLog,
        [string]$SessionLog,
        [string]$SummaryPath,
        [string]$StartedExe,
        [string]$ConfigBackup
    )

    $lines = if (Test-Path $SourceLog) { Get-Content -Path $SourceLog } else { @() }
    Copy-Item $SourceLog $SessionLog -Force

    $autoLines = @($lines | Where-Object { $_ -match '\[AutoPickup\]|Mod ''AutoPickup''' })
    $discoveryLines = @($autoLines | Where-Object { $_ -match 'Discovery actor:' })
    $candidateLines = @($autoLines | Where-Object { $_ -match 'Candidate class:' })
    $attemptLines = @($autoLines | Where-Object { $_ -match 'Auto pickup attempt:' })
    $skippedLines = @($autoLines | Where-Object { $_ -match 'Auto pickup skipped:' })
    $summaryLines = @($autoLines | Where-Object { $_ -match 'Scan summary:' })
    $playerLines = @($autoLines | Where-Object { $_ -match 'Local player pawn detected:' })
    $autoErrors = @($lines | Where-Object { $_ -match 'AutoPickup.*(error|failed|traceback)|Mods\\AutoPickup|\[AutoPickup\].*unavailable' })

    $discoveryClasses = Get-UniqueMatches -Lines $discoveryLines -Pattern 'class=([^\s]+)'
    $candidateClasses = Get-UniqueMatches -Lines $candidateLines -Pattern 'Candidate class:\s*([^\s]+)'
    $attemptClasses = Get-UniqueMatches -Lines $attemptLines -Pattern 'Auto pickup attempt:\s*([^\s]+)'
    $attemptFunctions = Get-UniqueMatches -Lines $attemptLines -Pattern 'via\s+([^\s]+)'

    $result = if ($attemptLines.Count -gt 0) {
        'AutoPickup attempted one or more pickup calls.'
    } elseif ($candidateLines.Count -gt 0) {
        'AutoPickup found pickup candidates but did not record a successful call attempt.'
    } elseif ($discoveryLines.Count -gt 0) {
        'AutoPickup discovered pickup/resource-looking actors; filters or functions may need tuning.'
    } else {
        'No AutoPickup pickup actors were captured. Load a mission and pass near ammo/health during the capture window.'
    }

    $report = @(
        "AutoPickup Validation Summary - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
        "Result: $result",
        "StartedExe: $StartedExe",
        "SessionLog: $SessionLog",
        "ConfigBackup: $ConfigBackup",
        '',
        "AutoPickupLines: $($autoLines.Count)",
        "PlayerDetections: $($playerLines.Count)",
        "DiscoveryActors: $($discoveryLines.Count)",
        "CandidateClasses: $($candidateLines.Count)",
        "PickupAttempts: $($attemptLines.Count)",
        "SkippedAttempts: $($skippedLines.Count)",
        "AutoPickupErrors: $($autoErrors.Count)",
        '',
        "DiscoveryClasses: $($discoveryClasses -join ', ')",
        "CandidateClassNames: $($candidateClasses -join ', ')",
        "AttemptClassNames: $($attemptClasses -join ', ')",
        "AttemptFunctions: $($attemptFunctions -join ', ')",
        '',
        'Last AutoPickup lines:'
    )

    $report += $autoLines | Select-Object -Last 40
    $report += ''
    $report += 'AutoPickup errors:'
    if ($autoErrors.Count -gt 0) {
        $report += $autoErrors | Select-Object -Last 40
    } else {
        $report += 'None captured.'
    }

    Write-Utf8NoBom -Path $SummaryPath -Content (($report -join [Environment]::NewLine) + [Environment]::NewLine)
    $report | ForEach-Object { Write-Output $_ }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
if (-not $ModSource) {
    $ModSource = Join-Path $PSScriptRoot 'mod-dev\templates\AutoPickup'
}

$gameRootPath = Resolve-GameRoot -ExplicitPath $GameRoot
$modsDestination = Join-Path $gameRootPath 'FarFarWest\Binaries\Win64\ue4ss\Mods'
$modDestination = Join-Path $modsDestination 'AutoPickup'
$configPath = Join-Path $modDestination 'config\settings.json'
$ue4ssLog = Join-Path $gameRootPath 'FarFarWest\Binaries\Win64\ue4ss\UE4SS.log'
$reportDir = Join-Path $PSScriptRoot 'reports'
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$sessionLog = Join-Path $reportDir "autopickup-validation-$stamp.log"
$summaryPath = Join-Path $reportDir "autopickup-validation-$stamp.summary.txt"
$startedExe = '(not launched)'

New-Item -ItemType Directory -Path $reportDir -Force | Out-Null

if (-not $NoInstall) {
    $modDestination = Copy-ModSource -Source $ModSource -ModsDestination $modsDestination
    $configPath = Join-Path $modDestination 'config\settings.json'
    Write-Output "Installed AutoPickup from: $ModSource"
}

if (-not (Test-Path $configPath)) {
    throw "AutoPickup settings not found: $configPath"
}

$configBackup = "$configPath.autopickup-test-$stamp.bak"
Copy-Item $configPath $configBackup -Force
Set-AutoPickupValidationConfig -ConfigPath $configPath
Write-Output "Validation config enabled: $configPath"

if (Test-Path $ue4ssLog) {
    Copy-Item $ue4ssLog "$ue4ssLog.before-autopickup-test-$stamp" -Force
    Clear-Content $ue4ssLog
}

try {
    if (-not $NoLaunch) {
        $startedExe = Start-FarFarWest -Root $gameRootPath
        Write-Output "Launched: $startedExe"
    }

    if ($DurationSeconds -gt 0) {
        Write-Output "Capturing AutoPickup telemetry for $DurationSeconds seconds. Load a mission and pass near ammo/health pickups now."
        Wait-Event -Timeout $DurationSeconds | Out-Null
    } else {
        Write-Output 'Load a mission, pass near ammo/health pickups, then press Enter here to stop capture and summarize.'
        Read-Host 'Press Enter when finished' | Out-Null
    }
}
finally {
    if (Test-Path $ue4ssLog) {
        Write-ValidationSummary -SourceLog $ue4ssLog -SessionLog $sessionLog -SummaryPath $summaryPath -StartedExe $startedExe -ConfigBackup $configBackup
        Write-Output "Summary written: $summaryPath"
    } else {
        Write-Output "UE4SS log was not found: $ue4ssLog"
    }

    if (-not $KeepDebugConfig) {
        Copy-Item $configBackup $configPath -Force
        Write-Output 'AutoPickup config restored to pre-test settings.'
    } else {
        Write-Output 'AutoPickup debug config kept because -KeepDebugConfig was used.'
    }

    if ($StopGameAtEnd) {
        Get-Process -Name 'FarFarWest','FarFarWest-Win64-Shipping' -ErrorAction SilentlyContinue | Stop-Process -Force
        Write-Output 'Far Far West process stopped.'
    }
}