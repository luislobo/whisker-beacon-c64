const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { playerSprites } = require('./tools/sprites.cjs');
const { glyphs, gardenColors, TILE } = require('./tools/garden.cjs');
const { longLevel } = require('./tools/long-levels.cjs');
const { MAP_STRIDE, packMap } = require('./tools/pack-map.cjs');
const { score } = require('./tools/music.cjs');

const root = __dirname;
const build = path.join(root, 'build');
const program = path.join(build, 'whisker-beacon.prg');
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--disk')) throw Error('Usage: node build.cjs [--disk]');
fs.mkdirSync(build, { recursive: true });
fs.writeFileSync(path.join(build, 'cats.bin'), playerSprites());
fs.writeFileSync(path.join(build, 'tiles.bin'), glyphs());
const gardenBackgrounds = new Map();
const map = longLevel(false, gardenBackgrounds);
fs.writeFileSync(path.join(build, 'garden.bin'), packMap(map));
fs.writeFileSync(path.join(build, 'garden-colors.bin'), gardenColors(map));
const greenhouseBackgrounds = new Map();
const secondMap = longLevel(true, greenhouseBackgrounds);
fs.writeFileSync(path.join(build, 'greenhouse.bin'), packMap(secondMap));
const flyCount = level => level.reduce((count, tile) =>
  count + (tile === TILE.firefly ? 1 : tile === TILE.lantern ? 3 : 0), 0);
fs.writeFileSync(path.join(build, 'map.inc'), [
  `MAP_STRIDE = ${MAP_STRIDE}`,
  `GARDEN_FLIES = ${flyCount(map)}`,
  `GREENHOUSE_FLIES = ${flyCount(secondMap)}`
].join('\n') + '\n');
fs.writeFileSync(path.join(build, 'greenhouse-colors.bin'), gardenColors(secondMap));
// Group scenery tiles by page so a pickup scans only its own row segment.
const pickupTiles = [[0, 0]];
function pickupPages(backgrounds) {
  const pages = Array(MAP_STRIDE * 25 / 256).fill(0);
  let previousPage = -1;
  for (const [cell, tile] of [...backgrounds].sort(([a], [b]) => a - b)) {
    const page = cell >> 8;
    if (page !== previousPage) {
      if (previousPage >= 0) pickupTiles.push([0, 0]);
      previousPage = page;
      pages[page] = pickupTiles.length;
    }
    pickupTiles.push([cell & 255, tile]);
  }
  pickupTiles.push([0, 0]);
  return pages;
}
const gardenPages = pickupPages(gardenBackgrounds);
const greenhousePages = pickupPages(greenhouseBackgrounds);
if (pickupTiles.length > 255) throw Error('Too many pickup backgrounds');
function pickupTable(label, values) {
  return label + ':\n' + Array.from({ length: Math.ceil(values.length / 16) }, (_, line) =>
    '    .byte ' + values.slice(line * 16, line * 16 + 16).join(',')).join('\n');
}
fs.writeFileSync(path.join(build, 'pickup-backgrounds.inc'), [
  pickupTable('garden_pickup_start', gardenPages),
  pickupTable('greenhouse_pickup_start', greenhousePages),
  pickupTable('pickup_column', pickupTiles.map(([column]) => column)),
  pickupTable('pickup_scenery', pickupTiles.map(([, tile]) => tile))
].join('\n') + '\n');
fs.writeFileSync(path.join(build, 'score.inc'), score());
execFileSync(process.env.TASS64 || '64tass', [
  '--cbm-prg', '-a', '-o', program,
  '--vice-labels', '--labels=' + path.join(build, 'symbols.labels'),
  path.join(root, 'src/game.asm')
], { cwd: root, stdio: 'inherit' });

if (args.includes('--disk')) {
  const disk = path.join(build, 'whisker-beacon.d64');
  execFileSync(process.env.C1541 || 'c1541', [
    '-format', 'whisker beacon,wb', 'd64', disk,
    '-write', program, 'whisker beacon'
  ], { cwd: root, stdio: 'inherit' });
}
