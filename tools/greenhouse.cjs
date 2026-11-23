const { WIDTH, HEIGHT, TILE } = require('./garden.cjs');

function greenhouse() {
  const map = Buffer.alloc(WIDTH * HEIGHT);
  const put = (column, row, tile) => { map[row * WIDTH + column] = TILE[tile]; };
  for (let x = 0; x < WIDTH; x++) {
    const bay = x % 16;
    put(x, 7 + Math.floor(Math.abs(bay - 8) / 2), bay < 8 ? 'roofLeft' : 'roofRight');
    if (bay === 0) {
      for (let y = 11; y <= 22; y++) put(x, y, 'glassFrame');
    } else if (bay === 4 || bay === 11) {
      put(x, 13 + (x >> 2) % 4, 'glass');
    }
    if (bay >= 6 && bay <= 8) {
      put(x, 20, 'leaf');
      put(x, 21, 'leaf');
      put(x, 22, 'trunk');
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
