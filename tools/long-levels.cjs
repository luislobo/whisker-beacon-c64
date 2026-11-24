const { WIDTH, HEIGHT, TILE, garden, placeBeacon, tileWriter } = require('./garden.cjs');
const { greenhouse } = require('./greenhouse.cjs');
const { MAP_STRIDE } = require('./pack-map.cjs');
const RAIN_GALLERY = 2;

const gardenSections = [
  {
    // Moonlit stream. Low stepping stones offer an alternate path across the water.
    scene: 'reed',
    pits: [[24,28],[51,55],[104,108]],
    ledges: [[22,7,21],[44,4,19],[51,4,21],[92,6,19],[105,2,21]],
    flies: [[9,21],[19,21],[25,19],[37,21],[47,17],[61,21],[75,21],[93,17],[112,21],[123,21]]
  },
  {
    // Orchard. Jump through the gaps in the canopy to reach the rare firefly.
    scene: 'orchard',
    pits: [[39,43],[92,97]],
    ledges: [[21,4,19],[34,5,20],[46,5,19],[53,4,16],[58,6,13],[81,4,20],[98,5,20]],
    flies: [[8,21],[19,21],[29,21],[38,18],[47,17],[64,21],[76,21],[86,21],[99,18],[115,21]],
    rare: [60,11]
  },
  {
    // Broken aqueduct. Short stone islands change the rhythm of the jumps.
    scene: 'ruins',
    pits: [[24,27],[30,34],[66,71],[100,104],[107,111]],
    ledges: [[27,3,22],[32,4,21],[51,7,19],[65,3,21],[83,5,18],[104,3,22],[109,4,21]],
    flies: [[8,21],[18,21],[28,20],[35,19],[48,21],[55,17],[73,21],[86,16],[99,21],[116,21]]
  },
  {
    // Mushroom dell. The mushroom serves the high secret, with a floor route below it.
    scene: 'orchard',
    pits: [[37,41],[79,83],[108,113]],
    ledges: [[23,5,19],[30,6,12],[39,5,20],[59,5,19],[79,3,21],[99,5,19],[109,3,21]],
    flies: [[8,21],[18,21],[27,17],[43,18],[56,21],[62,17],[73,21],[85,21],[99,17],[118,21]],
    spring: [26,19],
    rare: [32,10]
  },
  {
    // Beacon terraces. Closely spaced gaps and a long final staircase.
    scene: 'ruins',
    pits: [[28,32],[52,57],[80,84],[106,110]],
    ledges: [[23,4,20],[30,3,21],[45,5,19],[54,3,21],[76,4,19],[82,4,21],
      [101,4,20],[107,3,21],[114,3,20],[118,3,18]],
    flies: [[8,21],[20,21],[30,19],[38,21],[47,17],[60,21],[70,21],[85,19],[95,21],[114,18],[121,21]]
  }
];

const greenhouseSections = [
  {
    // Propagation racks. The first low shelf is reached from open floor.
    scene: 'racks',
    pits: [[31,35],[80,84],[109,113]],
    ledges: [[17,3,21],[29,4,20],[40,5,19],[61,4,19],[80,4,21],[102,4,19],[110,3,21]],
    flies: [[8,21],[18,22],[26,21],[34,21],[42,17],[57,21],[65,21],[75,21],[87,21],[117,21]]
  },
  {
    // Rain gallery. Floor lights reveal a cache while the rafters hide a star.
    scene: 'rain',
    pits: [[37,41],[68,72],[105,109]],
    ledges: [[26,5,19],[36,4,20],[48,5,19],[54,5,16],[60,4,13],[70,3,21],[96,4,19]],
    flies: [[8,21],[21,21],[30,17],[44,21],[52,17],[65,21],[74,21],[85,21],[97,17],[115,21]],
    lantern: 12,
    rare: [61,11]
  },
  {
    // Shade house. Dark glass and two shelf crawls bracket the open benches.
    scene: 'shade',
    pits: [[29,32],[56,60],[89,93],[109,114]],
    ledges: [[16,4,21],[28,4,21],[38,5,19],[57,3,21],[74,4,21],[88,4,20],[111,4,21]],
    flies: [[8,21],[18,22],[24,21],[32,19],[46,21],[60,19],[75,22],[81,21],[94,21],[116,21]]
  },
  {
    // Seed vault. A second light rewards the floor route; the high ledges lead to a star.
    scene: 'racks',
    pits: [[34,38],[68,73],[97,101],[116,120]],
    ledges: [[27,5,19],[35,4,21],[48,4,19],[54,5,16],[60,4,13],[69,3,21],[96,4,20],[118,3,21]],
    flies: [[8,21],[23,21],[30,17],[39,21],[51,17],[65,21],[75,21],[85,21],[96,18],[108,21],[121,21]],
    lantern: 12,
    rare: [62,11]
  },
  {
    // Observatory. The final stretch links alternating high and low paths to the beacon.
    scene: 'rain',
    pits: [[24,28],[44,48],[70,75],[100,105]],
    ledges: [[14,4,19],[25,3,21],[37,4,19],[45,3,21],[58,4,18],[71,4,21],
      [89,5,19],[102,3,21],[111,4,20],[117,4,18]],
    flies: [[8,21],[17,17],[23,21],[32,21],[39,17],[49,21],[60,16],[68,21],[78,21],[91,17],[107,21],[121,21]]
  }
];

function makeSection(design, glass, number, backgrounds) {
  const section = Buffer.alloc(WIDTH * HEIGHT);
  const put = tileWriter(section, backgrounds);
  const gallery = glass && number === RAIN_GALLERY;
  const pavers = gallery ? 'galleryPavers' : 'pavers';
  const benchTop = gallery ? 'galleryBench' : 'benchTop';
  const benchLeg = gallery ? 'galleryLeg' : 'benchLeg';
  for (let x = 0; x < WIDTH; x++) {
    if (glass) {
      const bay = design.scene === 'shade' ? 8 : design.scene === 'rain' ? 16 : 12;
      const pane = (x + number * WIDTH) % bay;
      put(x, 6, 'roofGlass');
      put(x, 7, gallery ? 'galleryEave' : pane ? 'eave' : 'eaveJoint');
      for (let y = 8; y <= 22; y++) {
        if (y === 13 || y === 18) put(x, y, gallery ? 'galleryRail' : pane ? 'windowRail' : 'railJoint');
        else if (pane === 0) put(x, y, gallery ? 'galleryMullion' : 'mullion');
        else if (gallery && y === 16 && pane >= 7 && pane <= 9) put(x, y, 'galleryPane');
        else if (design.scene === 'rain' && (pane === 2 || pane === 10) && y < 17) {
          if (gallery) {
            if ((x + y) % 4 === 0) put(x, y, 'galleryGlint');
          } else {
            put(x, y, (x + y) % 3 ? 'paneShade' : 'paneGlint');
          }
        } else if (design.scene === 'shade' && pane === 2 && y < 16) {
          put(x, y, y % 2 ? 'vineLeft' : 'vineRight');
        }
      }
      if (pane === 6) {
        put(x, 9, 'chain');
        put(x, 10, 'chain');
        put(x, 11, 'basket');
        put(x, 12, 'vineLeft');
      }
      if (pane === 4) {
        put(x, 20, 'greenhouseLeaves');
        put(x, 21, 'greenhouseStem');
        put(x, 22, 'greenhousePot');
      }
    } else {
      if (x % 13 === 3) put(x, 4 + (x * 23 % 9), 'star');
      const ridge = 16 + Math.round(2 * Math.sin((x + number * WIDTH) / 8));
      put(x, ridge, 'cloud');
      for (let y = ridge + 1; y <= 21; y++) put(x, y, 'mist');
      if (design.scene === 'orchard' && (x % 19 >= 4 && x % 19 <= 10)) {
        for (let y = 12 + Math.abs(x % 19 - 7); y <= 15; y++) put(x, y, 'leaf');
        if (x % 19 === 7) for (let y = 16; y <= 22; y++) put(x, y, 'trunk');
      }
      if (design.scene === 'ruins' && x % 21 < 2) {
        for (let y = 13; y <= 22; y++) put(x, y, 'ruinPillar');
      }
      if (design.scene === 'reed' && x % 7 === 4) put(x, 22, 'reed');
      if (x % 8 === 3) put(x, 22, 'fern');
    }
    if (design.pits.some(([first, last]) => x >= first && x < last)) {
      put(x, 24, 'water');
    } else {
      put(x, 23, glass ? pavers : 'grass');
      put(x, 24, 'soil');
    }
  }
  for (const [first, count, row] of design.ledges) {
    // Keep the full landing zone clear beside a gap. Low overlays become
    // stone edging at ground height, while the optional ledges frame the gap.
    if (design.pits.some(([left, right]) => first < right + 3 && first + count > left - 3)) {
      for (let x = first; x < first + count; x++) {
        if (!design.pits.some(([left, right]) => x >= left && x < right)) {
          put(x, 23, glass ? pavers : 'stone');
        }
      }
      continue;
    }
    for (let x = first; x < first + count; x++) put(x, row, glass ? benchTop : 'stone');
    if (glass && row <= 20) {
      for (let y = row + 1; y <= 22; y++) {
        put(first, y, benchLeg);
        put(first + count - 1, y, benchLeg);
      }
    }
  }
  if (number === 5) placeBeacon(section);
  for (const [x, y] of design.flies) put(x, y, 'firefly');
  if (design.rare) put(...design.rare, 'blueFly');
  if (design.spring) put(...design.spring, 'mushroom');
  if (design.lantern) {
    put(design.lantern, 20, 'lanternCrown');
    put(design.lantern, 21, 'lantern');
    put(design.lantern, 22, 'post');
  }
  put(3, 20, 'waymark');
  put(3, 21, 'post');
  return section;
}

function longLevel(glass, backgrounds = new Map()) {
  const sectionsBackgrounds = [new Map()];
  const first = glass ? greenhouse(sectionsBackgrounds[0]) : garden(sectionsBackgrounds[0]);
  for (let row = 19; row <= 22; row++) {
    for (let x = 124; x <= 126; x++) {
      if (first[row * WIDTH + x] !== TILE.firefly) first[row * WIDTH + x] = TILE.sky;
    }
  }
  const sections = [first, ...(glass ? greenhouseSections : gardenSections)
    .map((design, i) => {
      const local = new Map();
      sectionsBackgrounds.push(local);
      return makeSection(design, glass, i + 1, local);
    })];
  if (sections.length * WIDTH !== MAP_STRIDE) throw Error('Sections must fill the working map');
  const map = Buffer.alloc(MAP_STRIDE * HEIGHT);
  sections.forEach((section, index) => {
    for (let row = 0; row < HEIGHT; row++) {
      section.copy(map, row * MAP_STRIDE + index * WIDTH, row * WIDTH, (row + 1) * WIDTH);
    }
    for (const [cell, tile] of sectionsBackgrounds[index]) {
      const worldCell = Math.floor(cell / WIDTH) * MAP_STRIDE + index * WIDTH + cell % WIDTH;
      backgrounds.set(worldCell, tile);
    }
  });
  // A lantern spawns its three pickups during play. Record what is there now.
  for (let cell = 0; cell < map.length; cell++) {
    if (map[cell] !== TILE.lantern) continue;
    for (const distance of [4, 6, 8]) {
      const cache = cell + distance;
      if (map[cache]) backgrounds.set(cache, map[cache]);
    }
  }
  return map;
}

const galleryLampColumn = RAIN_GALLERY * WIDTH + greenhouseSections[RAIN_GALLERY - 1].lantern;
const galleryPlayerPage = RAIN_GALLERY * WIDTH / 32;
module.exports = { longLevel, galleryLampColumn, galleryPlayerPage };
