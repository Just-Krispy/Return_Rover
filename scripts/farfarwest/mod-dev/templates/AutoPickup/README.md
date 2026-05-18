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
  "scanAllLoadedLevels": true,
  "trackConstructedActors": true,
  "maxLevelsPerTick": 12,
  "maxActorsPerTick": 450,
  "maxTrackedActors": 240,
  "maxCandidatesPerTick": 8,
  "retryCooldownTicks": 8,
  "candidateLogLimit": 80,
  "nearbyDiscoveryLogLimit": 80,
  "debugSummaryEveryTicks": 20,
  "debug": false
}
```

Increase `pickupRadius` if pickups require being very close before auto-collection. Lower it if it feels too magnetic.

`scanAllLoadedLevels` helps catch pickups in streamed mission levels instead of only the persistent level.

`trackConstructedActors` records newly constructed pickup-looking actors as missions load, which is useful when UE4SS reports sparse level actor arrays.

## Install

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\mod-dev\install-dev-mod.ps1 -ModSource .\scripts\farfarwest\mod-dev\templates\AutoPickup
```

Then restart Far Far West.

Search `UE4SS.log` for `[AutoPickup]` if you need to diagnose candidates.

## Validation Harness

From the repo root, this installs the latest AutoPickup template, enables temporary debug telemetry in the live copy, launches the game, captures pickup logs, writes a summary under `scripts\farfarwest\reports`, and restores the pre-test config:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\test-autopickup.ps1 -DurationSeconds 300
```

Use `-UseShippingExe` if the Steam launcher exits before UE4SS initializes, and `-StopGameAtEnd` when you want the harness to close the validation run automatically.