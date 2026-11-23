const { WIDTH, HEIGHT, TILE } = require('./garden.cjs');

function greenhouse() {
  const map = Buffer.alloc(WIDTH * HEIGHT);
  const put = (column, row, tile) => { map[row * WIDTH + column] = TILE[tile]; };
  for (let x = 0; x < WIDTH; x++) {
    const bay = x % 16;
    const partition = bay === 0 || bay === 8;
    const roofRow = 7 + Math.floor(Math.abs(bay - 8) / 2);
    put(x, roofRow, bay === 8 ? 'roofCap' : bay < 8 ? 'roofLeft' : 'roofRight');
    for (let y = roofRow + 1; y <= 22; y++) {
      if (y === 15 || y === 19) put(x, y, partition ? 'glassJoin' : 'glassBeam');
      else if (partition) put(x, y, 'glassFrame');
      else if ((bay === 3 && y === 13) || (bay === 11 && y === 17)) put(x, y, 'paneGlint');
    }
  }
  for (const x of [22, 50, 82, 113]) put(x, 4 + (x & 1), 'moon');
  for (const x of [5, 12, 19, 29, 40, 55, 62, 72, 87, 104, 121]) put(x, 5 + x % 2, 'star');

  for (const x of [5, 25, 47, 67, 88, 104, 120]) {
    for (let y = 12; y <= 14; y++) put(x, y, 'chain');
    put(x, 15, 'basket');
    put(x - 1, 16, 'vineLeft');
    put(x + 1, 16, 'vineRight');
  }
  for (const [first, last] of [[3,12],[21,31],[35,46],[57,63],[74,81],[89,98],[113,124]]) {
    for (let x = first; x < last; x++) {
      put(x, 22, 'sill');
      if (x % 4 === 0) {
        put(x, 21, 'rootsPot');
        put(x + 1, 20, 'fern');
      } else if (x % 4 === 2) {
        put(x, 21, 'flowerPot');
      }
    }
  }
  for (const [first, last] of [[0,53],[57,81],[85,109],[112,128]]) {
    for (let x = first; x < last; x++) {
      put(x, 23, 'pavers');
      put(x, 24, 'soil');
    }
  }
  for (const [first, last, row] of [[16,19,21],[24,28,19],[40,46,20],[57,62,19],
    [70,76,18],[88,94,19],[99,104,18],[116,121,20]]) {
    for (let x = first; x < last; x++) put(x, row, 'stone');
  }
  for (const [x,y] of [[8,21],[13,21],[23,21],[33,21],[44,21],[50,21],
    [61,21],[87,21],[115,21]]) put(x,y,'firefly');
  put(18, 22, 'bell');
  put(30, 21, 'gate');
  put(30, 22, 'gate');
  for (let x = 40; x < 46; x++) put(x, 20, 'cracked');
  put(67, 21, 'lantern');
  put(97, 17, 'blueFly');
  put(126, 20, 'lamp');
  put(126, 21, 'post');
  put(126, 22, 'post');
  return map;
}

module.exports = { greenhouse };
