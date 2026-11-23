const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { runVice, readSymbols } = require('./vice.cjs');
const { gardenRoute } = require('./garden-route.cjs');
const { garden, glyphs, TILE } = require('../tools/garden.cjs');

const build = path.resolve(__dirname, '../build');
const symbols = readSymbols(path.join(build, 'symbols.labels'));
const RIGHT = 8;
const LEFT = 4;
const DOWN = 2;
const FIRE = 16;
const LEVEL = 0x41;
const LEVEL_MAP = 0x5000;
const WON = 0x2e;
const RECOVERIES = 0x2b;
const BOARD = LEVEL_MAP + 20 * 128 + 40;
assert.equal(garden().filter(tile => tile === TILE.firefly).length, 12, 'all garden fireflies remain reachable');
assert.ok(glyphs().subarray(32 * 8, 33 * 8).every(byte => byte === 0), 'spaces stay blank in the HUD');

async function exercise(mode, name, action) {
  return runVice(mode, name, async (monitor, directory) => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await monitor.command('break ' + symbols.controls_ready.toString(16));
    await monitor.command('g 810');
    await monitor.command('delete');

    const nativeCapture = process.env.CAPTURE === '1' && mode === 'pal' && name === 'greenhouse-route';
    let recording = false;
    let frames = 0;
    async function capture() {
      const file = path.join(directory, 'frame-' + String(frames++).padStart(3, '0') + '.png');
      await monitor.command(`screenshot "${file}" 2`);
    }
    let ticks = 0;
    async function step(input, count = 1) {
      for (let i = 0; i < count; i++) {
        await monitor.write(7, [input]);
        if (recording) {
          await monitor.until(symbols.frame_present);
          await capture();
        }
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
      recording = nativeCapture;
    }
    const stopRecording = () => { recording = false; };
    return action({ monitor, directory, step, march, x, enterGreenhouse, capture, stopRecording, ticks: () => ticks });
  });
}

function route(mode) {
  return exercise(mode, 'greenhouse-route', async ({ monitor, directory, step, march, x, enterGreenhouse, capture, stopRecording, ticks }) => {
    for (const input of gardenRoute) await step(input);
    assert.equal((await monitor.bytes(WON, 1))[0], 1, 'the garden beacon was lit normally');
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
    const gate = LEVEL_MAP + 21 * 128 + 30;
    assert.equal((await monitor.bytes(gate, 1))[0], 0, 'the bell opens the gate');
    for (const screen of [0x0400, 0x2800]) {
      assert.equal((await monitor.bytes(screen + 33, 3)).toString('ascii'), '/06');
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
    const lanternHint = await monitor.bytes(0x2800 + 42, 'LANTERN LIT'.length);
    assert.deepEqual(lanternHint, Buffer.from('LANTERN LIT').map(byte => byte === 32 ? byte : byte + 128));
    assert.notEqual((await monitor.bytes(0x61, 1))[0], 0, 'the owl announces the swoop');
    await step(RIGHT | DOWN, 14);
    await march(632);
    await step(RIGHT | FIRE, 16);
    await march(855);
    await step(RIGHT | FIRE, 16);
    await march(984);
    assert.equal((await monitor.bytes(WON, 1))[0], 1, 'Pip lights the greenhouse beacon');
    assert.equal((await monitor.bytes(RECOVERIES, 1))[0], 0, 'the greenhouse route earns a clean clear');
    const elapsed = ticks() - startTicks;
    const guest = Number((await monitor.command('stopwatch')).match(/Stopwatch:\s*(\d+)/)?.[1]);
    const refresh = mode === 'pal' ? 50 : 60;
    const cycles = mode === 'pal' ? 19656 : 17095;
    assert.ok(Math.abs(guest - elapsed * refresh / 50 * cycles) < 2 * cycles,
      'the moving greenhouse route holds the normalized game clock');
    assert.equal(((await monitor.bytes(0x33, 1))[0] - startSid) & 255, elapsed & 255,
      'the SID updates throughout the run');
    stopRecording();
    if (mode === 'pal' && process.env.CAPTURE === '1') await capture();
    await monitor.command(`screenshot "${path.join(directory, 'beacon.png')}" 2`);
    const best = await monitor.bytes(symbols.best_cents, 3);
    assert.notDeepEqual(best, Buffer.alloc(3), 'the greenhouse records a best time');
    await step(0);
    await step(LEFT | FIRE);
    assert.equal((await monitor.bytes(LEVEL, 1))[0], 0, 'left and fire returns to the garden');
    assert.deepEqual(await monitor.bytes(symbols.best_cents, 3), Buffer.from([0x32, 0x09, 0]));
    const summary = { mode, seconds: elapsed / 50, guestCycles: guest, gameSteps: elapsed,
      bothBeacons: true, greenhouseCleanClear: true, bellGate: true, miteCleared: true,
      lanternLit: true, separateRecords: true, sidTicks: elapsed };
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
    assert.notEqual((await monitor.bytes(LEVEL_MAP + 21 * 128 + 71, 1))[0], 9);
    await step(RIGHT, 2);
    assert.equal((await monitor.bytes(0x4b, 1))[0], 1);
    for (const column of [71, 73, 75]) {
      assert.equal((await monitor.bytes(LEVEL_MAP + 21 * 128 + column, 1))[0], 9);
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

    console.log(`${mode}: crumble, lantern trail, owl telegraph and contact, and acorn reversal verified`);
  });
}

Promise.allSettled(['pal', 'ntsc'].flatMap(mode => [route(mode), hazards(mode)])).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
