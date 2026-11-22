const pip = [
  '   o   o',
  '   oo oo',
  '   ooooo',
  '   owowo',
  '   obobo',
  '   oowoo',
  ' b ooooo',
  ' booooooo',
  '  ooobooo',
  '   oowooo',
  '   oowoo',
  '   oo oo',
  '  bb  bb'
];

const stride = pip.slice(0, 11).concat('  oo oo', ' bb   bb');
const rival = [
  '  b    b',
  '  bb  bb',
  '  bbbbbb',
  '  bwbbwb',
  '  bbbbbbb',
  '   bwwwb',
  '   bbbbb b',
  '  bbbbbbbb',
  '  bbbbbb',
  '  bbbbb',
  '  bb bb',
  '  bb  bb'
];

const ink = { b: 3, o: 1, w: 2, ' ': 0 };

function pack(rows, left = false) {
  const sprite = Buffer.alloc(64);
  for (const [y, pixels] of rows.entries()) {
    const line = pixels.padEnd(12, ' ');
    const columns = left ? [...line].reverse() : [...line];
    for (const [x, color] of columns.entries()) {
      sprite[y * 3 + (x >> 2)] |= ink[color] << (6 - 2 * (x & 3));
    }
  }
  return sprite;
}

function playerSprites() {
  return Buffer.concat([pack(pip), pack(pip, true), pack(stride), pack(stride, true), pack(rival)]);
}

module.exports = { playerSprites };
