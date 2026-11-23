const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { catLooks, charmArt } = require('./tools/cat-looks.cjs');
const { actorSprites } = require('./tools/sprites.cjs');
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
fs.writeFileSync(path.join(build, 'actors.bin'), actorSprites());
const looks = catLooks();
fs.writeFileSync(path.join(build, 'cat-looks.bin'), looks.bytes);
fs.writeFileSync(path.join(build, 'cat-looks.inc'), looks.tables);
fs.writeFileSync(path.join(build, 'charms.bin'), charmArt());
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
const sites = level => level.reduce((cells, tile, cell) => {
  if (tile === TILE.blueFly) cells.push(cell);
  return cells;
}, []);
const gardenRares = sites(map);
const greenhouseRares = sites(secondMap);
const rareCells = [...gardenRares, ...greenhouseRares];
const lanternFlies = secondMap.reduce((cells, tile, cell) => {
  if (tile === TILE.lantern) cells.push(cell + 4, cell + 6, cell + 8);
  return cells;
}, []);
const mapAddress = (cells, prefix) => cells.map(cell => prefix + '(LEVEL_MAP+' + cell + ')');
fs.writeFileSync(path.join(build, 'cat-routes.inc'), [
  pickupTable('clue_start', [0, gardenRares.length]),
  pickupTable('clue_end', [gardenRares.length, rareCells.length]),
  pickupTable('clue_tile_lo', mapAddress(rareCells, '<')),
  pickupTable('clue_tile_hi', mapAddress(rareCells, '>')),
  pickupTable('clue_x_lo', rareCells.map(cell => (cell % MAP_STRIDE * 8) & 255)),
  pickupTable('clue_x_hi', rareCells.map(cell => (cell % MAP_STRIDE * 8) >> 8)),
  pickupTable('cache_fly_lo', mapAddress(lanternFlies, '<')),
  pickupTable('cache_fly_hi', mapAddress(lanternFlies, '>')),
  'CACHE_FLIES = ' + lanternFlies.length
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
