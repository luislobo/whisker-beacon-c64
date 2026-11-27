const assert = require('node:assert/strict');
const path = require('node:path');
const { runVice, readSymbols, startGame } = require('./vice.cjs');

const build = path.resolve(__dirname, '../build');
const s = readSymbols(path.join(build, 'symbols.labels'));
const TURN = 0xe4;
const LEFT_EDGE = 337;
const RIGHT_EDGE = 361;

function ink(sprite, x, y) {
  return (sprite[y * 3 + (x >> 2)] >> (6 - 2 * (x & 3))) & 3;
}

function verify(mode) {
  return runVice(mode, 'rival-patrol', async (monitor, directory) => {
    await monitor.command('load "' + path.join(build, 'whisker-beacon.prg') + '" 0');
    await startGame(monitor, s);
    async function step() {
      await monitor.write(7, [0]);
      await monitor.until(s.controls_ready);
    }
    await monitor.write(0x0c, [24, 1, 171, 0, 0, 1]);
    await step();

    const directions = [[], []];
    const turns = new Set();
    const locations = [];
    for (let tick = 0; tick < 100; tick++) {
      await step();
      const x = (await monitor.bytes(0x50, 1))[0] + 256;
      const facing = (await monitor.bytes(0x26, 1))[0];
      const pointer = (await monitor.bytes(0x07f9, 1))[0];
      assert.equal((await monitor.bytes(0x2bf9, 1))[0], pointer, 'both screen banks use the current rival pose');
      assert.ok(x >= LEFT_EDGE && x <= RIGHT_EDGE, 'the rival stays in its patrol span');
      if (locations.length > 0) {
        assert.ok(Math.abs(x - locations.at(-1)) <= 1, 'the rival advances one pixel at a time');
      }
      locations.push(x);
      if (x === LEFT_EDGE || x === RIGHT_EDGE) {
        assert.equal(pointer, TURN, 'the rival faces forward at each turn');
        turns.add(x);
      }
      if (pointer !== TURN && !directions[facing].includes(pointer)) directions[facing].push(pointer);

      if (mode === 'pal' && process.env.CAPTURE === '1' && tick < 96) {
        const number = String(tick).padStart(3, '0');
        await monitor.command('screenshot "' + path.join(directory, 'frame-' + number + '.png') + '" 2');
      }
    }

    assert.equal(turns.size, 2);
    assert.deepEqual(directions.map(frames => frames.length), [2, 2], 'both directions have two walk poses');
    const left = [];
    for (const pointer of directions[1]) left.push(await monitor.bytes(pointer * 64, 64));
    for (const pointer of directions[0]) {
      const right = await monitor.bytes(pointer * 64, 64);
      assert.ok(left.some(mirror => {
        for (let y = 0; y < 21; y++) {
          for (let x = 0; x < 12; x++) {
            if (ink(mirror, 11 - x, y) !== ink(right, x, y)) return false;
          }
        }
        return true;
      }), 'the rival turns and walks the other way');
    }
    assert.equal((await monitor.bytes(0x2b, 1))[0], 0, 'Pip can wait outside the patrol');
    console.log(mode + ': 24-pixel patrol, both turns, and mirrored walking verified');
  });
}

Promise.allSettled(['pal', 'ntsc'].map(verify)).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
