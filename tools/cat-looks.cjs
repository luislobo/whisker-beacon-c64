const { runArt } = require('./cat-run.cjs');
const { packCat } = require('./pack-cat.cjs');

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
..a.aaaaaaa.
..baccaaac..
...aacaaab..
...aacaaa...`;

const calicoStand = calicoBody + "\n...cc..aa...\n...cc..aa...";

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

const siameseBody = `......b...b.
......bb.bb.
.ba...bbbbb.
b.....bcbcb.
.b....bbabb.
..b..aaaaba.
..baaaaaaa..
...aaaaaaa..`;

const siamese = siameseBody + "\n....a...a...\n....a...a...\n....b...b...\n....b...b...";

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
..a..aaaaaa.
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

const looks = [
  { name: 'Ginger Pip', art: ginger, color: 8 },
  { name: 'Tuxedo', art: tuxedo, color: 12 },
  { name: 'Black Cat', art: black, color: 7, ink: { a: 1, b: 1, c: 2 } },
  { name: 'Calico', art: calicoStand, color: 8 },
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

const poses = { stand: '', stride: '', turn, launch: stretch, air: jump, landing, slide, clue, spark, sit };
const height = 13;
// VIC-II multicolor sprites use %10 for their own color and %11 for shared white.
const ink = { '.': 0, a: 2, b: 1, c: 3 };
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
  const ribbon = ['   .. ..', '   #####', '    ###.', '     ##.', '    #.#.', '   ##.##'];
  const brass = ['...b...', '..ggb..', '..ggb..', '.ggggb.', '.ggggb.', 'bbgggbb', '...b...'];
  const tucked = ['..bbb..', '.ggggb.', 'gggggbb', '..b.b..'];
  const glint = ['..w..', '.www.', '..w..'];
  const frames = [0, 1].map(left => charmFrame(ribbon, '#', 8, 0, left));
  for (const swing of [-1, 0, 1]) {
    for (const left of [0, 1]) {
      frames.push(charmFrame(brass, 'g', 13, 0, left, swing));
      frames.push(charmFrame(brass, 'b', 13, 0, left, swing));
    }
  }
  for (const left of [0, 1]) {
    frames.push(charmFrame(tucked, 'g', 12, 0, left));
    frames.push(charmFrame(tucked, 'b', 12, 0, left));
  }
  for (const left of [0, 1]) frames.push(charmFrame(glint, 'w', 18, 0, left));
  return Buffer.concat(frames);
}

function charmFrame(rows, ink, xOrigin, yOrigin, left, swing = 0) {
  const bytes = Buffer.alloc(64);
  for (const [y, row] of rows.entries()) {
    for (const [column, pixel] of [...row].entries()) {
      if (pixel !== ink) continue;
      const x = xOrigin + column + (y >= 3 ? swing : 0);
      const position = left ? 23 - x : x;
      bytes[(yOrigin + y) * 3 + (position >> 3)] |= 128 >> (position & 7);
    }
  }
  return bytes;
}

function catLooks() {
  const packets = [];
  let offset = 0;
  let runPoses;
  const titleCats = [];
  const labels = [];
  for (const [index, look] of looks.entries()) {
    labels.push(`cat_look_${index} = cat_look_bits + ${offset}`);
    const frames = [];
    const [reach, ...run] = runArt(look);
    runPoses = run.length;
    const palette = { ...ink, ...look.ink };
    for (const [pose, frame] of Object.entries(poses)) {
      const art = pose === 'stand' ? look.art : pose === 'stride' ? reach : actionArt(look, frame, pose);
      const packed = packFrame(art, palette);
      frames.push(packed);
      if (pose === 'sit') {
        const blinking = art.split('\n').map((row, y) => y === 3 ? row.replaceAll('c', 'a') : row).join('\n');
        titleCats.push({ name: look.name.toUpperCase(), frames: [packed, packFrame(blinking, palette)] });
      }
    }
    frames.push(...run.map(art => packFrame(art, palette)));
    const packet = packCat(Buffer.concat(frames));
    packets.push(packet);
    offset += packet.length;
  }
  const tables = [
    `CAT_LOOKS = ${looks.length}`,
    `CAT_POSES = ${Object.keys(poses).length}`,
    `CAT_RUN_EXTRA = ${runPoses}`,
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
  return { bytes: Buffer.concat(packets), tables, titleCats };
}

module.exports = { catLooks, charmArt };
