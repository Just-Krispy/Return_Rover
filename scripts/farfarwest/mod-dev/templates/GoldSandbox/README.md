# GoldSandbox

GoldSandbox is a lightweight private-session UE4SS Lua mod for Far Far West.

It keeps runtime wallets maxed:

- `BP_GameState_C.pickedUpGolds`
- `BP_GameState_C.localUsedGolds`
- `BP_CanyonGameInstance_C.playerProgress.runtimeInventory[*]` entry where `name=moneyGold`
- `BP_CanyonGameInstance_C.playerProgress.runtimeInventory[*]` entry where `name=moneySoul`
- Optional configurable runtime wallet key for XP tickets (default `itemHero`)

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
  "enablePersistentSoul": true,
  "targetPersistentSoul": 999999,
  "refillBelowSoul": 999000,
  "enablePersistentTickets": true,
  "ticketWalletKey": "itemHero",
  "targetPersistentTickets": 99999,
  "refillBelowTickets": 99999,
  "enablePersistentXpFields": true,
  "targetPersistentXpFields": 999999,
  "refillBelowXpFields": 999000,
  "persistentScanEveryTicks": 2,
  "scanIntervalMs": 1000,
  "enableActionHooks": true,
  "maxHookRegisterAttempts": 600,
  "debug": false
}
```

In this build, `itemHero` appears to be clamped around `99999`, so the default ticket target uses that cap. The ticket refill threshold also defaults to `99999`, which means any spend below cap is topped up on the next scan.

`enablePersistentXpFields` adds a fallback lock for common scalar XP fields (`totalXp`, `heroXp`, `itemXp`, `currentXp`, and common case variants). This helps when a UI reads XP-like values from player-progress fields rather than runtime inventory wallets.

Persistent wallet updates are narrowly targeted: only `BP_CanyonGameInstance_C` and the `runtimeInventory` struct array are touched. When a tracked wallet key is raised (`moneyGold`, `moneySoul`, or `ticketWalletKey` when enabled), the mod attempts safe save calls (`F_SavePlayerProgress`, `F_AutoSavePlayerProgress`, `F_SaveGame`, `F_ForceSaveSmallDelay`).

`enableActionHooks` only registers known buy/selection functions and logs the function path plus the in-run GOLD snapshot before/after the action. It does not inspect widget properties or profile structs.
