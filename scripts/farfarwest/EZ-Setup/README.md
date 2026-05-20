# Far Far West EZ-Setup

This folder is for friends/family who are not technical.

## Fastest Path (recommended)

1. Open PowerShell as Administrator.
2. Run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
$s = "$env:USERPROFILE\Desktop\One-Click-Setup.ps1"
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Just-Krispy/Return_Rover/main/scripts/farfarwest/EZ-Setup/One-Click-Setup.ps1' -OutFile $s -UseBasicParsing
& $s
```

This avoids Windows' default `running scripts is disabled` block for the current PowerShell window only.

## What It Does

1. Finds Far Far West automatically.
2. Downloads the latest setup tools from GitHub.
3. Creates and opens `C:\FFW-Mods`.
4. Waits for the 3 community mod `.pak` or `.zip` files to be dropped there.
5. Installs, launches, and verifies the modpack.

## Use This Folder Directly

If this repo is already downloaded locally, run one of these from this folder:

- Double-click `Run-EZ-Setup.cmd`
- Or in PowerShell:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\Run-EZ-Setup.ps1
```

## Before Running

1. Close Far Far West.
2. Have the 3 community mod files ready: XP-Gold-Souls, Better Wandering Traders, and White Primary Pickup Glow.
3. Do not place `Return_Rover-main` inside `ue4ss\Mods`.

## Optional: Custom Game Path

```powershell
PowerShell -ExecutionPolicy Bypass -File .\Run-EZ-Setup.ps1 -GameRoot 'D:\SteamLibrary\steamapps\common\FarFarWest'
```
