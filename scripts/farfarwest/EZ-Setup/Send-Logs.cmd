@echo off
setlocal
title Far Far West - Send Logs to Ryan

net session >nul 2>&1
if not "%errorlevel%"=="0" (
  echo Asking Windows for Administrator permission...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

cd /d "%~dp0"

echo Far Far West - Send Logs to Ryan
echo.
echo BEFORE running this:
echo   1. Run Fix-Mods.cmd
echo   2. Let the game launch and sit at the main menu for 30 seconds
echo   3. Close the game
echo   4. THEN run this script
echo.
echo This will collect all the log files Ryan needs to diagnose the issue
echo and save them as a zip on your Desktop. Text or email the zip to Ryan.
echo.
pause

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Send-Logs.ps1"
set EXITCODE=%ERRORLEVEL%

if not "%EXITCODE%"=="0" (
  echo.
  echo Script failed with exit code %EXITCODE%.
  echo Send Ryan a screenshot of this window.
  pause
)

exit /b %EXITCODE%
