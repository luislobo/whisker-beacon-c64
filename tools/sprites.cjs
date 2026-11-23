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

const mite = [
  '', '', '', '', '   w   w', '  bwwwwb', ' .wwwwwwb', '  wwbowwb',
  '  wwwwwww', '  wwbwwbw', '   wwww', '  b b b'
].map(row => row.replaceAll('.', ' '));
const acorn = [
  '', '', '', '', '     b', '   bbbb', '  bbbbbbb', '  boooobb',
  '  ooooooo', '  oowoobo', '   ooooo', '    ooo'
];
const owl = [
  '', '   b    b', '   bb  bb', '  bbwwwwbb', ' bbwobowbb', ' bbbwwwwbbb',
  'bbbbwobwbbbb', ' bbbwwwwbbb', '   bwwwbb', '   bbbbb', '  o    o'
];
const moth = [
  '', ' b        b', ' bbb    bbb', ' bbwb  bwbb', '  bbbwbbb',
  '   bwwwwb', '    obbo', '   bb  bb', '   b    b'
];
const shadow = ['', '', '', '', '  b b b b', ' b b b b b', '  b b b b'];

const ink = { b: 3, o: 1, w: 2, ' ': 0 };

function pack(rows) {
  const sprite = Buffer.alloc(64);
  for (const [y, pixels] of rows.entries()) {
    const line = pixels.padEnd(12, ' ');
    for (const [x, color] of [...line].entries()) {
      sprite[y * 3 + (x >> 2)] |= ink[color] << (6 - 2 * (x & 3));
    }
  }
  return sprite;
}

function actorSprites() {
  return Buffer.concat([Buffer.alloc(4 * 64), pack(rival), Buffer.alloc(2 * 64),
    pack(mite), pack(acorn), pack(owl), pack(shadow), pack(moth)]);
}

module.exports = { actorSprites };
