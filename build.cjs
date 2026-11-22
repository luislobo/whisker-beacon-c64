const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { playerSprites } = require('./tools/sprites.cjs');
const { glyphs, garden } = require('./tools/garden.cjs');
const { score } = require('./tools/music.cjs');

const root = __dirname;
const build = path.join(root, 'build');
fs.mkdirSync(build, { recursive: true });
fs.writeFileSync(path.join(build, 'cats.bin'), playerSprites());
fs.writeFileSync(path.join(build, 'tiles.bin'), glyphs());
fs.writeFileSync(path.join(build, 'garden.bin'), garden());
fs.writeFileSync(path.join(build, 'score.inc'), score());
execFileSync(process.env.TASS64 || '64tass', [
  '--cbm-prg', '-a', '-o', path.join(build, 'whisker-beacon.prg'),
  '--vice-labels', '--labels=' + path.join(build, 'symbols.labels'),
  path.join(root, 'src/game.asm')
], { cwd: root, stdio: 'inherit' });
