const WIDTH = 128;
const HEIGHT = 25;
const TILE = {
  sky: 0, star: 1, cloud: 2, leaf: 3, trunk: 4, flower: 5, roots: 6,
  moon: 7, blueFly: 8, firefly: 9, post: 10, lamp: 11, litLamp: 12,
  pineLeft: 13, pineRight: 14, mist: 15,
  grass: 16, soil: 17, stone: 18, mushroom: 19, pavers: 20, cracked: 21, shaking: 22, gate: 23,
  glass: 80, glassFrame: 81, roofLeft: 82, roofRight: 83, bell: 84, lantern: 85,
  brightLantern: 86, glow: 87, glassBeam: 88, glassJoin: 89, roofCap: 90,
  paneGlint: 91, chain: 92, basket: 93, vineLeft: 94, vineRight: 95,
  fern: 96, flowerPot: 97, rootsPot: 98, sill: 99,
  beaconCrown: 100, beaconLeft: 101, beaconRight: 102, beaconBase: 103,
  lanternCrown: 104
};

const tiles = {
  star:        ['....','....','.1..','....','....','....','....','....'],
  cloud:       ['....','....','...1','....','.1.1','..1.','.1.1','1.1.'],
  leaf:        ['.11.','.11.','1111','1111','1111','1111','1111','1111'],
  trunk:       ['.22.','.22.','.222','.22.','.22.','222.','.22.','.22.'],
  flower:      ['....','....','.2..','212.','.1..','.1.1','.11.','.1..'],
  roots:       ['....','....','....','...1','1.11','1111','2112','2222'],
  moon:        ['.33.','33..','3...','3...','3...','33..','.333','..3.'],
  blueFly:     ['.33.','.33.','3333','3..3','3..3','3333','.33.','.33.'],
  firefly:     ['....','3..3','.33.','3333','.33.','.33.','....','....'],
  post:        ['.22.','.22.','.22.','.22.','.22.','.22.','2222','2222'],
  lamp:        ['3333','3..3','3..3','3..3','3..3','3333','.22.','.22.'],
  litLamp:     ['3333','3.33','3333','3333','3333','3333','.33.','.33.'],
  pineLeft:    ['....','....','...1','...1','..11','..11','.111','.111'],
  pineRight:   ['....','....','1...','1...','11..','11..','111.','111.'],
  mist:        ['.1.1','1.1.','....','....','1.1.','.1.1','....','....'],
  grass:       ['3333','3333','3232','2322','2222','2122','2221','2222'],
  soil:        ['2222','2212','2222','1222','2222','2221','2222','2122'],
  stone:       ['3333','3333','2222','2.22','2222','22.2','2222','.22.'],
  mushroom:    ['.33.','3133','3333','.22.','.22.','.22.','2222','2222'],
  pavers:      ['3333','3333','2221','2221','2221','1111','1222','1222'],
  cracked:     ['3333','3333','22.2','2.22','2.22','22.2','2.22','.22.'],
  shaking:     ['3.33','3333','2.22','.22.','22.2','2.2.','.22.','....'],
  gate:        ['2323','2333','2323','2323','2323','2323','2333','2323'],
  glass:       ['....','...1','..1.','.1..','....','...1','....','....'],
  glassFrame:  ['.1..','.1..','.1..','.1..','.1..','.1..','.1..','.1..'],
  roofLeft:    ['..1.','..1.','.1..','.1..','1...','1...','....','....'],
  roofRight:   ['.1..','.1..','..1.','..1.','...1','...1','....','....'],
  bell:        ['.33.','.33.','.33.','.33.','3333','3333','.11.','.33.'],
  lantern:     ['3333','3..3','3..3','3.13','3..3','3333','.22.','.22.'],
  brightLantern:['3333','3.33','3333','3333','3333','3333','.33.','.33.'],
  glow:        ['....','..1.','....','.3..','...1','....','..1.','....'],
  glassBeam:   ['....','....','....','1111','....','....','....','....'],
  glassJoin:   ['.1..','.1..','.1..','1111','.21.','.1..','.1..','.1..'],
  roofCap:     ['....','.22.','2112','1..1','....','....','....','....'],
  paneGlint:   ['....','...1','..1.','.1..','1...','...1','..1.','....'],
  chain:       ['..1.','..2.','..1.','..1.','..2.','..1.','..1.','..2.'],
  basket:      ['.3..','131.','3133','2332','2222','.22.','....','....'],
  vineLeft:    ['..1.','..1.','.21.','...1','..1.','.21.','..1.','....'],
  vineRight:   ['.1..','.12.','..1.','.1..','.12.','.1..','....','....'],
  fern:        ['....','...2','1.21','.2.1','..21','2112','.212','..1.'],
  flowerPot:   ['....','..2.','121.','.12.','..1.','2122','.22.','.22.'],
  rootsPot:    ['....','..1.','..1.','2222','2112','.22.','.22.','.22.'],
  sill:        ['....','....','1111','2121','1111','....','....','....'],
  beaconCrown: ['.33.','.33.','....','.33.','.33.','3333','3333','3333'],
  beaconLeft:  ['....','3...','.3..','..3.','..3.','.3..','3...','....'],
  beaconRight: ['....','...3','..3.','.3..','.3..','..3.','...3','....'],
  beaconBase:  ['.22.','.22.','.22.','2222','3333','3333','2222','2222'],
  lanternCrown:['....','.33.','3333','3..3','3..3','3333','.33.','.33.']
};

const font = {
  'A':[14,17,17,31,17,17,17], 'B':[30,17,17,30,17,17,30],
  'C':[14,17,16,16,16,17,14], 'D':[30,17,17,17,17,17,30],
  'E':[31,16,16,30,16,16,31], 'F':[31,16,16,30,16,16,16],
  'G':[14,17,16,23,17,17,15], 'H':[17,17,17,31,17,17,17],
  'I':[31,4,4,4,4,4,31], 'K':[17,18,20,24,20,18,17], 'L':[16,16,16,16,16,16,31],
  'M':[17,27,21,21,17,17,17], 'N':[17,25,21,19,17,17,17],
  'O':[14,17,17,17,17,17,14], 'P':[30,17,17,30,16,16,16], 'Q':[14,17,17,17,21,18,13],
  'R':[30,17,17,30,20,18,17], 'S':[15,16,16,14,1,1,30],
  'T':[31,4,4,4,4,4,4], 'U':[17,17,17,17,17,17,14], 'V':[17,17,17,17,17,10,4],
  'W':[17,17,17,21,21,21,10], 'X':[17,17,10,4,10,17,17], 'Y':[17,17,10,4,4,4,4],
  'Z':[31,1,2,4,8,16,31],
  '0':[14,17,19,21,25,17,14], '1':[4,12,4,4,4,4,14], '2':[14,17,1,2,4,8,31],
  '3':[30,1,1,14,1,1,30], '4':[2,6,10,18,31,2,2], '5':[31,16,16,30,1,1,30],
  '6':[14,16,16,30,17,17,14], '7':[31,1,2,4,8,8,8], '8':[14,17,17,14,17,17,14],
  '9':[14,17,17,15,1,1,14], '*':[0,4,21,14,21,4,0], '+':[0,4,4,31,4,4,0], ':':[0,0,4,0,4,0,0], '.':[0,0,0,0,0,0,4], '/':[1,1,2,4,8,16,16], '-':[0,0,0,31,0,0,0]
};

function glyphs() {
  const output = Buffer.alloc(2048);
  for (const [name, bitmap] of Object.entries(tiles)) {
    for (const [y, row] of bitmap.entries()) {
      output[8 * TILE[name] + y] = parseInt(row.replaceAll('.', '0'), 4);
    }
  }
  for (const [letter, rows] of Object.entries(font)) {
    const code = letter.charCodeAt(0) + (/[A-Z]/.test(letter) ? 128 : 0);
    for (const [y, row] of rows.entries()) output[8 * code + y] = row << 2;
  }
  return output;
}

function placeBeacon(map) {
  const column = 125;
  for (let row = 18; row <= 22; row++) {
    map.fill(TILE.sky, row * WIDTH + 123, row * WIDTH + 128);
  }
  map[19 * WIDTH + column] = TILE.beaconCrown;
  map[20 * WIDTH + column - 1] = TILE.beaconLeft;
  map[20 * WIDTH + column] = TILE.lamp;
  map[20 * WIDTH + column + 1] = TILE.beaconRight;
  map[21 * WIDTH + column] = TILE.post;
  map[22 * WIDTH + column] = TILE.beaconBase;
}

function garden() {
  const map = Buffer.alloc(WIDTH * HEIGHT);
  const put = (column, row, tile) => { map[row * WIDTH + column] = TILE[tile]; };
  for (let x = 0; x < WIDTH; x++) {
    if (x % 13 === 3 || x % 19 === 1) put(x, 4 + (x * 23 % 9), 'star');
    const ridge = 18 + Math.round(2 * Math.sin(x / 7) + Math.sin(x / 3));
    put(x, ridge, 'cloud');
    for (let row = ridge + 1; row <= 21; row++) put(x, row, 'mist');
  }
  for (const x of [20, 62, 107]) put(x, 5, 'moon');
  for (const x of [3, 8, 13, 25, 29, 37, 46, 50, 61, 73, 82, 91, 96, 108, 122]) {
    const crown = 11 + x % 5;
    for (let row = crown; row < 21; row++) {
      put(x, row, 'leaf');
      const wide = row - crown > 3 ? 2 : 1;
      put(x-wide, row, 'pineLeft');
      put(x+wide, row, 'pineRight');
      if (wide === 2) {
        put(x-1, row, 'leaf');
        put(x+1, row, 'leaf');
      }
    }
    for (let row = 21; row <= 22; row++) put(x, row, 'trunk');
  }
  const banks = [[0,24],[28,48],[52,70],[75,91],[95,111],[115,128]];
  for (const [first,last] of banks) {
    for (let x=first; x<last; x++) {
      put(x,23,'grass');
      put(x,24,'soil');
      if (x % 6 === 2) put(x,22,'flower');
    }
  }
  for (const [first, length, row] of [[15,5,19],[31,4,20],[41,4,19],[57,5,20],[64,4,18],
    [77,5,19],[85,4,20],[100,5,19],[119,4,20]]) {
    for (let x=first; x<first+length; x++) put(x,row,'stone');
  }
  for (const x of [11, 24, 36, 54, 66, 80, 101, 118]) {
    if (map[22 * WIDTH + x] === TILE.sky) put(x, 22, 'fern');
  }
  for (const [x,y] of [[8,21],[17,17],[29,21],[44,17],[54,21],[66,16],[77,21],
    [87,18],[97,21],[109,21],[120,18],[124,21]]) put(x,y,'firefly');
  put(16,19,'mushroom');
  for (const [first, last] of [[21,26],[27,32],[34,39]]) {
    for (let x = first; x < last; x++) put(x,11,'stone');
  }
  put(22,9,'blueFly');
  placeBeacon(map);
  return map;
}

function gardenColors(map) {
  return Buffer.from(Array.from({ length: HEIGHT }, (_, row) => {
    if (row === 0) return 1; // Hires HUD ink.
    if (row === 1) return 3;
    const tiles = map.subarray(row * WIDTH, (row + 1) * WIDTH);
    if (tiles.includes(TILE.blueFly)) return 11; // Cyan for the rare firefly.
    const gold = [TILE.stone, TILE.moon, TILE.firefly, TILE.bell, TILE.lantern,
      TILE.lanternCrown, TILE.beaconCrown, TILE.lamp, TILE.beaconBase];
    return gold.some(tile => tiles.includes(tile)) ? 15 : 13;
  }));
}

module.exports = { glyphs, garden, gardenColors, placeBeacon, WIDTH, HEIGHT, TILE };
