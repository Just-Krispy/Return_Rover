# Far Far West Mod Helper (Single-Player Safe Workflow)

This folder provides helper scripts for installing, exporting, testing, and reverting a private-session Far Far West modpack.

## What Was Verified Locally

- Game app id: `3124540`
- Install folder detected: `E:\SteamLibrary\steamapps\common\FarFarWest`
- Save folder detected: `%LOCALAPPDATA%\FarFarWest\Saved\SaveGames`
- Unreal pak structure detected: `FarFarWest\Content\Paks`
- Steam app details currently do **not** expose a Steam Workshop category.

## Recommended Rebalance Approach

Use one community progression rebalance mod at a time (XP/Gold/Souls style), in solo/private sessions first.

The current GitHub-hosted helper stack also includes local UE4SS templates:

- `GoldSandbox` keeps the runtime and menu/shop GOLD wallets near the configured target.
- `AutoPickup` tracks mission-loaded ammo/health actors and attempts nearby pickup interactions without a keybind.

`ProgressProbe` exists for discovery only and is intentionally not installed by the normal friend modpack flow.

## Install A Rebalance .pak

1. Download a legit Far Far West progression/rebalance `.pak` from a trusted mod page.
2. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\install-rebalance-mod.ps1 -ModPakPath "C:\path\to\YourRebalanceMod.pak"
```

What this does:
- Creates `FarFarWest\Content\Paks\~mods` if needed
- Backs up your save files to a timestamped folder
- Copies the `.pak` plus matching `.ucas`/`.utoc` companion files into `~mods` when present

## Remove A Mod

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\remove-rebalance-mod.ps1 -ModPakName "YourRebalanceMod.pak"
```

## Turnkey Co-op Setup (All In One)

Use this when you want a fresh modded run quickly.

If you want the most automated path, use the complete setup script. It scans `C:\mods`, Downloads, and Desktop for `.pak` files or `.zip` archives, extracts zips, installs the detected mod stack, exports a friend zip, and opens any missing Nexus pages.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\complete-coop-setup.ps1 -OpenMissingPages -FreshStart -LaunchGame -ExportFriendZip
```

Required mod pages:
- XP-Gold-Souls Multiplier: https://www.nexusmods.com/farfarwest/mods/14
- Better Wandering Traders: https://www.nexusmods.com/farfarwest/mods/59
- White Primary Ammo Pickup Glow: https://www.nexusmods.com/farfarwest/mods/13

Manual direct path version:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\turnkey-coop-modpack.ps1 -XpGoldSoulsPakPath "C:\Users\ryanc\Downloads\XP Gold Souls Multiplier 1.3.1-14-1-3-1-1778926988.zip" -BetterWanderingTradersPakPath "C:\Users\ryanc\Downloads\BetterWanderingTraders-59-3-1778948736.zip" -PickupGlowPakPath "C:\mods\_extracted\WhitePrimaryPickup-13-1-0-2-1777953498\WhitePrimaryPickup_P.pak" -FreshStart -LaunchGame
```

Path resolution notes:
- `-XpGoldSoulsPakPath` and `-BetterWanderingTradersPakPath` accept a `.pak`, `.zip`, or extracted UE4SS mod folder.
- `-PickupGlowPakPath` accepts a `.pak` (the script also installs matching `.ucas`/`.utoc` files).
- If a provided path is missing, turnkey automatically scans `C:\mods\_extracted`, `C:\mods`, Downloads, and Desktop.

What this does:
- Backs up your current saves
- Archives current run-state files when `-FreshStart` is used
- Installs community gameplay mods from detected `.pak` or UE4SS script-mod sources in one pass
- Installs local UE4SS QoL mods: `GoldSandbox` and `AutoPickup`
- Stores rollback info in `%LOCALAPPDATA%\FarFarWest\Saved\ModHelper\last-turnkey-state.json`
- Launches Far Far West when `-LaunchGame` is used

Use `-SkipLocalQoLMods` if you only want the downloaded community mods.

## Turnkey Revert

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\turnkey-coop-revert.ps1 -RestoreLastBackup
```

What this does:
- Removes the last turnkey-installed pak files and UE4SS mod folders
- Restores your save files from the last turnkey backup
- Creates a pre-restore safety backup first

## Export A Friend Modpack

Use this after running the turnkey setup if you want your friend to mirror your active gameplay mods.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\export-friend-modpack.ps1 -UseLastTurnkeyState
```

To create a zip too:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\export-friend-modpack.ps1 -UseLastTurnkeyState -Zip
```

This creates a desktop folder named `FarFarWest-Friend-Modpack\FarFarWest-Modpack-YYYYMMDD_HHMMSS` with:
- `paks\` containing the active `.pak`/asset files
- `ue4ss-mods\` containing active UE4SS script mods such as `GoldSandbox` and `AutoPickup`
- `scripts\install-friend-modpack.ps1` for your friend
- `README.md` with friend-side setup steps
- `manifest.json` listing the package contents

If you have not run turnkey yet, export everything currently in `~mods`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\export-friend-modpack.ps1
```

Only share mod files when the mod page/license allows redistribution. If not, share the README/manifest and have your friend download the same files from the original mod pages.

## Test AutoPickup

Use the validation harness when you want a focused log capture. It installs the latest AutoPickup template, enables temporary debug telemetry in the live copy, captures `UE4SS.log`, writes a summary under `scripts\farfarwest\reports`, and restores the previous config.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\test-autopickup.ps1 -DurationSeconds 300 -UseShippingExe -StopGameAtEnd
```

During the capture window, load a mission and run near ammo/health pickups.

## Safety Rules

- Back up before each new mod test.
- Keep only one progression mod active at once.
- Test solo/private first.
- After game patches, expect mods to break until updated.
- For multiplayer, use private/friend lobbies and match gameplay-affecting mod versions across players.
