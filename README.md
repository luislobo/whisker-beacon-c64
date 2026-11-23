# Whisker Beacon

Pip the cat crosses the twilight garden and the Old Greenhouse. Gather six
fireflies in each level to relight its beacon. The game uses the original
three-voice SID tune *Lantern Paws*.

[![Whisker Beacon in VICE](dist/preview.png)](dist/gameplay.gif)

## Play

Open [whisker-beacon.prg](dist/whisker-beacon.prg) in VICE, or attach
[whisker-beacon.d64](dist/whisker-beacon.d64) to drive 8 on a Commodore 64.
From BASIC on a C64, enter `LOAD"*",8,1` and then `RUN`.

| Action | Keyboard | Joystick in port 2 |
| --- | --- | --- |
| Move | A / D | Left / right |
| Short hop | Tap Space | Tap Fire |
| Full leap | Hold Space | Hold Fire |
| Slide | Hold A or D, then press S | Hold left or right, then press Down |
| Replay after lighting the beacon | Space | Fire |
| Enter the greenhouse after clearing the garden | D and Space | Right and Fire |
| Return to the garden after clearing the greenhouse | A and Space | Left and Fire |

Collect at least six fireflies and reach the beacon at the far right. Falls
and enemy hits return Pip to the latest checkpoint. You keep the fireflies
you collected.

Slide under low shelves, scatter dust mites, and turn rolling acorns around.
Release Down or S between slides. You can slide again after a short recovery.
The silver bell opens a shortcut gate. Touch the greenhouse lantern to reveal
bonus fireflies, and watch for the owl's shadow before it swoops.

The finish screen shows your time, firefly count, and falls. Finish without
a fall for a clean clear. Press Fire or Space to try for a faster time.
Each level keeps its own best time until you reload the game.

Watch for a mushroom that launches Pip onto the rooftop route. The blue
firefly earns a star beside the firefly counter.

## Build and test

Install Node.js and 64tass, then run `node build.cjs` from the checkout.
Set `TASS64` to an explicit assembler path if it is outside your PATH.

```sh
node build.cjs
x64sc -autostartprgmode 1 -autostart build/whisker-beacon.prg
```

Run `node build.cjs --disk` to also create the D64 using VICE's `c1541`.
Run `node tests/playtest.cjs` to test the garden on PAL and NTSC, or run
`node tests/greenhouse.cjs` to clear both levels and check the greenhouse
hazards. Run `node tests/jumps.cjs` to test jump timing and the blue firefly.
`VICE_BIN` selects the emulator executable. Headless Linux uses `xvfb-run`.

The VICE playtest checks the 50 Hz gameplay and music clocks, both checkpoints,
the finish time and session best, replay, and recovery from a fall. It supplies input at
the game's control-sampling boundary. The screen scroll and sprite positions
update on the native video clock.

The VICE monitor helper was adapted from Luis Lobo's
[C64 demo kit](https://github.com/luislobo/c64-demo-kit). The characters, art,
levels, and score were made for Whisker Beacon.
