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
    '..t.aaaaaa..',
    '..raaaaacaa.',
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

function runArt(look) {
  const portrait = look.art.split('\n');
  return poses.map(({ body, headY }) => {
    const tailRow = body.findIndex(row => row.includes('r'));
    const tailColumn = body[tailRow].indexOf('r');
    return body.map((row, y) => [...row].map((pixel, x) => {
      const marking = portrait[y - headY]?.[x];
      if (x >= 5 && y - headY < 6 && marking && marking !== '.') return marking;
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
