@echo off
setlocal
title Far Far West - Diagnose Install

net session >nul 2>&1
if not "%errorlevel%"=="0" (
  echo Asking Windows for Administrator permission...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

cd /d "%~dp0"

set "REPORT=%USERPROFILE%\Desktop\FFW-Diagnostic.txt"

echo Far Far West - Diagnostic
echo.
echo This will check your install and save a report to your Desktop:
echo   %REPORT%
echo.
echo When it finishes the report opens in Notepad. Send that file
echo (or a screenshot of it) to Ryan.
echo.
pause

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Transcript -Path '%REPORT%' -Force | Out-Null } catch {}; try { & '%~dp0Diagnose-Install.ps1' } catch { Write-Host $_ -ForegroundColor Red }; try { Stop-Transcript | Out-Null } catch {}"

if exist "%REPORT%" (
  echo.
  echo Report saved: %REPORT%
  start "" notepad.exe "%REPORT%"
) else (
  echo.
  echo Report was not created. Send Ryan a screenshot of this window.
  pause
)

exit /b 0
