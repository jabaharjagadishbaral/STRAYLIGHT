# STRAYLIGHT APEX — Garage / Persistence / Controls Fix

This build includes:
- Race-only HUD: nitro and speed bars no longer sit on top of garage controls.
- Mission rewards are now explicitly claimable from Career.
- New accounts receive 1200 CR starter credits; older zero-run accounts receive the same one-time starter pack.
- Car cards clearly show OWNED or BUY price; clicking a locked card with enough CR purchases it.
- Account database is stored in the user's home directory (`~/.straylight-apex/db.json`) so replacing the project folder does not erase accounts/progress.
- Login session validation on startup; stale tokens return to sign-in without deleting the server-side account.
- Username normalization is case-insensitive.
- Steering mapping is explicitly screen-space corrected: LEFT button visually moves left, RIGHT button visually moves right.
- Steering remains smooth and persistent in the selected lane.
- Nitro remains a race-only control and HUD element.
- Garage visual direction refreshed into an APEX Racing HQ / graphite-orange motorsport command center.
