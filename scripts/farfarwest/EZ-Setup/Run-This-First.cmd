@echo off
setlocal
title Far Far West One-Click Setup

net session >nul 2>&1
if not "%errorlevel%"=="0" (
  echo Asking Windows for Administrator permission...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

cd /d "%~dp0"

if not exist "%~dp0Put-Mod-Files-Here" mkdir "%~dp0Put-Mod-Files-Here"

echo Far Far West One-Click Setup
echo.
echo A folder named Put-Mod-Files-Here is included next to this file.
echo Put the 3 Nexus mod .zip or .pak files in that folder if they are not already there.
echo.
echo Starting installer...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0One-Click-Setup.ps1" -DropFolder "%~dp0Put-Mod-Files-Here"
set EXITCODE=%ERRORLEVEL%

echo.
if not "%EXITCODE%"=="0" (
  echo Setup stopped with exit code %EXITCODE%.
  echo Send Ryan a screenshot of the first red error line.
) else (
  echo Setup finished.
)
echo.
pause
exit /b %EXITCODE%