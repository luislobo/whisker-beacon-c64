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

// The profile keeps its face steady as the paws reach and pass.
const rivalWalkA = [
  '........b...', '........bb.b', 'bb.....bbbbb', 'bbb....bbbob',
  '..bb..bbbbbb', '...bbbbbbbb.', '....bwbbww..', '...bbbbwbb..',
  '...bbbb.bbb.', '..bb.w...bb.', '.bb..w....bb', 'ww..ww...www'
];
const rivalWalkB = [
  '........b...', '........bb.b', '.bb....bbbbb', 'bbbb...bbbob',
  '...bbb.bbbbb', '....bbbbbbb.', '....bbbwwb..', '....bwbbbb..',
  '...bbwwbb...', '....bb.bbb..', '....wb...b..', '...ww...ww..'
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

const ink = { b: 3, o: 1, w: 2, ' ': 0, '.': 0 };

function pack(rows, left = false) {
  const sprite = Buffer.alloc(64);
  for (const [y, pixels] of rows.entries()) {
    for (const [x, color] of [...pixels].entries()) {
      const column = left ? 11 - x : x;
      sprite[y * 3 + (column >> 2)] |= ink[color] << (6 - 2 * (column & 3));
    }
  }
  return sprite;
}

function actorSprites() {
  const burst = [
    '....#', '.........#', '...#..........#', '.......##..........#',
    '...#........##', '..........#.....###', '...............#####'
  ];
  const settling = [
    '', '.....#', '..........#', '...#..........#',
    '.......#..........#', '..............#', '..........#.........##'
  ];
  const spray = [burst, settling].flatMap(rows => [packSpray(rows, false), packSpray(rows, true)]);
  return Buffer.concat([...spray, pack(rival), pack(rivalWalkA), pack(rivalWalkA, true),
    pack(mite), pack(acorn), pack(owl), pack(shadow), pack(moth)]);
}

function packSpray(rows, left) {
  const sprite = Buffer.alloc(64);
  for (const [y, row] of rows.entries()) {
    for (const [x, pixel] of [...row].entries()) {
      if (pixel !== '#') continue;
      const column = left ? 23 - x : x;
      sprite[(y + 6) * 3 + (column >> 3)] |= 128 >> (column & 7);
    }
  }
  return sprite;
}

function rivalWalkSprites() {
  return Buffer.concat([pack(rivalWalkB), pack(rivalWalkB, true)]);
}

module.exports = { actorSprites, rivalWalkSprites };
