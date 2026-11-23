const { WIDTH, HEIGHT, placeBeacon, tileWriter } = require('./garden.cjs');

function greenhouse(backgrounds = new Map()) {
  const map = Buffer.alloc(WIDTH * HEIGHT);
  const put = tileWriter(map, backgrounds);
  // A continuous eave and closed window bays give the whole route one silhouette.
  for (let x = 0; x < WIDTH; x++) {
    const pane = x % 12;
    const post = pane === 0;
    put(x, 6, 'roofGlass');
    put(x, 7, post ? 'eaveJoint' : 'eave');
    for (let y = 8; y <= 22; y++) {
      if (y === 13 || y === 18) put(x, y, post ? 'railJoint' : 'windowRail');
      else if (post) put(x, y, 'mullion');
      else if ((y === 9 || y === 14) && pane === 1) put(x, y, 'glassSeal');
      else if ((pane === 9 && y === 10) || (pane === 4 && y === 15)) put(x, y, 'paneGlint');
      else if ((pane === 8 && y === 11) || (pane === 3 && y === 16)) put(x, y, 'paneShade');
    }
  }
  put(21, 4, 'moon');
  for (const x of [5, 12, 19, 29, 40, 55, 62, 72, 87, 104, 121]) put(x, 4 + x % 2, 'star');

  for (const x of [5, 25, 47, 67, 88, 104, 120]) {
    for (let y = 8; y <= 10; y++) put(x, y, 'chain');
    put(x - 1, 11, 'greenhouseLeaves');
    put(x, 11, 'basket');
    put(x + 1, 11, 'greenhouseLeaves');
    put(x - 1, 12, 'vineLeft');
    put(x + 1, 12, 'vineRight');
  }
  for (const x of [5, 9, 22, 27, 37, 43, 58, 62, 74, 78, 91, 95, 114, 119]) {
    put(x, 20, 'greenhouseLeaves');
    put(x, 21, 'greenhouseStem');
    put(x, 22, 'greenhousePot');
  }
  for (const [first, last] of [[0,53],[57,81],[85,109],[112,128]]) {
    for (let x = first; x < last; x++) {
      put(x, 23, 'pavers');
      put(x, 24, 'soil');
    }
  }
  for (const [first, last, row] of [[16,19,21],[24,28,19],[40,46,20],[57,62,19],
    [70,76,18],[88,94,19],[99,104,18],[116,121,20]]) {
    for (let x = first; x < last; x++) put(x, row, 'benchTop');
    for (let y = row + 1; y <= 22; y++) {
      put(first, y, 'benchLeg');
      put(last - 1, y, 'benchLeg');
    }
  }
  placeBeacon(map);
  for (const [x,y] of [[8,21],[13,21],[23,21],[33,21],[44,21],[50,21],
    [61,21],[87,21],[115,21]]) put(x,y,'firefly');
  put(17, 22, 'sky');
  put(18, 22, 'bell');
  put(19, 22, 'sky');
  put(30, 21, 'gate');
  put(30, 22, 'gate');
  for (let x = 40; x < 46; x++) put(x, 20, 'cracked');
  for (let x = 66; x <= 68; x++) put(x, 21, 'sky');
  put(67, 20, 'lanternCrown');
  put(67, 21, 'lantern');
  put(67, 22, 'post');
  put(97, 17, 'blueFly');
  return map;
}

module.exports = { greenhouse };
