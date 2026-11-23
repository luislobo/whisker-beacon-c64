// One character represents two horizontal multicolor sprite pixels.

const ginger = `.......a..a.
.......aa.a.
......aaaaa.
.b....ababba
ba...aaaaaa.
aa..aaaaacc.
.b.aaaaaaaa.
.baaabbaaaa.
..aaaabaaa..
..aaaaaaa...
...aa..aa...
...cc..cc...`;

const tuxedo = `......a...a.
......ab.ba.
......aaaaa.
.....abcbca.
.....aaaaaca
....aaaacca.
.b.aaaaacca.
.baaaaaacca.
..aaaaaacc..
...aa..ac...
...cc..cc...`;

const black = `......a...a.
......aa.aa.
.....aaaaaa.
.....aacaca.
.aa..aaaaaaa
a..aaaaaaaa.
b..aaaaabaa.
bbaaaaabaaa.
..aababaaba.
...ab...ab..
...bb...bb..`;

const calico = `......c..b..
......cc.bb.
......cbbbc.
..b..accbcba
.ba..aacbccc
.b...aacbbcc
.ac.aaaaaccc
..aacccaaac.
..aaccaacab.
...ccc..aa..
...cc...aa..`;

const bobtail = `.....a...a..
.....aa.aa..
....aaaaaaa.
....acacaba.
....aaaaaaac
.aa.aaaacca.
abaaaaaacca.
.baaaabaaa..
..aaabaaaa..
..baa..baa..
..ccc..ccc..`;

const fluffy = `......a..a..
.a....aa.aa.
aaa..aaaaaa.
aaaa.abcaba.
aaaa.aaaaaac
aaabaaaaaaaa
aaaaaaaaaac.
.aaaaaaaacc.
.aaabaacccc.
..aabacccca.
...aaa.aaaa.
...ccc..ccc.`;

const siamese = `.......b..b.
.......bb.b.
.......abbb.
.......acbc.
b.....aaabbb
.b....aaaabb
.b...aaaaaa.
.bbaaaaaaaa.
..aaaaaaaa..
...aa..aaa..
....a...a...
....b...b...
....b...b...`;

const fold = `.....aaa.aa.
.....baaabb.
.b..aaaaaa..
ba..aacaca..
ab..aaaaaaac
.a.aaaaaaaa.
.aaaaaaaaaa.
..aaaabbbaa.
...aaaaaaa..
...aa..aa...
...bb..bb...`;

const alley = `.......a.bb.
......ab..b.
......aaaaa.
..a...acaba.
.b.a.aaaaaab
.b....aaaab.
..a.baaaaaa.
..aaaababba.
...aaaaaba..
...ab...aa..
...bb...bb..`;

const lantern = `.c.....a..a.
cc.....aa.a.
.cc...aaaaa.
.c....acaca.
.b...aaaaaab
.b..aaaaaaa.
..baaaaaacc.
..aaaaaacca.
..aaaaaabaa.
...aa..aa...
...bb..bb...`;

const turn = `..a....a..a.
.aa....aa.a.
.b....aaaaa.
..b...acaca.
...b..aaaaaa
....baaaaac.
.....aaaaaa.
....aaabaaa.
...aaabaa...
...aa...aa..
...cc...cc..`;

const jump = `b.......a..a
ab......aa.a
.ba..aaaaaaa
..baaaaacaba
...aaaaaaaaa
....aaaaaac.
....aa..aa..
....bc..bc..`;

const landing = `.......a..a.
.aa....aaaa.
ab....aaaaa.
.b....acaca.
..b..aaaaaaa
...aaaaaaaa.
...aaabaaac.
..aaaaaaaac.
..cc...cccc.`;

const slide = `.........aa.
........aaaa
.......acaca
...bbaaaaaaa
.bbaaaaaaacc
baaaaaaaaaa.
...cc...cc..`;

const clue = `......a..a..
.c....aa.aa.
.cc..aaaaaa.
..b..aacaba.
..b.aaaaaaac
..b.aaaaaa..
..baaaaaaa..
...aaabaa...
...aa..aa...
...cc..cc...`;

const spark = `.b......c...
.ba.c.......
ab.....a..a.
ab....aa.aa.
.b....aaaaa.
..b..aababa.
..b..aaaaaaa
...baaaaaac.
...aaaaaaa..
...aa..aaa..
...cc...cc..`;

const sit = `.....a..a...
.....aa.aa..
....aaaaaaa.
....acacaba.
....aaaaaaac
.....aaaac..
.....aaaca..
....aaaaca..
.baaaaaaca..
bbaaaaacca..
.baabbccccb.
..bbbbbbbb..`;

const walk = `.......a..a.
.......aa.a.
..b...aaaaa.
.b....abacaa
.b...aaaaaa.
.ab.aaaaaac.
..baaaaaaaa.
..aaaabaaaa.
...aaaaaaa..
...aaa.aa...
..cc....cc..`;

const looks = [
  { name: 'Ginger Pip', art: ginger, color: 8 },
  { name: 'Tuxedo', art: tuxedo, color: 12 },
  { name: 'Black Cat', art: black, color: 7, ink: { a: 1, b: 1, c: 3 } },
  { name: 'Calico', art: calico, color: 8 },
  { name: 'Bobtail', art: bobtail, color: 14 },
  { name: 'Fluffy Cat', art: fluffy, color: 15 },
  { name: 'Siamese', art: siamese, color: 15 },
  { name: 'Scottish Fold', art: fold, color: 14 },
  { name: 'Alley Cat', art: alley, color: 5 },
  { name: 'Lantern Cat', art: lantern, color: 10 }
];

const stretch = `b........a.a
ab......aa.a
.ba...aaaaaa
..baaaaaacba
...aaaaaaaaa
....aaa..aca
.....ac.....
`;

const poses = { stand: '', stride: walk, turn, launch: stretch, air: jump, landing, slide, clue, spark, sit };
const height = 13;
const ink = { '.': 0, a: 3, b: 1, c: 2 };

// These details carry each silhouette from the portrait into the action poses.
function actionArt(look, frame, pose) {
  const rows = frame.split('\n').map(row => row.padEnd(12, '.').split(''));
  const feet = rows.length - 1;
  const slidePose = pose === 'slide';
  const firstEar = rows.findIndex(row => row.slice(7).includes('a'));
  switch (look.name) {
    case 'Tuxedo':
    case 'Calico':
    case 'Siamese':
      for (let y = 0; y <= feet; y++) {
        for (let x = 0; x < 12; x++) {
          if (rows[y][x] !== 'a') continue;
          if (look.name === 'Tuxedo' && x >= 8 && y >= feet - 3) rows[y][x] = 'c';
          if (look.name === 'Calico' && (x === 7 || x === 3)) rows[y][x] = 'c';
          if (look.name === 'Siamese' && (y === firstEar || y === feet || x === 11)) rows[y][x] = 'b';
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
      if (!slidePose && firstEar >= 0) rows[firstEar].fill('.', 7);
      break;
    case 'Alley Cat':
      if (!slidePose && firstEar >= 0) rows[firstEar][10] = '.';
      break;
    case 'Lantern Cat':
      for (const row of rows) {
        const tip = row.findIndex(pixel => pixel !== '.');
        if (tip >= 0 && tip <= 2) {
          row[tip] = 'c';
          break;
        }
      }
      break;
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

function catLooks() {
  const frames = [];
  const labels = [];
  for (const [index, look] of looks.entries()) {
    labels.push(`cat_look_${index} = cat_look_bits + ${frames.length * height * 3}`);
    for (const [pose, frame] of Object.entries(poses)) {
      const art = pose === 'stand' ? look.art : actionArt(look, frame, pose);
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

module.exports = { catLooks };
