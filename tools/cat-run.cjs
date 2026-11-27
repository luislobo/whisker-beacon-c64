// Key poses of a gallop. The reach leads into forepaw contact, compression,
// tuck, hind-paw contact, and push-off. Head bob is separate from the pose.
// r marks the tail root on the rump. t marks the tail beyond it.
const poses = [
  { headY: 1, body: [
    '............',
    '............',
    '............',
    'tt..........',
    'tt..........',
    '.t....aa....',
    '.tt...aaa...',
    '..ttaaaaaa..',
    '...raaaacaa.',
    '.aaaab..baaa',
    'aab......bap',
    'pp.........p',
    '............'
  ] },
  { headY: 2, body: [
    '............',
    '............',
    '............',
    '.tt.........',
    'ttt.........',
    '..ttaaaa....',
    '...raaaaa...',
    '...aaaaaaaa.',
    '..aaab.acaa.',
    '..aab...bapa',
    '.aab.....baa',
    '.pp......bap',
    '..........pp'
  ] },
  { headY: 3, body: [
    '............',
    '............',
    '............',
    '............',
    '.tttt.a.....',
    'tt..raaa....',
    't..aaaaaa...',
    '...aaaaaaa..',
    '...aabaacaa.',
    '....ab.bbaa.',
    '...aap.b.ba.',
    '....pp.p.bap',
    '.......p..pp'
  ] },
  { headY: 2, body: [
    '............',
    '............',
    '............',
    '............',
    '......a.....',
    '.....aaa....',
    '.tttaaaaa...',
    '.t.raaaaaa..',
    'tt..aabacaa.',
    '....aa.baap.',
    '.....ab.pp..',
    '.....pp.....',
    '............'
  ] },
  { headY: 1, body: [
    '............',
    '............',
    '............',
    '............',
    '.tt...a.....',
    'ttttaaaa....',
    '...raaaaa...',
    '...aaaaaaa..',
    '...aaabacaa.',
    '...aab..bapa',
    '..aab....pp.',
    '..ba........',
    '..pp........'
  ] },
  { headY: 0, body: [
    '............',
    '............',
    'tt..........',
    'tt....a.....',
    '.t....aaa...',
    '.tt...aaaa..',
    '..t..aaaaa..',
    '..ttabaaacaa',
    '...raa...bap',
    '..aaab...pp.',
    '.aab........',
    'app.........',
    '............'
  ] }
];

const slimCrown = ['...a...', '..aa.a.', '.aaaaa.'];
const runCrowns = {
  'Black Cat': slimCrown,
  Calico: ['..c..b.', '..aa.b.', '.aaaab.'],
  'Alley Cat': ['..a..b.', '..aa.a.', '.aaaaa.'],
  'Lantern Cat': slimCrown
};

function runCrown(look, portrait) {
  const custom = runCrowns[look.name];
  if (custom) return custom.map(row => '.....' + row);

  const tips = [...portrait[0]].flatMap((pixel, x) => x >= 5 && pixel !== '.' ? [x] : []);
  const near = tips[0];
  const far = tips[tips.length - 1];
  const folded = look.name === 'Scottish Fold';
  const high = Array(12).fill('.');
  const low = Array(12).fill('.');

  // The 3/4-view head shows more of the near ear. Folded tips sit low.
  if (!folded) high[near] = portrait[0][near];
  low[near] = portrait[1][near];
  low[near + 1] = portrait[1][near + 1];
  low[far] = portrait[folded ? 1 : 0][far];
  return [high, low, portrait[2]];
}

function runArt(look) {
  const portrait = look.art.split('\n');
  const crown = runCrown(look, portrait);
  return poses.map(({ body, headY }) => {
    const tailRow = body.findIndex(row => row.includes('r'));
    const tailColumn = body[tailRow].indexOf('r');
    return body.map((row, y) => [...row].map((pixel, x) => {
      const headRow = y - headY;
      const marking = portrait[headRow]?.[x];
      if (x >= 5 && headRow >= 0 && headRow < crown.length) return crown[headRow][x];
      if (x >= 5 && headRow < 6 && marking && marking !== '.') return marking;
      if (pixel === 'r') return 'a';
      if (pixel === 't') {
        if (look.name === 'Bobtail' && (x < tailColumn - 1 || y < tailRow - 2)) return '.';
        return x % 3 === 0 ? 'b' : 'a';
      }
      if (pixel === 'p') return look.name === 'Siamese' ? 'b' : 'c';
      if (pixel === 'a' && x < 8 && (marking === 'b' || marking === 'c')) return marking;
      if (pixel === '.' && look.name === 'Fluffy Cat' && row[x + 1] === 't') return 'a';
      return pixel;
    }).join('')).join('\n');
  });
}

module.exports = { runArt };
