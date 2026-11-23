const assert = require('node:assert/strict');
const path = require('node:path');
const { runVice, readSymbols } = require('./vice.cjs');

const build = path.resolve(__dirname, '../build');
const s = readSymbols(path.join(build, 'symbols.labels'));
const ram = {
  input: 7, x: 0x0c, grounded: 0x11, won: 0x2e, lantern: 0x4b, charm: 0x85
};
const down = 2;
const left = 4;
const right = 8;
const fire = 16;

function test(mode) {
  return runVice(mode, 'brass', async monitor => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await monitor.command('break ' + s.controls_ready.toString(16));
    await monitor.command('g 810');
    await monitor.command('delete');

    async function step(input = 0) {
      await monitor.write(ram.input, [input]);
      await monitor.until(s.controls_ready);
    }
    async function place(x) {
      await monitor.write(ram.x, [x & 255, x >> 8, 171, 0, 0, 1]);
    }
    async function overlayMask() {
      return (await monitor.bytes(0xd015, 1))[0] & 0xe0;
    }
    async function bell(flash = false, offset = -9) {
      assert.equal(await overlayMask(), flash ? 0xe0 : 0x60,
        'the gold and bronze share two sprites, with a third sprite for the pickup glint');
      const [x, y] = await monitor.bytes(0xd000, 2);
      assert.deepEqual([...await monitor.bytes(0xd00a, 4)], [x, y + offset, x, y + offset],
        'both layers stay aligned above the displayed cat');
      const xHigh = (await monitor.bytes(0xd010, 1))[0];
      assert.equal(xHigh & 0xe0, (xHigh & 1) * (flash ? 0xe0 : 0x60));
      assert.equal((await monitor.bytes(0xd01c, 1))[0] & 0xe0, 0, 'all bell layers are hires');
      const colors = await monitor.bytes(0xd02c, flash ? 3 : 2);
      assert.deepEqual([...colors.map(color => color & 15)], flash ? [7, 9, 1] : [7, 9]);
      const pointers = await monitor.bytes(0x07fd, 3);
      assert.deepEqual(pointers, await monitor.bytes(0x2bfd, 3), 'both screen buffers use the same layers');
      return pointers[0];
    }

    await monitor.write(ram.won, [1]);
    await step();
    await step(right | fire);
    assert.equal(await overlayMask(), 0, 'the bell starts hidden');
    await place(67 * 8 - 10);
    await step();
    assert.equal((await monitor.bytes(ram.lantern, 1))[0], 1);
    await place(71 * 8 - 10);
    await step();
    assert.equal((await monitor.bytes(ram.charm, 1))[0], 2, 'a cache firefly equips the brass bell');
    await bell(true);
    for (let tick = 0; tick < 6; tick++) await step();
    const upright = await bell();
    await step();
    assert.equal(await bell(), upright, 'the bell hangs still when the cat stops');

    const strides = new Set();
    for (let tick = 0; tick < 16; tick++) {
      await step(right);
      strides.add(await bell());
    }
    assert.equal(strides.size, 3, 'the bell swings through three poses on a run');
    await step(right | fire);
    assert.notEqual(await bell(), upright, 'the bell tilts during takeoff');
    for (let tick = 0; tick < 40; tick++) {
      await step();
      if ((await monitor.bytes(ram.grounded, 1))[0]) break;
    }
    assert.equal((await monitor.bytes(ram.grounded, 1))[0], 1, 'the cat landed');
    assert.notEqual(await bell(), upright, 'the bell swings forward on landing');
    await step(left);
    assert.ok(!strides.has(await bell()), 'leftward movement displays the mirrored bell');
    await step(left | down);
    const tucked = await bell(false, -7);
    assert.ok(!strides.has(tucked), 'the slide uses separate folded bell art');
    for (const offset of [-4, -2, 0]) {
      await step();
      assert.equal(await bell(false, offset), tucked, 'the folded bell settles close to the cat');
    }
    for (let tick = 0; tick < 8; tick++) await step();
    assert.equal(await bell(false, 0), tucked, 'the folded bell stays visible during the slide');
    for (let tick = 0; tick < 8; tick++) await step();
    const unfolded = await bell();
    assert.notEqual(unfolded, tucked, 'the bell opens up after the slide');
    assert.ok(!strides.has(unfolded), 'the bell stays mirrored while facing left');

    console.log(mode + ': shaded brass, pickup glint, swing, mirroring, and slide verified');
  });
}

Promise.allSettled(['pal', 'ntsc'].map(test)).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
