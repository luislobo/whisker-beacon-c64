const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = __dirname;
const build = path.join(root, 'build');
fs.mkdirSync(build, { recursive: true });
execFileSync(process.env.TASS64 || '64tass', [
  '--cbm-prg', '-a', '-o', path.join(build, 'whisker-beacon.prg'),
  '--vice-labels', '--labels=' + path.join(build, 'symbols.labels'),
  path.join(root, 'src/game.asm')
], { cwd: root, stdio: 'inherit' });
