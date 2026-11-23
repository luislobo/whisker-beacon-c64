const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runVice, readSymbols } = require('./vice.cjs');

const build = path.resolve(__dirname, '../build');
const symbols = readSymbols(path.join(build, 'symbols.labels'));
const CAMERA = 2;
const INPUT = 7;
const PLAYER_X = 0x0c;
const SCREEN_A = 0x0400;
const SCREEN_B = 0x2800;
const MAP = 0x8000;
const TILE_ROW = 7;

async function measurePass(monitor, mode, direction) {
  const banks = new Set();
  const positions = [];
  let previousBank;
  let switches = 0;
  for (let frame = 0; frame < 16; frame++) {
    const camera = (await monitor.bytes(CAMERA, 2)).readUInt16LE();
    assert.ok(camera > 0 && camera < 704, 'measure where the camera follows Pip');
    await monitor.until(symbols.scroll_applied);

    const [horizontal, , selection] = await monitor.bytes(0xd016, 3);
    const bank = selection & 0xfe;
    assert.ok(bank === 0x1c || bank === 0xac);
    assert.equal(horizontal & 0x1f, 0x10 | (7 - camera % 8), 'the VIC uses the matching fine scroll');
    assert.equal((await monitor.bytes(0xd000, 1))[0], 175, 'Pip stays aligned with the camera');

    const screen = bank === 0x1c ? SCREEN_A : SCREEN_B;
    assert.deepEqual(await monitor.bytes(screen + TILE_ROW * 40, 40),
      await monitor.bytes(MAP + TILE_ROW * 768 + (camera >> 3), 40),
      'the selected bank starts at the matching tile column');
    if (previousBank !== undefined && previousBank !== bank) switches++;
    previousBank = bank;
    banks.add(bank);
    positions.push(camera);
    await monitor.until(symbols.frame_present);
  }

  assert.equal(banks.size, 2, 'both screen buffers were used');
  assert.ok(switches >= 3, 'the sample crossed several tile boundaries');
  const steps = positions.slice(1).map((position, index) => direction * (position - positions[index]));
  assert.ok(steps.every(distance => mode === 'pal' ? distance === 2 : distance === 1 || distance === 2),
    'steady movement advances a small distance every refresh');
  assert.equal(steps.slice(0, 12).reduce((sum, distance) => sum + distance, 0), mode === 'pal' ? 24 : 20,
    'the camera keeps the same distance per second on PAL and NTSC');
  return { steps, bankSwitches: switches };
}

function test(mode) {
  return runVice(mode, 'scroll', async (monitor, directory) => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await monitor.command('break ' + symbols.controls_ready.toString(16));
    await monitor.command('g 810');
    await monitor.command('delete');

    // Replace only the input sampler, so every video frame remains observable
    // even when NTSC has a refresh without a game step.
    const inputCall = symbols.controls_ready - 3;
    assert.equal((await monitor.bytes(inputCall, 1))[0], 0x20, 'input sampler is a JSR');
    await monitor.write(inputCall, [0xea, 0xea, 0xea]);
    await monitor.write(INPUT, [8]);
    await monitor.write(PLAYER_X, [145, 0, 170, 0, 0, 1]);
    for (let i = 0; i < 4; i++) await monitor.until(symbols.frame_present);
    const right = await measurePass(monitor, mode, 1);

    await monitor.write(INPUT, [4]);
    for (let i = 0; i < 3; i++) await monitor.until(symbols.frame_present);
    const left = await measurePass(monitor, mode, -1);

    const result = { mode, right, left };
    fs.writeFileSync(path.join(directory, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(result);
  });
}

Promise.allSettled(['pal', 'ntsc'].map(test)).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
