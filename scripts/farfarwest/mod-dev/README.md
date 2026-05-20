# Far Far West Mod Dev Workspace

This folder is for building community-friendly Far Far West mods without editing downloaded mods directly.

## Current Local Status

Installed/staged locally:

- Pickup Glow pak triplet installed in `FarFarWest\Content\Paks\~mods`
- UE4SS installed in `FarFarWest\Binaries\Win64`
- `XPMod` staged in `FarFarWest\Binaries\Win64\ue4ss\Mods`
- `BetterWanderingTraders` staged in `FarFarWest\Binaries\Win64\ue4ss\Mods`
- `GoldSandbox` staged in `FarFarWest\Binaries\Win64\ue4ss\Mods`
- `AutoPickup` staged in `FarFarWest\Binaries\Win64\ue4ss\Mods`

Restart Far Far West after adding or changing UE4SS mods.

## Mod Types Seen So Far

### Pak/Asset Mods

Example: White Primary Ammo Pickup Glow

Files:

- `.pak`
- `.ucas`
- `.utoc`

Install target:

- `FarFarWest\Content\Paks\~mods`

Best for:

- Visual swaps
- Cooked asset overrides
- UI/icon/material/mesh changes

### UE4SS Script Mods

Example: Better Wandering Traders

Typical structure:

```text
ModName/
  enabled.txt
  config/settings.json
  Scripts/main.lua
```

Install target:

- `FarFarWest\Binaries\Win64\ue4ss\Mods\ModName`

Best for:

- UI helpers
- Configurable QoL behavior
- Event hooks
- Debug overlays
- Private-lobby gameplay tweaks

### UE4SS DLL Mods

Example: XPMod

Typical structure:

```text
ModName/
  enabled.txt
  config/settings.json
  dlls/main.dll
```

Install target:

- `FarFarWest\Binaries\Win64\ue4ss\Mods\ModName`

Best for:

- Compiled logic where Lua is insufficient

## Good Community Mod Ideas

Low-risk and useful:

- Cleaner mission result summary
- Pickup/highlight tuning presets
- Private-lobby ready-check helper
- Build/stat comparison overlay
- Better compass/map markers for optional objectives
- Configurable UI scale or color tweaks
- Screenshot-friendly HUD toggle
- Vendor inventory preview text

Use care:

- Reward multipliers
- Economy changes
- Private-session sandbox currency mods, such as `GoldSandbox`
- Private-session QoL mods, such as `AutoPickup`
- Enemy count/difficulty changes
- Anything that affects public matchmaking

Avoid for public/community releases:

- Hidden save edits
- Undocumented progression unlocks
- Paid/DLC cosmetic or online entitlement unlocks
- Anything that silently affects other players

## Local Dev Loop

1. Copy `templates/HelloFarWest` to a new mod folder.
2. Edit `Scripts/main.lua` and `config/settings.json`.
3. Run `install-dev-mod.ps1`.
4. Launch the game with UE4SS installed.
5. Watch UE4SS logs/console for `[YourModName]` messages.

## Install Template Mod

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\mod-dev\install-dev-mod.ps1 -ModSource .\scripts\farfarwest\mod-dev\templates\HelloFarWest
```

## Install GoldSandbox

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\mod-dev\install-dev-mod.ps1 -ModSource .\scripts\farfarwest\mod-dev\templates\GoldSandbox
```

GoldSandbox keeps private-session wallet resources near configured targets (gold, souls, and optional ticket key) in `templates/GoldSandbox/config/settings.json`. It does not unlock paid/DLC cosmetics or online entitlements.

## Install AutoPickup

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\mod-dev\install-dev-mod.ps1 -ModSource .\scripts\farfarwest\mod-dev\templates\AutoPickup
```

AutoPickup tracks mission-loaded ammo/health actors and attempts nearby pickup interactions without assigning a keybind. Use `test-autopickup.ps1` for focused validation captures.
