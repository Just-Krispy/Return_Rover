# Far Far West EZ-Setup

This folder is for friends/family who are not technical.

## Fastest Path (recommended)

1. Open PowerShell as Administrator.
2. Run:

```powershell
$desktop = [Environment]::GetFolderPath('Desktop')
$script = Join-Path $desktop 'easy-desktop-brother-setup.ps1'
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Just-Krispy/Return_Rover/main/scripts/farfarwest/easy-desktop-brother-setup.ps1' -OutFile $script -UseBasicParsing
PowerShell -ExecutionPolicy Bypass -File $script
```

## Use This Folder Directly

If this repo is already downloaded locally, run one of these from this folder:

- Double-click `Run-EZ-Setup.cmd`
- Or in PowerShell:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\Run-EZ-Setup.ps1
```

## Before Running

1. Close Far Far West.
2. Keep mod files in `C:\mods`, Downloads, or Desktop.
3. Do not place `Return_Rover-main` inside `ue4ss\Mods`.

## Optional: Custom Game Path

```powershell
PowerShell -ExecutionPolicy Bypass -File .\Run-EZ-Setup.ps1 -GameRoot 'D:\SteamLibrary\steamapps\common\FarFarWest'
```
