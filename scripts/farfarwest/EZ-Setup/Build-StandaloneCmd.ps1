param(
    [Parameter(Mandatory = $true)]
    [string]$Ps1Path,

    [Parameter(Mandatory = $true)]
    [string]$CmdOutPath,

    [Parameter(Mandatory = $true)]
    [string]$Title,

    [string]$Description = ''
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Ps1Path)) {
    throw "Source PS1 not found: $Ps1Path"
}

$bytes = [IO.File]::ReadAllBytes($Ps1Path)
$b64 = [Convert]::ToBase64String($bytes)

$chunkSize = 7000
$chunks = @()
for ($i = 0; $i -lt $b64.Length; $i += $chunkSize) {
    $end = [Math]::Min($i + $chunkSize, $b64.Length)
    $chunks += $b64.Substring($i, $end - $i)
}

$sb = New-Object System.Text.StringBuilder
$null = $sb.AppendLine('@echo off')
$null = $sb.AppendLine('setlocal EnableExtensions')
$null = $sb.AppendLine("title $Title")
$null = $sb.AppendLine('')
$null = $sb.AppendLine('net session >nul 2>&1')
$null = $sb.AppendLine('if not "%errorlevel%"=="0" (')
$null = $sb.AppendLine('  echo Asking Windows for Administrator permission...')
$null = $sb.AppendLine('  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath ''%~f0'' -Verb RunAs"')
$null = $sb.AppendLine('  exit /b')
$null = $sb.AppendLine(')')
$null = $sb.AppendLine('')
$null = $sb.AppendLine("echo $Title")
if ($Description) {
    $null = $sb.AppendLine('echo.')
    foreach ($line in ($Description -split "`n")) {
        $clean = $line.TrimEnd("`r")
        if ([string]::IsNullOrWhiteSpace($clean)) {
            $null = $sb.AppendLine('echo.')
        } else {
            $null = $sb.AppendLine("echo $clean")
        }
    }
}
$null = $sb.AppendLine('echo.')
$null = $sb.AppendLine('pause')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('set "B64="')
foreach ($chunk in $chunks) {
    $null = $sb.AppendLine("set ""B64=%B64%$chunk""")
}
$null = $sb.AppendLine('')
$null = $sb.AppendLine('set "PSFILE=%TEMP%\ffw-tool-%RANDOM%-%RANDOM%.ps1"')
$null = $sb.AppendLine('powershell -NoProfile -ExecutionPolicy Bypass -Command "[IO.File]::WriteAllBytes($env:PSFILE, [Convert]::FromBase64String($env:B64))"')
$null = $sb.AppendLine('if not exist "%PSFILE%" (')
$null = $sb.AppendLine('  echo Failed to write embedded script. Aborting.')
$null = $sb.AppendLine('  pause')
$null = $sb.AppendLine('  exit /b 1')
$null = $sb.AppendLine(')')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('powershell -NoProfile -ExecutionPolicy Bypass -File "%PSFILE%"')
$null = $sb.AppendLine('set "EXITCODE=%ERRORLEVEL%"')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('del "%PSFILE%" >nul 2>&1')
$null = $sb.AppendLine('')
$null = $sb.AppendLine('exit /b %EXITCODE%')

[IO.File]::WriteAllText($CmdOutPath, $sb.ToString(), (New-Object System.Text.UTF8Encoding $false))

$resultBytes = (Get-Item $CmdOutPath).Length
Write-Host "Built $CmdOutPath ($resultBytes bytes) from $Ps1Path ($($bytes.Length) bytes, $($chunks.Count) base64 chunks)"
