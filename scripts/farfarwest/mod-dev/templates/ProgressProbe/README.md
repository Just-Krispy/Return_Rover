# ProgressProbe

ProgressProbe is a discovery-only UE4SS Lua probe for Far Far West.

It is designed to stay lightweight:

- No global object/function scans.
- No broad widget recursion.
- No save-file edits.
- No runtime mutation.

It only targets:

- `BP_CanyonGameInstance_C`
- `SG_PlayerProgress_C`
- Struct metadata for:
  - `/Game/Player/SaveGames/S_PlayerProgress.S_PlayerProgress`
  - `/Game/Player/SaveGames/S_PlayerSelectedItems.S_PlayerSelectedItems`
  - `/Game/Player/SaveGames/S_RuntimeInventory.S_RuntimeInventory`
  - `/Game/Progress/S_PlayerSkins.S_PlayerSkins`

## What It Logs

- Prioritized properties/functions (keywords: Save, Load, Progress, Gold, Money, Currency, Skin, Unlock, Purchase, Buy, Update, Player).
- Safe scalar values from live class instances where readable.
- Array/map metadata (size, inner/key/value type where available, small sample entries).
- For targeted struct arrays (like runtime inventory), logs a small number of nested entry scalars.
- Nested target-struct scalar fields when exposed cleanly by UE4SS.
- Suggested hook candidates from reflected function names.

All lines are prefixed with `[ProgressProbe]` in `UE4SS.log`.

## Default Safety

`config/settings.json` defaults to:

- `enabled: false`
- `discoveryOnly: true`

This means the probe is installed but idle by default. Set `enabled` to `true` only for a focused discovery run.

## Install / Run

From repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\mod-dev\install-dev-mod.ps1 -ModSource .\scripts\farfarwest\mod-dev\templates\ProgressProbe
```

Then run the game, perform the menu/shop flow you want to observe, and close the game.

Read:

`E:\SteamLibrary\steamapps\common\FarFarWest\FarFarWest\Binaries\Win64\ue4ss\UE4SS.log`

Search for:

- `[ProgressProbe] Probe attempt`
- `[ProgressProbe] Class BP_CanyonGameInstance_C`
- `[ProgressProbe] Class SG_PlayerProgress_C`
- `[ProgressProbe] Struct metadata`
- `[ProgressProbe] Suggested next hook candidates`
