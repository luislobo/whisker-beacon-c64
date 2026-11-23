const assert = require('node:assert/strict');
const path = require('node:path');
const { readSymbols, runVice } = require('./vice.cjs');

const build = path.resolve(__dirname, '../build');
const s = readSymbols(path.join(build, 'symbols.labels'));
const input = 7;
const fire = 16;

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
    await monitor.write(input, [fire]);
    await monitor.until(s.controls_ready);
    assert.equal(await byte(0xdd00) & 3, 3, 'Fire restores the game VIC bank');
    assert.equal(await byte(0xd011) & 0x3f, 0x1b, 'the game returns to character mode');
    assert.equal(await byte(0xd017), 0, 'the gameplay cat has normal height');
    assert.equal(await byte(0xd01d), 0, 'the gameplay cat has normal width');
    assert.equal(await byte(s.run_started), 0, 'the Start press stays out of gameplay');
    assert.equal(await byte(0x31), 1, 'the gameplay score starts on its first note');
    await monitor.write(input, [fire]);
    await monitor.until(s.controls_ready);
    assert.equal(await byte(s.run_started), 1, 'the next Fire press starts the run');
    assert.equal(await byte(0x11), 0, 'Fire works as jump after leaving the title');
    console.log(mode + ': animated title, Fire to start, and clean gameplay handoff verified');
  });
}

function cue(mode) {
  return runVice(mode, 'title-cue', async monitor => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await monitor.command('break ' + s.title_controls_ready.toString(16));
    await monitor.command('g 810');
    const hz = mode === 'pal' ? 50 : 60;
    async function advance(frames) {
      await monitor.command('ignore 1 $' + (frames - 1).toString(16));
      await monitor.command('g');
    }
    await advance(hz * 3);
    const beat = (await monitor.bytes(0x31, 1))[0];
    assert.equal(beat, 11, 'the closing chord has finished in under three seconds');
    await advance(hz * 3);
    assert.equal((await monitor.bytes(0x31, 1))[0], beat, 'the intro plays once as the title keeps animating');
    assert.equal((await monitor.bytes(0x33, 1))[0], 0, 'the intro has its own timing outside the gameplay SID clock');
    console.log(mode + ': SID intro plays once at the shared tempo');
  });
}

Promise.allSettled(['pal', 'ntsc'].flatMap(mode => [test(mode), cue(mode)])).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
