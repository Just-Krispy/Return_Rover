@echo off
setlocal
title Far Far West - Fix Mods

net session >nul 2>&1
if not "%errorlevel%"=="0" (
  echo Asking Windows for Administrator permission...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

cd /d "%~dp0"

echo Far Far West - Fix Mods
echo.
echo This will:
echo   1. Repair the UE4SS mods list (mods.txt)
echo   2. Turn on the UE4SS console window so you can see mods working
echo   3. Launch the game directly (bypassing the Steam wrapper)
echo.
echo Close Far Far West first if it is running, then press any key.
pause >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Fix-Mods.ps1"
set EXITCODE=%ERRORLEVEL%

if not "%EXITCODE%"=="0" (
  echo.
  echo Fix script stopped with exit code %EXITCODE%.
  echo Send Ryan a screenshot of this window.
)

exit /b %EXITCODE%
