# CosmeticUnlocker

CosmeticUnlocker is an opt-in UE4SS Lua mod for discovering and unlocking local cosmetic/fashion candidates in Far Far West.

It starts in discovery mode. In that mode it only logs likely local cosmetic properties, such as skin/outfit/wardrobe objects with boolean unlock-like fields.

## Safety Boundaries

The mod deliberately ignores names that look like DLC, premium purchases, online entitlements, backend state, receipts, licenses, Steam/EOS state, or achievements.

Do not use this to unlock paid/DLC cosmetics or online entitlements.

## Settings

Default `config/settings.json`:

```json
{
  "enabled": true,
  "discoveryOnly": true,
  "unlockLocalCandidates": false,
  "scanIntervalMs": 5000,
  "maxLoggedCandidates": 80,
  "maxUnlocksPerScan": 40,
  "debug": true
}
```

After reviewing `UE4SS.log`, set both of these if candidates look like local cosmetics:

```json
{
  "discoveryOnly": false,
  "unlockLocalCandidates": true
}
```

Restart the game after changing settings.