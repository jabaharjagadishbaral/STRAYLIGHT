# STRAYLIGHT APEX — Button Layout Fix

This build fixes the overlapping garage launch controls and result-screen buttons.

- Garage content scrolls independently from the launch dock.
- Launch controls use a responsive grid so buttons cannot overlap.
- Result actions use a responsive grid and stack cleanly on small screens.
- Touch controls have isolated flex groups and fixed button sizing.
- Existing steering input mapping is preserved: LEFT = left, RIGHT = right.

Run:

    npm install
    npm start

Open http://localhost:3000

## Steering direction fix
The steering axis is now visually calibrated for the chase camera. The left control applies the direction that moves the car to the left side of the screen, and the right control applies the opposite direction. Keyboard A/Left and D/Right use the same mapping.
