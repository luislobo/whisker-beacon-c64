const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { runVice, readSymbols } = require('./vice.cjs');
const routes = require('./campaign-routes.json');

const build = path.resolve(__dirname, '../build');
const symbols = readSymbols(path.join(build, 'symbols.labels'));
const INPUT = 7;
const TICKS = 0x0a;
const LEVEL = 0x41;
const WON = 0x2e;
const RECOVERIES = 0x2b;
const SID_TICKS = 0x33;
const RIGHT = 8;
const LEFT = 4;
const FIRE = 16;

const driver = 0xe000;
const routeStart = 0xe100;
const routeEnd = driver + 7;
const capturePreview = process.env.CAPTURE === '1';
const previewStart = 960;
const previewFrames = 350;
// Inject only controller samples. The CPU still advances the game, scroll,
// and SID using the shipped executable.
// LDA route; CMP #$ff; BNE play; RTS;
// play: STA INPUT; INC operand; BNE done; INC operand+1; done: RTS.
const sampler = Buffer.from([
  0xad, routeStart & 255, routeStart >> 8, 0xc9, 0xff, 0xd0, 1, 0x60,
  0x85, INPUT, 0xee, 1, driver >> 8, 0xd0, 3, 0xee, 2, driver >> 8, 0x60
]);

function bcd(bytes) {
  return [...bytes].reverse().map(byte => byte.toString(16).padStart(2, '0')).join(':')
    .replace(/:(\d\d)$/, '.$1');
}

function test(mode) {
  return runVice(mode, capturePreview ? 'campaign-preview' : 'campaign', async (monitor, directory) => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await monitor.command('break ' + symbols.controls_ready.toString(16));
    await monitor.command('g 810');
    await monitor.command('delete');
    const inputCall = symbols.controls_ready - 3;
    const originalInput = await monitor.bytes(inputCall, 3);
    assert.equal(originalInput[0], 0x20);

    async function playRoute(level) {
      const runs = routes[level];
      const inputs = Buffer.concat(runs.map(([count, bits]) => Buffer.alloc(count, bits)));
      const binary = path.join(directory, 'controls.bin');
      fs.writeFileSync(binary, Buffer.concat([inputs.subarray(1), Buffer.from([255])]));
      await monitor.command(`bload "${binary}" 0 ${routeStart.toString(16)}`);
      await monitor.write(driver, sampler);
      await monitor.write(inputCall + 1, [driver & 255, driver >> 8]);
      await monitor.write(INPUT, [inputs[0]]);
      const before = await monitor.bytes(TICKS, 2);
      const sidBefore = (await monitor.bytes(SID_TICKS, 1))[0];
      await monitor.command('stopwatch reset');
      if (capturePreview && level === 1) {
        await monitor.command('break ' + routeEnd.toString(16));
        for (let i = 0; i < previewStart + previewFrames; i++) {
          await monitor.until(symbols.frame_present);
          if (i >= previewStart) {
            const frame = String(i - previewStart).padStart(3, '0');
            await monitor.command(`screenshot "${path.join(directory, 'frame-' + frame + '.png')}" 2`);
          }
        }
        await monitor.command('g');
        await monitor.command('delete');
      } else {
        await monitor.until(routeEnd);
      }
      const cycleCount = Number((await monitor.command('stopwatch')).match(/Stopwatch:\s*(\d+)/)?.[1]);
      const hz = mode === 'pal' ? 50 : 60;
      const rasterCycles = mode === 'pal' ? 19656 : 17095;
      const after = await monitor.bytes(TICKS, 2);
      const expectedFrames = inputs.length * hz / 50;
      const servicedFrames = (after[0] - before[0]) & 255;
      assert.ok([Math.floor(expectedFrames) & 255, Math.ceil(expectedFrames) & 255].includes(servicedFrames),
        `level ${level + 1} services every ${hz} Hz refresh`);
      assert.ok(Math.abs(cycleCount - expectedFrames * rasterCycles) < rasterCycles,
        `level ${level + 1} holds the raster budget (${cycleCount} cycles)`);
      assert.equal((after[1] - before[1]) & 255, inputs.length & 255);
      assert.equal(((await monitor.bytes(SID_TICKS, 1))[0] - sidBefore) & 255, inputs.length & 255);
      assert.equal((await monitor.bytes(WON, 1))[0], 1, `level ${level + 1} lights the beacon`);
      assert.equal((await monitor.bytes(RECOVERIES, 1))[0], 0, 'the route earns a clean clear');
      const [waymarks, flies] = await monitor.bytes(0x2c, 2);
      assert.equal(waymarks, 7, 'every checkpoint was reached');
      assert.ok(flies >= 24, 'enough fireflies were collected');
      const time = bcd(await monitor.bytes(symbols.run_cents, 3));
      assert.equal(time, bcd(await monitor.bytes(symbols.best_cents, 3)));
      assert.ok(inputs.length >= 2800 && inputs.length <= 3300, 'a clean run is close to a minute');
      const screen = (await monitor.bytes(0x0400 + 42, 37)).toString('ascii');
      assert.ok(screen.startsWith(time) && screen.endsWith(time) && screen.includes('FALLS 00'));
      assert.equal((await monitor.bytes(2, 2)).readUInt16LE(), 5824, 'the camera clamps at the beacon');
      await monitor.until(symbols.controls_ready);
      await monitor.write(inputCall, originalInput);
      await monitor.command(`screenshot "${path.join(directory, 'beacon-' + level + '.png')}" 2`);
      return { level, time, updates: inputs.length, flies, checkpoints: waymarks };
    }

    async function step(input) {
      await monitor.write(INPUT, [input]);
      await monitor.until(symbols.controls_ready);
    }

    const garden = await playRoute(0);
    await step(0);
    await step(RIGHT | FIRE);
    assert.equal((await monitor.bytes(LEVEL, 1))[0], 1);
    assert.deepEqual(await monitor.bytes(symbols.best_cents, 3), Buffer.alloc(3));
    const greenhouse = await playRoute(1);
    await step(0);
    await step(LEFT | FIRE);
    assert.equal((await monitor.bytes(LEVEL, 1))[0], 0);
    assert.equal(bcd(await monitor.bytes(symbols.best_cents, 3)), garden.time, 'each level keeps its own best');
    await step(0);
    assert.equal((await monitor.bytes(WON, 1))[0], 0, 'the restarted level has an unlit beacon');
    assert.equal((await monitor.bytes(0x2d, 1))[0], 0, 'the restarted level has no collected fireflies');
    assert.equal((await monitor.bytes(0x0c, 2)).readUInt16LE(), 52, 'the restarted level begins at spawn');

    console.log({ mode, garden, greenhouse });
  });
}

const modes = capturePreview ? ['pal'] : ['pal', 'ntsc'];
Promise.allSettled(modes.map(test)).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
