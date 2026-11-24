const assert = require('node:assert/strict');
const path = require('node:path');
const { readSymbols, runVice } = require('./vice.cjs');
const { catLooks } = require('../tools/cat-looks.cjs');
const { titleArt } = require('../tools/title.cjs');

const build = path.resolve(__dirname, '../build');
const s = readSymbols(path.join(build, 'symbols.labels'));
const bitmapAddress = 0xa000;
const scanline = offset => Math.floor(offset / 320) * 8 + (offset % 8);
const dry = titleArt(catLooks().titleCats).bitmap;

function check(mode) {
  return runVice(mode, 'wet-glass', async monitor => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await monitor.command('break ' + s.title_controls_ready.toString(16));
    await monitor.command('g 810');
    await monitor.command('delete');

    const first = await monitor.bytes(bitmapAddress, 8000);
    const phases = new Set();
    const affected = new Set();
    const refreshes = mode === 'pal' ? 65 : 78;
    for (let frame = 0; frame < refreshes; frame++) {
      await monitor.until(s.title_controls_ready);
      const bitmap = await monitor.bytes(bitmapAddress, 8000);
      for (let offset = 0; offset < bitmap.length; offset++) {
        if (scanline(offset) >= 146 && scanline(offset) < 176) {
          assert.equal(bitmap[offset], dry[offset], 'the front windows and eave use their dry art');
        }
        if (bitmap[offset] !== first[offset]) affected.add(offset);
      }
      phases.add(bitmap.toString('hex'));
    }
    assert.equal(phases.size, 32, 'wet glass visits all 32 phases');
    assert.ok(affected.size >= 25 && affected.size <= 128, 'the effect has a bounded bitmap footprint');
    for (const offset of affected) {
      assert.ok(scanline(offset) >= 120 && scanline(offset) < 146,
        'rain changes stay in the sloped roof band');
    }
    console.log(mode, phases.size, 'distinct wet-glass phases covering', affected.size, 'bitmap bytes');
  });
}

Promise.allSettled(['pal', 'ntsc'].map(check)).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
