const assert = require('node:assert/strict');
const path = require('node:path');
const { runVice, readSymbols, startGame } = require('./vice.cjs');

const build = path.resolve(__dirname, '../build');
const symbols = readSymbols(path.join(build, 'symbols.labels'));
const RIGHT = 8;
const FIRE = 16;

async function exercise(mode, name, test) {
  return runVice(mode, name, async (monitor, directory) => {
    await monitor.command(`load "${path.join(build, 'whisker-beacon.prg')}" 0`);
    await startGame(monitor, symbols);
    async function step(bits, count = 1) {
      for (let tick = 0; tick < count; tick++) {
        await monitor.write(7, [bits]);
        await monitor.until(symbols.controls_ready);
      }
    }
    async function cat() {
      const state = await monitor.bytes(0x0c, 0x30);
      return {
        x: state.readUInt16LE(0), y: state[2], speed: state.readInt8(4),
        grounded: Boolean(state[5]), fireflies: state[0x2d - 0x0c],
        spring: state[0x3a - 0x0c], foundBlue: Boolean(state[0x3b - 0x0c])
      };
    }
    return test({ step, cat, monitor, directory });
  });
}

function height(mode, held) {
  return exercise(mode, held ? 'full-leap' : 'short-hop', async ({ step, cat }) => {
    const start = (await cat()).y;
    await step(FIRE);
    let apex = (await cat()).y;
    for (let tick = 1; tick < 26; tick++) {
      await step(held && tick < 16 ? FIRE : 0);
      apex = Math.min(apex, (await cat()).y);
    }
    return start - apex;
  });
}

function grace(mode) {
  return exercise(mode, 'ledge-grace', async ({ step, cat }) => {
    await step(RIGHT, 65);
    let ledge;
    for (let tick = 0; tick < 12; tick++) {
      await step(RIGHT);
      ledge = await cat();
      if (!ledge.grounded && ledge.y > 170) break;
    }
    assert.ok(ledge.x >= 185 && !ledge.grounded, 'Pip has walked off the ledge');
    await step(RIGHT | FIRE);
    assert.ok((await cat()).y < ledge.y, 'a late press still jumps');
  });
}

function buffer(mode) {
  return exercise(mode, 'jump-buffer', async ({ step, cat }) => {
    await step(FIRE);
    let approaching;
    for (let tick = 0; tick < 15; tick++) {
      await step(0);
      approaching = await cat();
      if (approaching.y >= 164 && approaching.speed > 0) break;
    }
    assert.ok(approaching.y >= 164 && !approaching.grounded && approaching.speed > 0);
    await step(FIRE);
    for (let tick = 0; tick < 7; tick++) {
      if ((await cat()).speed < 0) return;
      await step(FIRE);
    }
    assert.fail('the early press should jump after landing');
  });
}

function roof(mode) {
  return exercise(mode, 'blue-firefly', async ({ step, cat, monitor, directory }) => {
    await step(RIGHT, 17);
    await step(RIGHT | FIRE, 17);
    assert.equal((await cat()).x, 120, 'center above the mushroom');
    let launch;
    for (let tick = 0; tick < 25; tick++) {
      await step(0);
      launch = await cat();
      if (launch.spring) break;
    }
    assert.equal(launch.spring, 20, 'landing on the mushroom launches Pip');
    await step(RIGHT, 17);
    const air = await cat();
    assert.ok(air.x - launch.x > 34 && air.y < 85, 'the mushroom lifts Pip to the roof');
    for (let tick = 0; tick < 9 && (await cat()).x < 168; tick++) await step(RIGHT);
    let pickup = await cat();
    for (let tick = 0; tick < 28 && !pickup.foundBlue; tick++) {
      await step(0);
      pickup = await cat();
    }
    assert.ok(pickup.foundBlue, 'Pip collects the rare blue firefly');
    assert.equal(pickup.fireflies, launch.fireflies, 'the rare firefly earns a separate badge');
    assert.equal((await monitor.bytes(0x81, 1))[0] & 1, 1, 'the rare firefly earns the Garden ribbon');
    assert.equal((await monitor.bytes(0x85, 1))[0], 1, 'the ribbon equips when earned');
    const rareHint = Buffer.from('RARE FIREFLY FOUND').map(byte => byte === 32 ? byte : byte + 128);
    for (const screen of [0x0400, 0x2800]) {
      assert.equal((await monitor.bytes(screen + 37, 1))[0], 42);
      assert.deepEqual(await monitor.bytes(screen + 42, rareHint.length), rareHint);
    }
    await monitor.command(`screenshot "${path.join(directory, 'roof.png')}" 2`);
  });
}

async function verify(mode) {
  const [shortHop, fullLeap] = await Promise.all([height(mode, false), height(mode, true)]);
  assert.equal(shortHop, 11);
  assert.equal(fullLeap, 41);
  await Promise.all([grace(mode), buffer(mode), roof(mode)]);
  console.log(`${mode.toUpperCase()}: 11-pixel hop, 41-pixel leap, ledge grace, jump buffer, blue firefly verified`);
}

Promise.allSettled(['pal', 'ntsc'].map(verify)).then(results => {
  for (const result of results) {
    if (result.status === 'fulfilled') continue;
    console.error(result.reason);
    process.exitCode = 1;
  }
});
