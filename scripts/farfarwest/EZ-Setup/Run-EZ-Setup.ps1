param(
    [string]$GameRoot = '',
    [switch]$NoFreshStart,
    [switch]$NoLaunchGame,
    [switch]$SkipRepoDownload
)

$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "[EZ-Setup] $Message" -ForegroundColor Cyan
}

$localInstaller = Join-Path (Split-Path -Parent $PSScriptRoot) 'easy-desktop-brother-setup.ps1'
$resolvedInstaller = ''

if (Test-Path $localInstaller) {
    $resolvedInstaller = (Resolve-Path $localInstaller).Path
    Write-Step "Using local installer: $resolvedInstaller"
}
else {
    $tempInstaller = Join-Path $env:TEMP 'easy-desktop-brother-setup.ps1'
    $url = 'https://raw.githubusercontent.com/Just-Krispy/Return_Rover/main/scripts/farfarwest/easy-desktop-brother-setup.ps1'

    Write-Step 'Local installer not found. Downloading latest from GitHub...'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $tempInstaller -UseBasicParsing
    $resolvedInstaller = $tempInstaller
}

$params = @{}
if ($GameRoot) { $params.GameRoot = $GameRoot }
if ($NoFreshStart) { $params.FreshStart = $false }
if ($NoLaunchGame) { $params.LaunchGame = $false }
if ($SkipRepoDownload) { $params.SkipRepoDownload = $true }

& $resolvedInstaller @params