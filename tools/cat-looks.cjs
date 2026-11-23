// One character represents two horizontal multicolor sprite pixels.

const ginger = `......a...a.
..b...aa.aa.
.aa...aaaaa.
ab....acaca.
b.....aabaa.
b....aaaaaa.
.b.aaaaaaa..
..aaabaaab..
..aaaaaaa...
..aabaaaa...
...aa..aa...
...cc..cc...`;

const tuxedo = `......a...a.
......aa.aa.
......aaaaa.
..b..aacaca.
.ba..aaabaa.
.a...aaaaaa.
.b..aaaacca.
..baaaccca..
..aaaaacca..
...aa..ca...
...cc..cc...`;

const black = `.......a..a.
.......aa.aa
.aa...aaaaaa
a..b..acaca.
b...aaaabaa.
.b.aaaaaaba.
..aaaaabaaa.
..aaaabaaa..
...aa..aa...
...bb..bb...`;

const calicoBody = `.......c..b.
..b....cc.bb
.ba...aabbbb
.a....acacba
.b...aaabaa.
..a.aaaaaba.
..baccaaac..
...aacaaab..
...aacaaa...`;

const calicoStand = calicoBody + "\n...cc..aa...\n...cc..aa...";
const calicoStride = calicoBody + "\n...cc...aa..\n..cc.....aa.";

const bobtail = `......a..a..
......aa.aa.
.....aaaaaa.
.....aacaca.
.....aaabaa.
.aa.aaaaaaa.
abaaaaaaaaa.
.baaabaaaa..
..aaaaaaa...
..baa..baa..
..ccc..ccc..`;

const fluffy = `......a..a..
.a....aa.aa.
aaa..aaaaaa.
aaaa.abcaba.
aaaa.aaabca.
aaabaaaaaca.
aaaaaaaaacc.
.aaaaaaaccc.
.aaabaaccc..
..aabaccca..
...aaa.aaa..
...ccc.ccc..`;

const siamese = `......b...b.
......bb.bb.
.ba...bbbbb.
b.....bcbcb.
.b....bbabb.
..b..aaaaba.
..baaaaaaa..
...aaaaaaa..
....a...a...
....a...a...
....b...b...
....b...b...`;

const fold = `......aa.aa.
.b....bbaab.
ba....aaaaa.
ab....acaca.
.b...aaabaa.
..baaaaaaa..
..aaaaaaaa..
...aaabaaa..
...aaaaaaa..
...aa..aa...
...bb..bb...`;

const alley = `.......a..b.
..a....aa.b.
.ba...aaaaa.
.b....acaca.
..b...aabaa.
..a..aaaaba.
..abaaaaaa..
...aaaaabb..
...aaaaba...
...ab...aa..
...bb...bb..`;

const lantern = `.c.....a..a.
cc.....aa.aa
.cc...aaaaaa
.b....acaca.
.b....aabaa.
..b..aaaaaa.
..baaaaaacc.
..aaaaaaac..
..aaaaaaba..
...aa..aa...
...bb..bb...`;

const turn = `..a...a...a.
.aa...aa.aa.
.b....aaaaa.
..b...acaca.
...b..aabaa.
....baaaaaa.
.....aaaaa..
....aaabaaa.
...aaabaa...
...aa...aa..
...cc...cc..`;

const jump = `b.....a...a.
ab....aa.aa.
.ba...aaaaa.
..baaaacaca.
...aaaaabaa.
...aaaaaaa..
....aa.aa...
....bc.bc...`;

const landing = `......a...a.
.aa...aa.aa.
ab....aaaaa.
.b....acaca.
..b..aaabaa.
...aaaaaaa..
...aaabaaa..
..aaaaaaaa..
..cc...ccc..`;

const slide = `......a...a.
......aa.aa.
......aaaaa.
...aaaacaca.
.bbaaaaabaa.
baaaaaaaa...
....cc..cc..`;

const clue = `......a..a..
.c....aa.aa.
.cc..aaaaaa.
..b..aacaba.
..b.aaaabca.
..b.aaaaaca.
..baaaaaaa..
...aaabaa...
...aa..aa...
...cc..cc...`;

const spark = `.b......c...
.ba.c.......
ab.....a..a.
ab.....aa.aa
.b....aaaaaa
..b...aababa
..b...aabca.
...baaaaaca.
...aaaaaaa..
...aa..aaa..
...cc...cc..`;

const sit = `.....a..a...
.....aa.aa..
....aaaaaaa.
....aacacaa.
....aaabaaa.
.....aaaaa..
.....aaaaa..
....aaaaca..
.baaaaaaca..
bbaaaaacca..
.baabbccccb.
..bbbbbbbb..`;

const walk = `......a...a.
..b...aa.aa.
.b....aaaaa.
.b....acaca.
.ab...aabaa.
..b..aaaaaa.
..baaaaaaa..
..aaaabaaa..
...aaaaaa...
...aaa.aa...
..cc....cc..`;

const looks = [
  { name: 'Ginger Pip', art: ginger, color: 8 },
  { name: 'Tuxedo', art: tuxedo, color: 12 },
  { name: 'Black Cat', art: black, color: 7, ink: { a: 1, b: 1, c: 3 } },
  { name: 'Calico', art: calicoStand, stride: calicoStride, color: 8 },
  { name: 'Bobtail', art: bobtail, color: 14 },
  { name: 'Fluffy Cat', art: fluffy, color: 15 },
  { name: 'Siamese', art: siamese, color: 15 },
  { name: 'Scottish Fold', art: fold, color: 14 },
  { name: 'Alley Cat', art: alley, color: 5 },
  { name: 'Lantern Cat', art: lantern, color: 10 }
];

const stretch = `b.....a...a.
ab....aa.aa.
.ba...aaaaa.
..baaaacaca.
...aaaaabaa.
...aaaaaaa..
..aaa...aa..
..cc.....c..`;

const poses = { stand: '', stride: walk, turn, launch: stretch, air: jump, landing, slide, clue, spark, sit };
const height = 13;
const ink = { '.': 0, a: 3, b: 1, c: 2 };
const pipFaceLooks = new Set(['Tuxedo', 'Calico', 'Bobtail', 'Alley Cat', 'Lantern Cat']);

// These details carry each silhouette from the portrait into the action poses.
function actionArt(look, frame, pose) {
  const rows = frame.split('\n').map(row => row.padEnd(12, '.').split(''));
  const feet = rows.length - 1;
  const slidePose = pose === 'slide';
  const firstEar = rows.findIndex(row => row.slice(7).includes('a'));
  const eyeRow = pose === 'spark' ? 5 : 3;
  const eyeLeft = pose === 'spark' ? 8 : 7;
  switch (look.name) {
    case 'Tuxedo':
      for (let y = Math.max(eyeRow + 3, feet - 3); y <= feet; y++) {
        for (let x = 7; x <= 9; x++) {
          if (rows[y][x] === 'a') rows[y][x] = 'c';
        }
      }
      break;
    case 'Calico':
      for (let y = Math.max(eyeRow + 2, feet - 4); y < feet; y++) {
        if (rows[y][3] === 'a') rows[y][3] = 'c';
        if (rows[y][4] === 'a' && y % 2) rows[y][4] = 'c';
      }
      if (rows[eyeRow - 1][10] === 'a') rows[eyeRow - 1][10] = 'b';
      break;
    case 'Siamese':
      for (let y = 0; y <= feet; y++) {
        for (let x = 0; x < 12; x++) {
          if (rows[y][x] !== 'a') continue;
          if (y === firstEar || y === feet || x === 11) rows[y][x] = 'b';
        }
      }
      break;
    case 'Bobtail':
      for (const row of rows) {
        row.fill('.', 0, 2);
        if (row[2] !== '.') row[2] = 'c';
      }
      break;
    case 'Fluffy Cat':
      for (const row of rows) {
        if (row[1] !== '.') row[0] = 'a';
        if (row[2] === 'b') row[2] = 'a';
      }
      break;
    case 'Scottish Fold':
      if (!slidePose && firstEar >= 0) {
        for (let x = 7; x < 12; x++) {
          if (rows[firstEar][x] === 'a') rows[firstEar][x] = 'b';
        }
      }
      break;
    case 'Alley Cat':
      if (!slidePose && firstEar >= 0) {
        const ear = rows[firstEar].lastIndexOf('a');
        if (ear >= 7) rows[firstEar][ear] = 'b';
      }
      break;
    case 'Lantern Cat': {
      const collar = rows[eyeRow + 3];
      if (pose !== 'sit' && collar?.[eyeLeft + 2] === 'a') collar[eyeLeft + 2] = 'c';
      for (const row of rows) {
        const tip = row.findIndex(pixel => pixel !== '.');
        if (tip >= 0 && tip <= 2) {
          row[tip] = 'c';
          break;
        }
      }
      break;
    }
  }
  if (pose !== 'sit' && pipFaceLooks.has(look.name)) {
    // Pip's one-cell bridge separates the eyes. The nose sits one row lower.
    const eyes = rows[eyeRow];
    const muzzle = rows[eyeRow + 1];
    for (let x = eyeLeft - 1; x <= eyeLeft + 3; x++) {
      if (eyes[x] !== '.') eyes[x] = 'a';
      if (muzzle[x] === 'c') muzzle[x] = 'a';
    }
    eyes[eyeLeft] = eyes[eyeLeft + 2] = pose === 'spark' ? 'b' : 'c';
    muzzle[eyeLeft + 1] = 'b';
  }
  return rows.map(row => row.join('')).join('\n');
}

function packFrame(art, colors) {
  const rows = art.split('\n');
  if (rows.length > height || rows.some(row => row.length > 12)) throw Error('Cat pose exceeds the fixed drawing area');
  const bytes = Buffer.alloc(height * 3);
  for (const [row, pixels] of rows.entries()) {
    for (const [col, pixel] of [...pixels].entries()) {
      bytes[(height - rows.length + row) * 3 + (col >> 2)] |= colors[pixel] << (6 - 2 * (col & 3));
    }
  }
  return bytes;
}

function charmArt() {
  const frames = [
    ['   .. ..', '   #####', '    ###.', '     ##.', '    #.#.', '   ##.##'],
    ['    ##..', '    ##..', '   ####.', '   ####.', '  ######', '    ##..']
  ];
  const bytes = Buffer.alloc(4 * 64);
  for (const [charm, rows] of frames.entries()) {
    for (const [y, row] of rows.entries()) {
      for (const [i, pixel] of [...row].entries()) {
        if (pixel !== '#') continue;
        const x = 16 + i;
        for (const facing of [0, 1]) {
          const position = facing ? 23 - x : x;
          const byte = (charm * 2 + facing) * 64 + (y + 7) * 3 + (position >> 3);
          bytes[byte] |= 128 >> (position & 7);
        }
      }
    }
  }
  return bytes;
}

function catLooks() {
  const frames = [];
  const labels = [];
  for (const [index, look] of looks.entries()) {
    labels.push(`cat_look_${index} = cat_look_bits + ${frames.length * height * 3}`);
    for (const [pose, frame] of Object.entries(poses)) {
      const art = pose === 'stand' ? look.art : look[pose] ?? actionArt(look, frame, pose);
      frames.push(packFrame(art, { ...ink, ...look.ink }));
    }
  }
  const tables = [
    `CAT_LOOKS = ${looks.length}`,
    `CAT_POSES = ${Object.keys(poses).length}`,
    `CAT_POSE_BYTES = ${height * 3}`,
    ...Object.keys(poses).map((pose, index) => `POSE_${pose.toUpperCase()} = ${index * 2}`),
    ...labels,
    'cat_look_lo:',
    '    .byte ' + looks.map((_, i) => '<cat_look_' + i).join(','),
    'cat_look_hi:',
    '    .byte ' + looks.map((_, i) => '>cat_look_' + i).join(','),
    'cat_colors:',
    '    .byte ' + looks.map(look => look.color).join(','),
    'cat_names:',
    ...looks.map(look => '    .text "' + look.name.toUpperCase().padEnd(13) + '"')
  ].join('\n') + '\n';
  return { bytes: Buffer.concat(frames), tables };
}

module.exports = { catLooks, charmArt };
