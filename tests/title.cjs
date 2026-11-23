const assert = require('node:assert/strict');
const path = require('node:path');
const { readSymbols, runVice } = require('./vice.cjs');

const build = path.resolve(__dirname, '../build');
const s = readSymbols(path.join(build, 'symbols.labels'));
const input = 7;
const fire = 16;
const changeCat = 1;
const catLook = 0x7a;
const titleCat = 0x8ff8;
const nameRow = 0xa000 + (22 * 40 + 10) * 8;
const nameBytes = 20 * 8;

function displayBands(mode) {
  return runVice(mode, 'title-bands', async monitor => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await monitor.command('break ' + s.title_controls_ready.toString(16));
    await monitor.command('g 810');
    await monitor.command('delete');

    const byte = async address => (await monitor.bytes(address, 1))[0];
    assert.equal(await byte(0xd016) & 0x18, 0x08, 'the frame starts with high-resolution lettering');
    assert.ok(s.title_scene_applied && s.title_footer_applied, 'the title splits the bitmap into display bands');
    for (const [label, raster, display] of [
      ['title_scene_applied', 114, 0x18], ['title_footer_applied', 227, 0x08]
    ]) {
      await monitor.until(s[label]);
      assert.equal(await byte(0xd012), raster, 'the display changes in the blank scanline');
      assert.equal(await byte(0xd016) & 0x18, display);
    }
    const name = await monitor.bytes(nameRow, nameBytes);
    assert.ok(name.some(bits => (bits ^ (bits >> 1)) & 0x55), 'the name uses individual horizontal pixels');
    console.log(mode + ': hi-res logo and controls with a multicolor scene between them');
  });
}

function test(mode) {
  return runVice(mode, 'title', async monitor => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    assert.ok(s.title_controls_ready, 'the game boots through a title screen');
    await monitor.command('break ' + s.title_controls_ready.toString(16));
    await monitor.command('g 810');
    await monitor.command('delete');
    const byte = async address => (await monitor.bytes(address, 1))[0];
    assert.equal(await byte(0xdd00) & 3, 1, 'the title selects its separate VIC bank');
    assert.equal(await byte(0xd011) & 0x3f, 0x3b, 'the title displays a bitmap');
    assert.equal(await byte(0xd015), 0x1f, 'Pip, the lantern, and three fireflies are visible');
    const previous = await monitor.bytes(0xd004, 6);
    await monitor.write(input, [8]);
    await monitor.until(s.title_controls_ready);
    for (let tick = 0; tick < 15; tick++) await monitor.until(s.title_controls_ready);
    assert.notDeepEqual(await monitor.bytes(0xd004, 6), previous, 'fireflies drift while waiting for Fire');
    assert.ok(await byte(0x31) > 0, 'the SID intro has started');
    assert.equal(await byte(s.run_started), 0, 'the title does not start the run timer');

    async function titleStep(bits) {
      await monitor.write(input, [bits]);
      await monitor.until(s.title_controls_ready);
    }
    async function roofCat(index, color) {
      assert.equal(await byte(catLook), index, 'the title selects the expected unlocked cat');
      assert.equal(await byte(0xd027) & 15, color, 'the roof sprite uses the selected coat color');
      const address = 0x8000 + (await byte(titleCat) & 0xfe) * 64;
      const sprite = await monitor.bytes(address, 39);
      const name = await monitor.bytes(nameRow, nameBytes);
      assert.ok(name.some(Boolean), 'the selected cat has a visible name');
      return [sprite.toString('hex'), name.toString('hex')];
    }

    const portraits = new Set();
    const names = new Set();
    for (const [index, color] of [[0, 8], [2, 7], [3, 8], [4, 14], [5, 15], [6, 15], [7, 14], [8, 5], [9, 10]]) {
      const [sprite, name] = await roofCat(index, color);
      portraits.add(color + ':' + sprite);
      names.add(name);
      await titleStep(changeCat);
      const selected = await byte(catLook);
      await titleStep(changeCat);
      assert.equal(await byte(catLook), selected, 'holding the selector advances once');
      await titleStep(0);
    }
    assert.equal(portraits.size, 9, 'all nine available roof portraits are visually distinct');
    assert.equal(names.size, 9, 'the displayed name follows each selected cat');
    await roofCat(0, 8);
    await titleStep(changeCat);
    await titleStep(0);
    await titleStep(changeCat);
    await roofCat(3, 8);
    await monitor.write(input, [fire | changeCat]);
    await monitor.until(s.controls_ready);
    assert.equal(await byte(catLook), 3, 'the selected Calico enters the Garden');
    const gameName = await monitor.bytes(0x0400 + 42, 6);
    assert.equal(Buffer.from(gameName.map(code => code & 0x7f)).toString(), 'CALICO');
    assert.equal(await byte(0xdd00) & 3, 3, 'Fire restores the game VIC bank');
    assert.equal(await byte(0xd011) & 0x3f, 0x1b, 'the game returns to character mode');
    assert.equal(await byte(0xd017), 0, 'the gameplay cat has normal height');
    assert.equal(await byte(0xd01d), 0, 'the gameplay cat has normal width');
    assert.equal(await byte(s.run_started), 0, 'the Start press stays out of gameplay');
    assert.equal(await byte(0x31), 1, 'the gameplay score starts on its first note');
    await monitor.write(input, [changeCat]);
    await monitor.until(s.controls_ready);
    assert.equal(await byte(catLook), 3, 'the held selector does not advance on entry');
    await monitor.write(input, [fire]);
    await monitor.until(s.controls_ready);
    assert.equal(await byte(s.run_started), 1, 'the next Fire press starts the run');
    assert.equal(await byte(0x11), 0, 'Fire works as jump after leaving the title');
    console.log(mode + ': nine roof previews, locked Tuxedo, and selected-cat handoff verified');
  });
}

function cue(mode) {
  return runVice(mode, 'title-cue', async monitor => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await monitor.command('break ' + s.title_controls_ready.toString(16));
    await monitor.command('g 810');
    const hz = mode === 'pal' ? 50 : 60;
    const cyclesPerFrame = mode === 'pal' ? 19656 : 17095;
    async function advance(frames) {
      await monitor.command('ignore 1 $' + (frames - 1).toString(16));
      await monitor.command('g');
    }
    await monitor.command('stopwatch reset');
    await advance(hz * 3);
    const cycles = Number((await monitor.command('stopwatch')).match(/Stopwatch:\s*(\d+)/)?.[1]);
    assert.ok(Math.abs(cycles - hz * 3 * cyclesPerFrame) < cyclesPerFrame,
      'the title services every refresh while the SID cue plays');
    const beat = (await monitor.bytes(0x31, 1))[0];
    assert.equal(beat, 11, 'the closing chord has finished in under three seconds');
    await advance(hz * 3);
    assert.equal((await monitor.bytes(0x31, 1))[0], beat, 'the intro plays once as the title keeps animating');
    assert.equal((await monitor.bytes(0x33, 1))[0], 0, 'the intro has its own timing outside the gameplay SID clock');
    console.log(mode + ': SID intro plays once at the shared tempo');
  });
}

Promise.allSettled(['pal', 'ntsc'].flatMap(mode => [test(mode), cue(mode), displayBands(mode)])).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
