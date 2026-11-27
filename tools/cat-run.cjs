// Key poses of a gallop. The reach leads into forepaw contact, compression,
// tuck, hind-paw contact, and push-off. Head bob is separate from the pose.
const poses = [
  { headY: 1, body: [
    '............',
    '.tt.........',
    'tt.t........',
    '...tt.......',
    '....ta......',
    '....aaaa....',
    '...aaaaaa...',
    '..aaaaaaaa..',
    '..aaabaacaa.',
    '.aaab...baaa',
    'aab......bap',
    'pp.........p',
    '............'
  ] },
  { headY: 2, body: [
    '............',
    '............',
    '.tt.........',
    'tt.tt.......',
    '.....t......',
    '....aaaa....',
    '...aaaaaa...',
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
    '..ttt.......',
    '.tt..ta.....',
    '....aaaa....',
    '...aaaaaa...',
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
    '....t.......',
    '..tt.ta.....',
    'tt..taaa....',
    '....aaaaa...',
    '...aaaaaaa..',
    '....aabacaa.',
    '....aa.baap.',
    '.....ab.pp..',
    '.....pp.....',
    '............'
  ] },
  { headY: 1, body: [
    '............',
    '............',
    '..tt........',
    '.tt.tt......',
    '.....ta.....',
    '....aaaa....',
    '...aaaaaa...',
    '...aaaaaaa..',
    '...aaabacaa.',
    '...aab..bapa',
    '..aab....pp.',
    '..ba........',
    '..pp........'
  ] },
  { headY: 0, body: [
    '.tt.........',
    'tt.tt.......',
    '.....t......',
    '......a.....',
    '.....aaaa...',
    '....aaaaaa..',
    '...aaaaaaa..',
    '...aabaaacaa',
    '..aaab...bap',
    '.aaab....pp.',
    '.aab........',
    'app.........',
    '............'
  ] }
];

function runArt(look) {
  const portrait = look.art.split('\n');
  return poses.map(({ body, headY }) => body.map((row, y) => {
    return [...row].map((pixel, x) => {
      const marking = portrait[y - headY]?.[x];
      if (x >= 5 && y - headY < 6 && marking && marking !== '.') return marking;
      if (pixel === 't') {
        if (look.name === 'Bobtail' && x < 3) return '.';
        if (x % 3 === 0) return 'b';
        return 'a';
      }
      if (pixel === 'p') return look.name === 'Siamese' ? 'b' : 'c';
      if (pixel === 'a' && x < 8 && (marking === 'b' || marking === 'c')) return marking;
      if (pixel === '.' && look.name === 'Fluffy Cat' && row[x + 1] === 't') return 'a';
      return pixel;
    }).join('');
  }).join('\n'));
}

module.exports = { runArt };
