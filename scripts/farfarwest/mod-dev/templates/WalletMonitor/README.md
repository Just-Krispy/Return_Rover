# WalletMonitor

WalletMonitor is a read-only UE4SS Lua monitor for Far Far West currency wallets.

It does not mutate save data, grant resources, or patch gameplay values.

It only reads `BP_CanyonGameInstance_C.playerProgress.runtimeInventory` entries and logs:

- Baseline wallet snapshot after the runtime inventory becomes available
- Per-wallet value deltas (`old -> new`, including signed delta)
- Optional action-hook timing around trader/shop interactions

## What It Tracks

Wallet keys are detected by name and include terms such as:

- `gold`
- `xp`
- `ticket`
- `soul`

All logs are prefixed with `[WalletMonitor]` in `UE4SS.log`.

## Settings

Default `config/settings.json`:

```json
{
  "enabled": true,
  "scanIntervalMs": 500,
  "logEveryTicks": 10,
  "enableActionHooks": true,
  "trackAllWalletEntries": false,
  "logAllRuntimeEntriesOnce": true,
  "maxHookRegisterAttempts": 600,
  "maxLoggedChangesPerTick": 32,
  "debug": false
}
```

- `trackAllWalletEntries`: include every runtime-inventory entry in snapshot/delta output.
- `logAllRuntimeEntriesOnce`: prints a one-time inventory key dump with original names and amounts.

## Install

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\mod-dev\install-dev-mod.ps1 -ModSource .\scripts\farfarwest\mod-dev\templates\WalletMonitor
```

## Session Capture Harness

Use the harness to run an interactive capture and produce a summary report:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\farfarwest\monitor-wallet-session.ps1
```

It waits for Enter to stop capture, writes a `.log` + `.summary.txt` under `scripts/farfarwest/reports`, and restores the previous config unless `-KeepMonitorConfig` is used.
