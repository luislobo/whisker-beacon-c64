const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { runVice, readSymbols } = require('./vice.cjs');
const { garden, glyphs, TILE } = require('../tools/garden.cjs');

const build = path.resolve(__dirname, '../build');
const symbols = readSymbols(path.join(build, 'symbols.labels'));
const RIGHT = 8;
const DOWN = 2;
const FIRE = 16;
const LEVEL = 0x41;
const LEVEL_MAP = 0x8000;
const WON = 0x2e;
const RECOVERIES = 0x2b;
const SCREEN_A_MOTH = 0x07f9;
const BOARD = LEVEL_MAP + 20 * 768 + 40;
assert.equal(garden().filter(tile => tile === TILE.firefly).length, 12, 'all garden fireflies remain reachable');
assert.ok(glyphs().subarray(32 * 8, 33 * 8).every(byte => byte === 0), 'spaces stay blank in the HUD');

async function exercise(mode, name, action) {
  return runVice(mode, name, async (monitor, directory) => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await monitor.command('break ' + symbols.controls_ready.toString(16));
    await monitor.command('g 810');
    await monitor.command('delete');

    let ticks = 0;
    async function step(input, count = 1) {
      for (let i = 0; i < count; i++) {
        await monitor.write(7, [input]);
        await monitor.until(symbols.controls_ready);
        ticks++;
      }
    }
    async function x() {
      return (await monitor.bytes(0x0c, 2)).readUInt16LE();
    }
    async function march(target) {
      for (let tries = 0; tries < 35; tries++) {
        const before = await x();
        if (before >= target) return;
        await step(RIGHT, Math.min(8, Math.ceil((target - before) / 2)));
        assert.ok(await x() > before, `Pip advances toward ${target} from ${before}`);
      }
      assert.fail(`Pip failed to reach ${target}`);
    }
    async function enterGreenhouse() {
      await step(0);
      await step(RIGHT | FIRE);
      assert.equal((await monitor.bytes(LEVEL, 1))[0], 1, 'right and fire opens the greenhouse');
    }
    return action({ monitor, directory, step, march, x, enterGreenhouse, ticks: () => ticks });
  });
}

function route(mode) {
  return exercise(mode, 'greenhouse-route', async ({ monitor, directory, step, march, x, enterGreenhouse, ticks }) => {
    // The campaign test covers clearing the garden and choosing this level.
    await monitor.write(WON, [1]);
    await enterGreenhouse();
    assert.deepEqual(await monitor.bytes(symbols.best_cents, 3), Buffer.alloc(3));
    const startTicks = ticks();
    const startSid = (await monitor.bytes(0x33, 1))[0];
    await monitor.command('stopwatch reset');
    await march(110);
    await step(RIGHT, 6);
    assert.equal(await x(), 111, 'the shelf blocks an upright cat');
    await step(RIGHT | DOWN, 14);
    assert.ok(await x() >= 145, 'the slide reaches the other side of the shelf');
    assert.equal((await monitor.bytes(0x4a, 1))[0], 1, 'the bell was collected under the shelf');
    const gate = LEVEL_MAP + 21 * 768 + 30;
    assert.equal((await monitor.bytes(gate, 1))[0], 0, 'the bell opens the gate');
    for (const screen of [0x0400, 0x2800]) {
      assert.equal((await monitor.bytes(screen + 33, 3)).toString('ascii'), '/24');
      assert.equal((await monitor.bytes(screen + 38, 1))[0], 0xc2);
    }
    const bellHint = await monitor.bytes(0x0400 + 42, 'BELL FOUND'.length);
    assert.deepEqual(bellHint, Buffer.from('BELL FOUND').map(byte => byte === 32 ? byte : byte + 128));
    await step(RIGHT | DOWN, 9);
    assert.equal((await monitor.bytes(0x3c, 1))[0], 0, 'holding Down does not chain slides');
    await march(191);
    await step(RIGHT | DOWN, 14);
    assert.equal((await monitor.bytes(0x5c, 1))[0] & 1, 0, 'the slide clears the mite');
    await march(342);
    await step(RIGHT | DOWN, 14);
    assert.equal((await monitor.bytes(RECOVERIES, 1))[0], 0, 'Pip passes the acorn unharmed');
    await march(407);
    await step(RIGHT | FIRE, 16);
    await march(595);
    assert.equal((await monitor.bytes(0x4b, 1))[0], 1, 'the floor route lights the lantern');
    assert.equal((await monitor.bytes(LEVEL_MAP + 20 * 768 + 67, 1))[0], 104, 'the lantern keeps its crown when lit');
    const lanternHint = await monitor.bytes(0x2800 + 42, 'LANTERN LIT'.length);
    assert.deepEqual(lanternHint, Buffer.from('LANTERN LIT').map(byte => byte === 32 ? byte : byte + 128));
    assert.notEqual((await monitor.bytes(0x61, 1))[0], 0, 'the owl announces the swoop');
    await step(RIGHT | DOWN, 14);
    await march(632);
    await step(RIGHT | FIRE, 16);
    await march(855);
    await step(RIGHT | FIRE, 16);
    await march(984);
    assert.equal((await monitor.bytes(WON, 1))[0], 0, 'the greenhouse continues beyond the original opening');
    assert.equal((await monitor.bytes(RECOVERIES, 1))[0], 0, 'the greenhouse route earns a clean clear');
    const elapsed = ticks() - startTicks;
    const guest = Number((await monitor.command('stopwatch')).match(/Stopwatch:\s*(\d+)/)?.[1]);
    const refresh = mode === 'pal' ? 50 : 60;
    const cycles = mode === 'pal' ? 19656 : 17095;
    assert.ok(Math.abs(guest - elapsed * refresh / 50 * cycles) < 2 * cycles,
      'the moving greenhouse route holds the normalized game clock');
    assert.equal(((await monitor.bytes(0x33, 1))[0] - startSid) & 255, elapsed & 255,
      'the SID updates throughout the run');
    const summary = { mode, seconds: elapsed / 50, guestCycles: guest, gameSteps: elapsed,
      greenhouseOpeningClean: true, bellGate: true, miteCleared: true, lanternLit: true, sidTicks: elapsed };
    fs.writeFileSync(path.join(directory, 'result.json'), JSON.stringify(summary, null, 2) + '\n');
    console.log(summary);
  });
}

function hazards(mode) {
  return exercise(mode, 'greenhouse-hazards', async ({ monitor, directory, step, enterGreenhouse }) => {
    // The route verifies the real route into level two. This fixture places Pip
    // at each encounter so its behavior is independent of the route timing.
    await monitor.write(WON, [1]);
    await enterGreenhouse();
    const place = (x, y) => monitor.write(0x0c, [x & 255, x >> 8, y, 0, 0, 0]);

    await place(327, 139);
    await step(0, 7);
    assert.equal((await monitor.bytes(BOARD, 1))[0], 22, 'landed boards start shaking');
    await monitor.command(`screenshot "${path.join(directory, 'boards.png')}" 2`);
    await step(0, 21);
    assert.ok((await monitor.bytes(BOARD, 6)).every(tile => tile === 0), 'the boards fall away');
    assert.ok((await monitor.bytes(0x0e, 1))[0] > 147, 'Pip drops toward the lower route');

    await place(525, 171);
    assert.notEqual((await monitor.bytes(LEVEL_MAP + 21 * 768 + 71, 1))[0], 9);
    await step(RIGHT, 2);
    assert.equal((await monitor.bytes(0x4b, 1))[0], 1);
    for (const column of [71, 73, 75]) {
      assert.equal((await monitor.bytes(LEVEL_MAP + 21 * 768 + column, 1))[0], 9);
    }

    await place(608, 170);
    await step(0, 2);
    assert.ok((await monitor.bytes(0x5c, 1))[0] & 8, 'the owl casts a shadow before diving');
    await monitor.command(`screenshot "${path.join(directory, 'shadow.png')}" 2`);
    await step(0, 42);
    assert.equal((await monitor.bytes(RECOVERIES, 1))[0], 1, 'standing under the swoop costs a retry');

    const acorn = (await monitor.bytes(0x51, 1))[0] + 256;
    await place(acorn - 15, 170);
    await monitor.write(0x11, [1]); // Pip starts grounded next to the acorn.
    const before = (await monitor.bytes(0x27, 1))[0];
    await step(RIGHT | DOWN);
    assert.equal((await monitor.bytes(0x27, 1))[0], before ^ 1, 'a slide reverses the acorn');
    assert.notEqual((await monitor.bytes(0x62, 1))[0], 0, 'the reversed acorn cannot hit Pip immediately');

    const benchFly = LEVEL_MAP + 21 * 768 + 61;
    assert.equal((await monitor.bytes(benchFly, 1))[0], 9);
    await place(478, 170);
    await step(0);
    assert.equal((await monitor.bytes(benchFly, 1))[0], 109, 'the firefly reveals the original bench leg');

    const rainCache = LEVEL_MAP + 21 * 768 + 256;
    await place(2134, 170);
    await step(0, 12);
    assert.equal((await monitor.bytes(rainCache + 12, 1))[0], 86, 'the second lantern lights across a map page');
    for (const column of [16, 18, 20]) {
      assert.equal((await monitor.bytes(rainCache + column, 1))[0], 9, 'the new lantern reveals its own cache');
    }
    const scoreBeforeCache = (await monitor.bytes(0x2d, 1))[0];
    await place(2166, 170);
    await step(0, 2);
    assert.equal((await monitor.bytes(rainCache + 16, 1))[0], 81, 'a revealed firefly restores its window mullion');
    assert.equal((await monitor.bytes(0x2d, 1))[0], scoreBeforeCache + 1, 'the cache firefly counts once');

    assert.equal((await monitor.bytes(SCREEN_A_MOTH, 1))[0], 0xeb, 'a moth replaces the mite in the rain gallery');
    const moth = (await monitor.bytes(0x50, 1))[0] + 256 * (await monitor.bytes(0x54, 1))[0];
    const mothY = (await monitor.bytes(0x58, 1))[0];
    await place(moth, mothY + 2);
    await step(0);
    assert.equal((await monitor.bytes(RECOVERIES, 1))[0], 2, 'the moth hits Pip in the air');
    assert.equal((await monitor.bytes(0x0c, 2)).readUInt16LE(), 2056, 'the latest waymark is the recovery point');

    console.log(`${mode}: crumble, lanterns, owl, acorn and rain-gallery moth verified`);
  });
}

Promise.allSettled(['pal', 'ntsc'].flatMap(mode => [route(mode), hazards(mode)])).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
