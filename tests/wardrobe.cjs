const assert = require('node:assert/strict');
const path = require('node:path');
const { readSymbols, runVice } = require('./vice.cjs');

const build = path.resolve(__dirname, '../build');
const s = readSymbols(path.join(build, 'symbols.labels'));
const ram = {
  input_bits: 7, game_ticks: 0x0b, player_x: 0x0c, grounded: 0x11,
  cat_look: 0x7a, cat_frame: 0x7c, cat_charm: 0x85
};
const cache = 0x3b00;
const poses = { TURN: 4, LAUNCH: 6, LANDING: 10, SLIDE: 12, CLUE: 14 };
const up = 1;
const down = 2;
const left = 4;
const right = 8;
const fire = 16;

function test(mode) {
  return runVice(mode, 'wardrobe', async monitor => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await monitor.command('break ' + s.controls_ready.toString(16));
    await monitor.command('g 810');
    await monitor.command('delete');

    async function step(input) {
      await monitor.write(ram.input_bits, [input]);
      await monitor.until(s.controls_ready);
    }
    async function value(name) {
      return (await monitor.bytes(ram[name] ?? s[name], 1))[0];
    }
    function text(bytes) {
      return Buffer.from(bytes.map(byte => byte >= 128 ? byte - 128 : byte)).toString('ascii');
    }
    async function pose(name, facing = 0) {
      const pointer = cache / 64 + poses[name] + facing;
      assert.equal(await value('cat_frame'), pointer, 'the selected pose is ' + name);
      for (const screen of [0x0400, 0x2800]) {
        assert.equal((await monitor.bytes(screen + 0x3f8, 1))[0], pointer,
          'both screen buffers display the new pose');
      }
    }

    const names = ['GINGER PIP', 'BLACK CAT', 'CALICO', 'BOBTAIL', 'FLUFFY CAT',
      'SIAMESE', 'SCOTTISH FOLD', 'ALLEY CAT', 'LANTERN CAT'];
    const portraits = new Set();
    for (const [index, name] of names.entries()) {
      assert.equal(text(await monitor.bytes(0x0400 + 42, 13)).trimEnd(), name);
      portraits.add((await monitor.bytes(cache, 39)).toString('hex'));
      assert.equal(await value('run_started'), 0, 'choosing a cat leaves the timer at zero');
      if (index === 0) {
        await step(down);
        assert.equal(await value('cat_charm'), 0, 'the wardrobe skips locked charms');
      }
      await step(up);
      const selected = await value('cat_look');
      await step(up);
      assert.equal(await value('cat_look'), selected, 'holding Up selects only once');
      await step(0);
    }
    assert.equal(portraits.size, names.length, 'each available cat changes the sprite art');
    assert.equal(await value('cat_look'), 0, 'the roster wraps around to Pip');

    await monitor.write(ram.player_x, [120, 0, 170, 0, 0, 1]);
    await monitor.write(ram.game_ticks, [24]);
    await step(0);
    await pose('CLUE');
    await step(right);
    await step(left);
    await pose('TURN', 1);
    await step(right | fire);
    await pose('LAUNCH');

    for (let tick = 0; tick < 40 && await value('grounded') === 0; tick++) {
      await step(0);
    }
    await pose('LANDING');
    await step(right | down);
    await pose('SLIDE');
    const chosen = await value('cat_look');
    await step(up);
    assert.equal(await value('cat_look'), chosen, 'Up leaves the outfit alone during a run');
    console.log(mode + ': cat selection, locked outfits, clue, turn, jump, landing, and slide verified');
  });
}

Promise.allSettled(['pal', 'ntsc'].map(test)).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
