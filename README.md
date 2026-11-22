# Whisker Beacon

Pip the cat crosses a twilight garden, dodges patrol cats, and gathers six
fireflies to relight the hilltop beacon. This first build includes one complete
scrolling level and the original three-voice SID tune *Lantern Paws*.

[![Whisker Beacon in VICE](dist/preview.png)](dist/gameplay.gif)

## Play

Open [whisker-beacon.prg](dist/whisker-beacon.prg) in VICE, or attach
[whisker-beacon.d64](dist/whisker-beacon.d64) to drive 8 on a Commodore 64.
From BASIC on a C64, enter `LOAD"*",8,1` and then `RUN`.

| Action | Keyboard | Joystick in port 2 |
| --- | --- | --- |
| Move | A / D | Left / right |
| Jump | Space | Fire |
| Replay after lighting the beacon | Space | Fire |

Collect at least six fireflies and reach the lantern at the far right. Falling
or touching a patrol cat returns Pip to the latest checkpoint and keeps the
fireflies already collected.

## Build and test

Install Node.js and 64tass, then run `node build.cjs` from the checkout.
Set `TASS64` to an explicit assembler path if it is outside your PATH.

```sh
node build.cjs
x64sc -autostartprgmode 1 -autostart build/whisker-beacon.prg
```

Run `node build.cjs --disk` to also create the D64 using VICE's `c1541`.
Run `node tests/playtest.cjs` after building to replay the same route on PAL
and NTSC. `VICE_BIN` selects the emulator executable. Headless Linux uses
`xvfb-run`.

The VICE playtest checks the 50 Hz gameplay and music clocks, both checkpoints,
the beacon objective, replay, and recovery from a fall. It supplies input at
the game's control-sampling boundary. The screen scroll and sprite positions
update on the native video clock.

The VICE monitor helper was adapted from Luis Lobo's
[C64 demo kit](https://github.com/luislobo/c64-demo-kit). The characters, art,
level, and score were made for Whisker Beacon.
