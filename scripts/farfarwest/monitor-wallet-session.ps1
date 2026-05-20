param(
    [string]$GameRoot = '',
    [string]$ModSource = '',
    [int]$DurationSeconds = 0,
    [switch]$NoInstall,
    [switch]$NoLaunch,
    [switch]$UseShippingExe,
    [switch]$StopGameAtEnd,
    [switch]$KeepMonitorConfig
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

function Set-WalletMonitorConfig {
    param([string]$ConfigPath)

    $json = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json
    Set-JsonProperty -Json $json -Name 'enabled' -Value $true
    Set-JsonProperty -Json $json -Name 'scanIntervalMs' -Value 500
    Set-JsonProperty -Json $json -Name 'logEveryTicks' -Value 8
    Set-JsonProperty -Json $json -Name 'enableActionHooks' -Value $true
    Set-JsonProperty -Json $json -Name 'trackAllWalletEntries' -Value $true
    Set-JsonProperty -Json $json -Name 'logAllRuntimeEntriesOnce' -Value $true
    Set-JsonProperty -Json $json -Name 'maxHookRegisterAttempts' -Value 1200
    Set-JsonProperty -Json $json -Name 'maxLoggedChangesPerTick' -Value 64
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

function Get-WalletMonitorState {
    param([string]$SourceLog)

    if (-not (Test-Path $SourceLog)) {
        return [pscustomobject]@{
            HasLoaded = $false
            HasBaseline = $false
            LastWalletLine = ''
        }
    }

    $tail = Get-Content -Path $SourceLog -Tail 600
    $walletLines = @($tail | Where-Object { $_ -match '\[WalletMonitor\]' })

    return [pscustomobject]@{
        HasLoaded = ($walletLines | Where-Object { $_ -match '\[WalletMonitor\]\s+Loaded\.' }).Count -gt 0
        HasBaseline = ($walletLines | Where-Object { $_ -match 'Baseline wallets:' }).Count -gt 0
        LastWalletLine = if ($walletLines.Count -gt 0) { $walletLines[-1] } else { '' }
    }
}

function Wait-ForWalletMonitorReady {
    param(
        [string]$SourceLog,
        [int]$TimeoutSeconds = 90
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        $state = Get-WalletMonitorState -SourceLog $SourceLog
        if ($state.HasBaseline) {
            return [pscustomobject]@{
                Ready = $true
                HasLoaded = $true
                HasBaseline = $true
                LastWalletLine = $state.LastWalletLine
            }
        }

        if ($state.HasLoaded -and $TimeoutSeconds -le 10) {
            # Keep return shape stable if timeout is tiny and baseline cannot be awaited long.
            break
        }

        Wait-Event -Timeout 1 | Out-Null
    }

    $finalState = Get-WalletMonitorState -SourceLog $SourceLog
    return [pscustomobject]@{
        Ready = $finalState.HasBaseline
        HasLoaded = $finalState.HasLoaded
        HasBaseline = $finalState.HasBaseline
        LastWalletLine = $finalState.LastWalletLine
    }
}

function Write-MonitorSummary {
    param(
        [string]$SourceLog,
        [string]$SessionLog,
        [string]$SummaryPath,
        [string]$StartedExe,
        [string]$ConfigBackup
    )

    $lines = if (Test-Path $SourceLog) { Get-Content -Path $SourceLog } else { @() }
    if (Test-Path $SourceLog) {
        Copy-Item $SourceLog $SessionLog -Force
    }

    $walletLines = @($lines | Where-Object { $_ -match '\[WalletMonitor\]' })
    $baselineLines = @($walletLines | Where-Object { $_ -match 'Baseline wallets:' })
    $changeLines = @($walletLines | Where-Object { $_ -match 'Wallet change:' })
    $snapshotLines = @($walletLines | Where-Object { $_ -match 'Snapshot:' })
    $runtimeEntriesLines = @($walletLines | Where-Object { $_ -match 'Runtime inventory entries:' })
    $actionFiredLines = @($walletLines | Where-Object { $_ -match 'Action hook fired:' })
    $actionSettledLines = @($walletLines | Where-Object { $_ -match 'Action hook settled:' })
    $registeredHookLines = @($walletLines | Where-Object { $_ -match 'Registered action hook:' })
    $pendingLines = @($walletLines | Where-Object { $_ -match 'Waiting for wallet snapshot|snapshot unavailable|error|failed' })

    $xpConfigLines = @($lines | Where-Object { $_ -match 'Config:\s*heroXP=' })
    $xpRuntimeHookLines = @($lines | Where-Object { $_ -match 'XPMultiplierMod|XP Mod loaded' })

    $walletKeyRegex = [regex]'Wallet change:\s*([^\s]+)'
    $walletKeys = @(
        $changeLines |
            ForEach-Object {
                $matchResult = $walletKeyRegex.Match($_)
                if ($matchResult.Success) {
                    $matchResult.Groups[1].Value
                }
            } |
            Where-Object { $_ } |
            Sort-Object -Unique
    )

    $result = if ($changeLines.Count -gt 0) {
        'Captured wallet deltas during this session.'
    } elseif ($baselineLines.Count -gt 0) {
        'Captured wallet baseline but no changes were detected.'
    } elseif ($walletLines.Count -gt 0) {
        'WalletMonitor loaded but no baseline snapshot was captured.'
    } else {
        'No WalletMonitor output detected in UE4SS.log.'
    }

    $report = @(
        "Wallet Monitor Summary - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
        "Result: $result",
        "StartedExe: $StartedExe",
        "SessionLog: $SessionLog",
        "ConfigBackup: $ConfigBackup",
        '',
        "WalletMonitorLines: $($walletLines.Count)",
        "Baselines: $($baselineLines.Count)",
        "WalletChanges: $($changeLines.Count)",
        "PeriodicSnapshots: $($snapshotLines.Count)",
        "RuntimeEntryDumps: $($runtimeEntriesLines.Count)",
        "ActionHooksFired: $($actionFiredLines.Count)",
        "ActionHooksSettled: $($actionSettledLines.Count)",
        "ActionHooksRegistered: $($registeredHookLines.Count)",
        "WalletMonitorWarningsOrErrors: $($pendingLines.Count)",
        '',
        "WalletKeysChanged: $($walletKeys -join ', ')",
        "XPModConfigLines: $($xpConfigLines.Count)",
        "XPModRuntimeHookLines: $($xpRuntimeHookLines.Count)",
        ''
    )

    if ($baselineLines.Count -gt 0) {
        $report += 'Baseline sample:'
        $report += $baselineLines | Select-Object -Last 1
        $report += ''
    }

    if ($runtimeEntriesLines.Count -gt 0) {
        $report += 'Runtime inventory entries sample:'
        $report += $runtimeEntriesLines | Select-Object -Last 1
        $report += ''
    }

    $report += 'Last WalletMonitor lines:'
    $report += $walletLines | Select-Object -Last 80
    $report += ''

    $report += 'XP multiplier lines:'
    if ($xpConfigLines.Count -gt 0 -or $xpRuntimeHookLines.Count -gt 0) {
        $report += ($xpConfigLines + $xpRuntimeHookLines) | Select-Object -Last 20
    } else {
        $report += 'None captured.'
    }

    Write-Utf8NoBom -Path $SummaryPath -Content (($report -join [Environment]::NewLine) + [Environment]::NewLine)
    $report | ForEach-Object { Write-Output $_ }
}

if (-not $ModSource) {
    $ModSource = Join-Path $PSScriptRoot 'mod-dev\templates\WalletMonitor'
}

$gameRootPath = Resolve-GameRoot -ExplicitPath $GameRoot
$modsDestination = Join-Path $gameRootPath 'FarFarWest\Binaries\Win64\ue4ss\Mods'
$modDestination = Join-Path $modsDestination 'WalletMonitor'
$configPath = Join-Path $modDestination 'config\settings.json'
$ue4ssLog = Join-Path $gameRootPath 'FarFarWest\Binaries\Win64\ue4ss\UE4SS.log'
$reportDir = Join-Path $PSScriptRoot 'reports'
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$sessionLog = Join-Path $reportDir "wallet-monitor-$stamp.log"
$summaryPath = Join-Path $reportDir "wallet-monitor-$stamp.summary.txt"
$startedExe = '(not launched)'

New-Item -ItemType Directory -Path $reportDir -Force | Out-Null

if (-not $NoInstall) {
    $modDestination = Copy-ModSource -Source $ModSource -ModsDestination $modsDestination
    $configPath = Join-Path $modDestination 'config\settings.json'
    Write-Output "Installed WalletMonitor from: $ModSource"
}

if (-not (Test-Path $configPath)) {
    throw "WalletMonitor settings not found: $configPath"
}

$configBackup = "$configPath.wallet-monitor-$stamp.bak"
Copy-Item $configPath $configBackup -Force
Set-WalletMonitorConfig -ConfigPath $configPath
Write-Output "WalletMonitor config enabled: $configPath"

if (Test-Path $ue4ssLog) {
    Copy-Item $ue4ssLog "$ue4ssLog.before-wallet-monitor-$stamp" -Force
    Clear-Content $ue4ssLog
}

try {
    if (-not $NoLaunch) {
        $startedExe = Start-FarFarWest -Root $gameRootPath
        Write-Output "Launched: $startedExe"

        Write-Output 'Waiting for WalletMonitor to initialize (up to 90 seconds)...'
        $monitorState = Wait-ForWalletMonitorReady -SourceLog $ue4ssLog -TimeoutSeconds 90
        if ($monitorState.HasBaseline) {
            Write-Output 'WalletMonitor baseline captured. Safe to begin actions now.'
        } elseif ($monitorState.HasLoaded) {
            Write-Warning 'WalletMonitor loaded, but baseline is not captured yet. Actions may still be tracked via hook snapshots.'
            if ($monitorState.LastWalletLine) {
                Write-Output "Last WalletMonitor line: $($monitorState.LastWalletLine)"
            }
        } else {
            Write-Warning 'WalletMonitor did not appear in UE4SS.log during warm-up. Capture may be incomplete.'
        }
    }

    if ($DurationSeconds -gt 0) {
        Write-Output "Capturing WalletMonitor telemetry for $DurationSeconds seconds. Perform your actions now."
        Wait-Event -Timeout $DurationSeconds | Out-Null
    } else {
        Write-Output 'Perform your actions now, then press Enter here to stop capture and summarize.'
        Read-Host 'Press Enter when finished' | Out-Null
    }
}
finally {
    if (Test-Path $ue4ssLog) {
        Write-MonitorSummary -SourceLog $ue4ssLog -SessionLog $sessionLog -SummaryPath $summaryPath -StartedExe $startedExe -ConfigBackup $configBackup
        Write-Output "Summary written: $summaryPath"
    } else {
        Write-Output "UE4SS log was not found: $ue4ssLog"
    }

    if (-not $KeepMonitorConfig) {
        Copy-Item $configBackup $configPath -Force
        Write-Output 'WalletMonitor config restored to pre-test settings.'
    } else {
        Write-Output 'WalletMonitor debug config kept because -KeepMonitorConfig was used.'
    }

    if ($StopGameAtEnd) {
        Get-Process -Name 'FarFarWest', 'FarFarWest-Win64-Shipping' -ErrorAction SilentlyContinue | Stop-Process -Force
        Write-Output 'Far Far West process stopped.'
    }
}
