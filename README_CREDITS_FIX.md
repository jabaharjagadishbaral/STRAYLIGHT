# STRAYLIGHT APEX — Credits HUD Fix

Fixed a duplicate DOM id bug where both the in-race HUD and garage wallet used `coin-num`.
The old `getElementById('coin-num')` call updated the first element only, leaving the visible garage wallet at 0.

The build now uses:
- `hud-coin-num` for the in-race HUD
- `garage-coin-num` for the garage wallet

Both are updated from the same server-loaded `progress.coins` value.

Also ensures a newly initialized progress record gets the starter 1200 CR balance.
