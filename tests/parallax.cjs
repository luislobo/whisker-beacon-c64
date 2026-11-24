const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { readSymbols, runVice, startGame } = require('./vice.cjs');

const build = path.resolve(__dirname, '../build');
const s = readSymbols(path.join(build, 'symbols.labels'));

function test(mode) {
  return runVice(mode, 'gallery-parallax', async monitor => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await startGame(monitor, s);
    async function step(bits) {
      await monitor.write(7, [bits]);
      await monitor.until(s.controls_ready);
    }
    const byte = async address => (await monitor.bytes(address, 1))[0];
    await monitor.write(0x2e, [1]);
    await step(0);
    await step(24);
    assert.equal(await byte(0x41), 1);
    await monitor.write(0x0c, [168, 8, 171, 0, 0, 1]);
    await step(0);
    assert.ok(s.gallery_sunset_applied, 'the Gallery has its own outdoor palette between the rails');
    const patterns = fs.readFileSync(path.join(build, 'gallery-parallax.bin'));

    for (let sample = 0; sample < 8; sample++) {
      await step(8);
      const worldX = (await monitor.bytes(2, 2)).readUInt16LE();
      const column = worldX >> 3;
      assert.ok(column >= 256 && column <= 344);
      const screen = ((await byte(0xd018)) & 0xf0) << 6;
      for (let row = 8; row < 13; row++) {
        const shown = await monitor.bytes(screen + row * 40, 40);
        const backdrop = await monitor.bytes(0x8000 + row * 768 + column, 40);
        const sky = row < 11;
        const widthMask = sky ? 255 : 63;
        const layerCamera = worldX >> (sky ? 3 : 2);
        const start = sky ? (row - 8)*256 : 768 + (row - 11)*64;
        for (let x = 0; x < 40; x++) {
          const texel = (layerCamera - ((worldX & 7) >> 1) + x*4) & widthMask;
          assert.equal(shown[x], backdrop[x] || patterns[start + texel],
            'the sky moves at one quarter and trees at one half while nearby artwork follows the camera');
        }
      }
      const floor = await monitor.bytes(screen + 23 * 40, 40);
      assert.deepEqual(floor, await monitor.bytes(0x8000 + 23 * 768 + column, 40));
    }
    await monitor.until(s.gallery_sunset_applied);
    assert.deepEqual([await byte(0xd021) & 15, await byte(0xd022) & 15, await byte(0xd023) & 15], [2, 0, 8]);
    await monitor.until(s.gallery_palette_restored);
    assert.deepEqual([await byte(0xd021) & 15, await byte(0xd022) & 15, await byte(0xd023) & 15], [0, 6, 12]);
    await monitor.until(s.controls_ready);
    async function checkPlainPanes(playerX) {
      await monitor.write(0x0c, [playerX & 255, playerX >> 8, 171, 0, 0, 1]);
      await step(0);
      const column = (await monitor.bytes(2, 2)).readUInt16LE() >> 3;
      const screen = ((await byte(0xd018)) & 0xf0) << 6;
      for (let row = 4; row < 13; row++) {
        assert.deepEqual(await monitor.bytes(screen + row * 40, 40),
          await monitor.bytes(0x8000 + row * 768 + column, 40), 'the original panes return on exit');
      }
      assert.equal(await byte(0xd800 + 9 * 40) & 15, 13, 'the normal pane ink returns');
    }
    await checkPlainPanes(2912);
    await monitor.write(0x0c, [168, 8, 171, 0, 0, 1]);
    await step(0);
    assert.equal(await byte(0xd800 + 9 * 40) & 15, 15, 'the sunset ink returns on reentry');
    await checkPlainPanes(2184);
    console.log(mode + ': three scroll speeds, foreground masks, and palette transitions verified');
  });
}

Promise.allSettled(['pal', 'ntsc'].map(test)).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
