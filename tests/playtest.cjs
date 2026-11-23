const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { runVice, readSymbols } = require('./vice.cjs');
const { gardenRoute } = require('./garden-route.cjs');

const root = path.resolve(__dirname, '..');
const symbols = readSymbols(path.join(root, 'build/symbols.labels'));
function loadGame(monitor) {
  return monitor.command(`load "${root}/build/whisker-beacon.prg" 0`);
}

// The engine polls actual controls every tick. Inject the sampled bits at the
// same boundary so the fixture exercises the assembled gameplay and renderer.
const INPUT = 7;
const RIGHT = 8;
const PLAYER_X = 0x0c;
const CAMERA_X = 2;
const CHECKPOINT = 0x2c;
const SCORE = 0x2d;
const WON = 0x2e;
const RECOVERIES = 0x2b;
const VIDEO_TICKS = 0x0a;
const GAME_TICKS = 0x0b;
const SID_TICKS = 0x33;

async function boot(monitor) {
  await loadGame(monitor);
  await monitor.command('break ' + symbols.controls_ready.toString(16));
  await monitor.command('g 810');
  await monitor.command('delete');
}
async function step(monitor, input) {
  await monitor.write(INPUT, [input]);
  await monitor.until(symbols.controls_ready);
}

async function test(mode) {
  return runVice(mode, 'playtest', async (monitor, directory) => {
    await boot(monitor);
    const hz = mode === 'pal' ? 50 : 60;
    assert.equal((await monitor.bytes(8, 1))[0], hz);
    const fireflyGlyph = 0x3000 + 9 * 8;
    const initialGlyph = await monitor.bytes(fireflyGlyph, 8);
    await monitor.until(symbols.swap_ink_row);
    await monitor.until(symbols.objective_ink_changed);
    assert.notDeepEqual(await monitor.bytes(fireflyGlyph, 8), initialGlyph, 'fireflies change pose');
    await monitor.until(symbols.swap_ink_row);
    await monitor.until(symbols.objective_ink_changed);
    assert.deepEqual(await monitor.bytes(fireflyGlyph, 8), initialGlyph, 'firefly poses loop');

    // Measure the physical raster intervals while letting the SID and game run.
    await monitor.until(symbols.frame_present);
    const start = await monitor.bytes(VIDEO_TICKS, 2);
    const sidBefore = (await monitor.bytes(SID_TICKS, 1))[0];
    await monitor.command('stopwatch reset');
    for (let i = 0; i < hz; i++) await monitor.until(symbols.frame_present);
    const stopwatch = await monitor.command('stopwatch');
    const elapsed = Number(stopwatch.match(/Stopwatch:\s*(\d+)/)?.[1]);
    const nominalCycles = hz * (mode === 'pal' ? 19656 : 17095);
    assert.ok(Math.abs(elapsed - nominalCycles) < 100, 'each video refresh was serviced');
    const after = await monitor.bytes(VIDEO_TICKS, 2);
    assert.equal((after[0] - start[0]) & 255, hz);
    assert.equal((after[1] - start[1]) & 255, 50);
    assert.equal(((await monitor.bytes(SID_TICKS, 1))[0] - sidBefore) & 255, 50);

    // Restart the PRG to give the patrols the same starting phase.
    await boot(monitor);
    const gardenScroll = new Set();
    for (const [i, input] of gardenRoute.entries()) {
      await monitor.write(INPUT, [input]);
      if (i >= 60 && i < 72) {
        const hudMode = (await monitor.bytes(0xd016, 1))[0] & 0x1f;
        assert.equal(hudMode, 0x08, 'the HUD stays in fixed 40-column mode');
        await monitor.until(symbols.scroll_applied);
        const gardenMode = (await monitor.bytes(0xd016, 1))[0] & 0x1f;
        assert.equal(gardenMode & 0x18, 0x10, 'the garden uses multicolor in 38 columns');
        gardenScroll.add(gardenMode & 7);
      }
      await monitor.until(symbols.controls_ready);
      if (mode === 'pal' && process.env.CAPTURE === '1' && i % 5 === 0) {
        const frame = String(i / 5).padStart(3, '0');
        await monitor.command(`screenshot "${path.join(directory, 'frame-' + frame + '.png')}" 2`);
      }
    }
    assert.equal(gardenScroll.size, mode === 'pal' ? 4 : 8, 'each moving scroll phase keeps the HUD fixed');
    assert.equal((await monitor.bytes(WON, 1))[0], 0, 'the opening stays part of the longer garden');
    assert.ok((await monitor.bytes(SCORE, 1))[0] >= 6, 'the opening still has its firefly trail');
    assert.equal((await monitor.bytes(RECOVERIES, 1))[0], 0, 'the opening route avoids all hazards');
    assert.equal((await monitor.bytes(CHECKPOINT, 1))[0], 2, 'both opening checkpoints were reached');
    assert.ok((await monitor.bytes(CAMERA_X, 2)).readUInt16LE() > 704, 'the camera passes the old right edge');

    await boot(monitor);
    const trunkFly = 0x8000 + 21 * 768 + 8;
    assert.equal((await monitor.bytes(trunkFly, 1))[0], 9, 'a firefly is in front of the trunk');
    await monitor.write(PLAYER_X, [54, 0, 170, 0, 0, 1]);
    await step(monitor, 0);
    assert.equal((await monitor.bytes(SCORE, 1))[0], 1, 'Pip collects the firefly');
    assert.equal((await monitor.bytes(trunkFly, 1))[0], 4, 'the original trunk tile returns');
    await monitor.until(symbols.scroll_applied);
    const [selection] = await monitor.bytes(0xd018, 1);
    const screen = (selection & 0xfe) === 0x1c ? 0x0400 : 0x2800;
    assert.equal((await monitor.bytes(screen + 21 * 40 + 8, 1))[0], 4, 'the VIC displays the restored trunk');

    await boot(monitor);
    for (let i = 0; i < 95; i++) {
      await step(monitor, RIGHT);
      if ((await monitor.bytes(RECOVERIES, 1))[0]) break;
    }
    assert.equal((await monitor.bytes(RECOVERIES, 1))[0], 1, 'falling triggers recovery');
    assert.equal((await monitor.bytes(PLAYER_X, 2)).readUInt16LE(), 52, 'a fall returns Pip to the checkpoint');

    const results = { mode, videoRefreshes: hz, gameUpdates: 50, sidUpdates: 50, routeSteps: 466,
      fixedHudScrollPhases: gardenScroll.size, openingCheckpoints: 2, recoveredFromFall: true };
    fs.writeFileSync(path.join(directory, 'result.json'), JSON.stringify(results, null, 2) + '\n');
    console.log(results);
  });
}

Promise.allSettled(['pal', 'ntsc'].map(test)).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
