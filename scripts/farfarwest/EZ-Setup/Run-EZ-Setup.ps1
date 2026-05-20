param(
    [string]$GameRoot = '',
    [string]$DropFolder = 'C:\FFW-Mods',
    [switch]$NoFreshStart,
    [switch]$NoLaunchGame,
    [switch]$SkipRepoDownload
)

$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "[EZ-Setup] $Message" -ForegroundColor Cyan
}

$localInstaller = Join-Path $PSScriptRoot 'One-Click-Setup.ps1'
$resolvedInstaller = ''

if (Test-Path $localInstaller) {
    $resolvedInstaller = (Resolve-Path $localInstaller).Path
    Write-Step "Using local one-click setup: $resolvedInstaller"
}
else {
    $tempInstaller = Join-Path $env:TEMP 'One-Click-Setup.ps1'
    $url = 'https://raw.githubusercontent.com/Just-Krispy/Return_Rover/main/scripts/farfarwest/EZ-Setup/One-Click-Setup.ps1'

    Write-Step 'Local one-click setup not found. Downloading latest from GitHub...'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $tempInstaller -UseBasicParsing
    $resolvedInstaller = $tempInstaller
}

$params = @{}
if ($GameRoot) { $params.GameRoot = $GameRoot }
if ($DropFolder) { $params.DropFolder = $DropFolder }
if ($NoLaunchGame) { $params.NoLaunch = $true }

if ($SkipRepoDownload) {
    Write-Step 'SkipRepoDownload is kept for old shortcuts and is ignored by One-Click-Setup.'
}

if ($NoFreshStart) {
    Write-Step 'NoFreshStart is kept for old shortcuts and is ignored by One-Click-Setup.'
}

& $resolvedInstaller @params