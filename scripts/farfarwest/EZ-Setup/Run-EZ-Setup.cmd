@echo off
setlocal

echo Far Far West EZ-Setup
echo Running PowerShell launcher...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Run-EZ-Setup.ps1"
set EXITCODE=%ERRORLEVEL%

if not "%EXITCODE%"=="0" (
  echo.
  echo Setup failed with exit code %EXITCODE%.
  echo Try right-clicking this file and choosing "Run as administrator".
)

echo.
pause
exit /b %EXITCODE%