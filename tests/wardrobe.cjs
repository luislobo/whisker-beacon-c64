const assert = require('node:assert/strict');
const path = require('node:path');
const { readSymbols, runVice, startGame } = require('./vice.cjs');

const build = path.resolve(__dirname, '../build');
const s = readSymbols(path.join(build, 'symbols.labels'));
const ram = {
  input_bits: 7, game_ticks: 0x0b, player_x: 0x0c, grounded: 0x11,
  cat_look: 0x7a, cat_frame: 0x7c, cat_charm: 0x85
};
const cache = 0x3b00;
const runPointers = [0xee, 0x08, 0x0a, 0x0c, 0x0e, 0x9e];
const runHeadY = [1, 2, 3, 2, 1, 0];

function spritePixel(sprite, x, y) {
  return (sprite[y * 3 + (x >> 2)] >> (6 - 2 * (x & 3))) & 3;
}
const poses = { TURN: 4, LAUNCH: 6, LANDING: 10, SLIDE: 12, CLUE: 14 };
const up = 1;
const down = 2;
const left = 4;
const right = 8;
const fire = 16;

function test(mode) {
  return runVice(mode, 'wardrobe', async monitor => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await startGame(monitor, s);

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
      const portrait = await monitor.bytes(cache, 39);
      portraits.add(portrait.toString('hex'));
      if (name === 'CALICO') {
        const inks = (await monitor.bytes(0xd025, 3)).map(color => color & 15);
        assert.deepEqual(inks, Buffer.from([11, 1, 8]), 'Calico has gray, white, and orange registers');
        assert.equal(spritePixel(portrait, 6, 4), 2, 'Calico fur selects its own orange sprite register');
        assert.equal(spritePixel(portrait, 7, 2), 3, 'the white ear tip selects shared white');
      }
      if (name === 'SIAMESE') {
        assert.equal((await monitor.bytes(0xd027, 1))[0] & 15, 15, 'the Siamese body is cream');
        for (const [frame, pointer] of runPointers.entries()) {
          const stride = await monitor.bytes(pointer * 64, 39);
          const mirror = await monitor.bytes((pointer + 1) * 64, 39);
          for (let y = 0; y < 13; y++) {
            for (let x = 0; x < 12; x++) {
              assert.equal(spritePixel(stride, x, y), spritePixel(mirror, 11 - x, y),
                'the leftward gallop mirrors the rightward silhouette and palette');
            }
          }
          const top = runHeadY[frame];
          assert.equal(spritePixel(stride, 6, top), 1, 'the near ear keeps its dark marking');
          assert.equal(spritePixel(stride, 10, top), 0, 'the far ear is lower than the near ear');
          assert.equal(spritePixel(stride, 10, top + 1), 1, 'the far ear keeps its dark marking');
          for (let y = 2; y < 6; y++) {
            for (let x = 5; x < 12; x++) {
              const marking = spritePixel(portrait, x, y + 1);
              if (marking) assert.equal(spritePixel(stride, x, y + runHeadY[frame]), marking,
                'the Siamese keeps its markings through the head bob');
            }
          }
        }
      }
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

    for (const pointer of [...runPointers, runPointers[0]]) {
      for (let tick = 0; tick < 3; tick++) {
        await step(right);
        assert.equal(await value('cat_frame'), pointer, 'ground movement advances the six-pose gallop');
        assert.equal((await monitor.bytes(0x07f8, 1))[0], pointer, 'the gallop is sent to the VIC');
      }
    }
    await step(0);
    assert.equal(await value('cat_frame'), cache / 64, 'releasing the direction returns to the standing pose');

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
    console.log(mode + ': cat selection, locked outfits, gallop, mirrored markings, clue, turn, jump, landing, and slide verified');
  });
}

Promise.allSettled(['pal', 'ntsc'].map(test)).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
