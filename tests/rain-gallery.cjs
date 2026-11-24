const assert = require('node:assert/strict');
const path = require('node:path');
const { readSymbols, runVice, startGame } = require('./vice.cjs');
const { TILE } = require('../tools/garden.cjs');

const build = path.resolve(__dirname, '../build');
const s = readSymbols(path.join(build, 'symbols.labels'));
const right = 8;
const down = 2;
const fire = 16;
const lampColumn = 268;
const floorColors = 0xd800 + 23 * 40;
const galleryFloor = 0x8000 + 23 * 768;
const galleryLantern = 0x8000 + 21 * 768 + lampColumn;

function test(mode) {
  return runVice(mode, 'rain-gallery', async monitor => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await startGame(monitor, s);

    async function step(bits = 0, count = 1) {
      for (let tick = 0; tick < count; tick++) {
        await monitor.write(7, [bits]);
        await monitor.until(s.controls_ready);
      }
    }
    async function place(x) {
      await monitor.write(0x0c, [x & 255, x >> 8, 171, 0, 0, 1]);
      await step();
    }
    async function floor() {
      return (await monitor.bytes(floorColors, 40)).map(color => color & 15);
    }
    async function sprayVisible() {
      return Boolean((await monitor.bytes(0xd015, 1))[0] & 0x80);
    }
    async function lampOnScreen() {
      return lampColumn - ((await monitor.bytes(2, 2)).readUInt16LE() >> 3);
    }

    await monitor.write(0x2e, [1]);
    await step();
    await step(right | fire);
    assert.equal((await monitor.bytes(0x41, 1))[0], 1);
    await place(2090);
    assert.equal((await monitor.bytes(galleryFloor + lampColumn, 1))[0], TILE.galleryPavers);
    assert.ok((await floor()).every(color => color === 13), 'the unlit floor keeps the cool ink');
    await place(lampColumn * 8 - 10);
    assert.equal((await monitor.bytes(galleryLantern, 1))[0], TILE.brightLantern);
    const light = await floor();
    const lamp = await lampOnScreen();
    assert.equal(light[lamp], 15, 'the lit lantern puts gold on the floor below it');
    assert.equal(light[lamp - 5], 13, 'the light stays local');
    assert.equal(light[lamp + 5], 13, 'the light stays local');
    assert.equal(await sprayVisible(), false, 'standing does not spray');

    await step(right | down);
    assert.equal(await sprayVisible(), true, 'a grounded slide sprays in the gallery');
    assert.ok((await monitor.bytes(0xd00e, 1))[0] < (await monitor.bytes(0xd000, 1))[0],
      'the spray sits behind a rightward slide');
    await step(right, 16);
    assert.equal(await sprayVisible(), false, 'the droplets disperse after the slide');
    assert.equal((await floor())[await lampOnScreen()], 15, 'the light tracks the lantern while scrolling');

    await place(1920);
    assert.ok((await floor()).every(color => color === 13), 'leaving the lit area restores the floor ink');
    console.log(mode + ': platform ink, localized lantern light, and slide spray verified');
  });
}

Promise.allSettled(['pal', 'ntsc'].map(test)).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
