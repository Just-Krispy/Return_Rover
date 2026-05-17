# GoldSandbox

GoldSandbox is a lightweight private-session UE4SS Lua mod for Far Far West.

It keeps both GOLD paths maxed:

- `BP_GameState_C.pickedUpGolds`
- `BP_GameState_C.localUsedGolds`
- `BP_CanyonGameInstance_C.playerProgress.runtimeInventory[*]` entry where `name=moneyGold` (`amount` field)

The displayed/current in-run GOLD behaves like:

```text
pickedUpGolds - localUsedGolds
```

Current config:

```json
{
  "enabled": true,
  "targetGold": 999999,
  "refillBelow": 999000,
  "enablePersistentGold": true,
  "targetPersistentGold": 999999,
  "persistentScanEveryTicks": 2,
  "scanIntervalMs": 1000,
  "enableActionHooks": true,
  "maxHookRegisterAttempts": 600,
  "debug": false
}
```

Persistent wallet updates are narrowly targeted: only `BP_CanyonGameInstance_C` and the `runtimeInventory` struct array are touched. When `moneyGold` is raised, the mod attempts safe save calls (`F_SavePlayerProgress`, `F_AutoSavePlayerProgress`, `F_SaveGame`, `F_ForceSaveSmallDelay`).

`enableActionHooks` only registers known buy/selection functions and logs the function path plus the in-run GOLD snapshot before/after the action. It does not inspect widget properties or profile structs.
