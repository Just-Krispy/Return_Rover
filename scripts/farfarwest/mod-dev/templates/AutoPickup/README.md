# AutoPickup

AutoPickup is a private-session UE4SS Lua mod for Far Far West.

It scans only active level actors near the local player, filters for ammo/health pickup-looking actors, and attempts likely pickup/collect/interact functions when the player is within range.

## Safety Defaults

- No save-file edits.
- No paid/DLC/online entitlement behavior.
- No global object scan.
- Progress is limited to health/ammo pickup-looking active actors.
- `debug` is disabled by default.

## Config

```json
{
  "enabled": true,
  "autoPickup": true,
  "scanIntervalMs": 350,
  "pickupRadius": 375,
  "maxActorsPerTick": 450,
  "maxCandidatesPerTick": 8,
  "retryCooldownTicks": 8,
  "candidateLogLimit": 80,
  "debug": false
}
```

Increase `pickupRadius` if pickups require being very close before auto-collection. Lower it if it feels too magnetic.

## Install

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\mod-dev\install-dev-mod.ps1 -ModSource .\scripts\farfarwest\mod-dev\templates\AutoPickup
```

Then restart Far Far West.

Search `UE4SS.log` for `[AutoPickup]` if you need to diagnose candidates.