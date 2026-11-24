const firstGlyph = 124;
const characterSlots = [
  ...Array.from({ length: 69 }, (_, index) => firstGlyph + index),
  ...Array.from({ length: 37 }, (_, index) => 219 + index)
];
const skyPeriod = 256;
const treesPeriod = 64;

function sunset(x, y) {
  // Dark cloud streaks and a low sun behind the Rain Gallery windows.
  const sun = (x - 116) ** 2 / 81 + (y - 12) ** 2 / 100;
  const sunCore = (x - 116) ** 2 / 36 + (y - 11.5) ** 2 / 16;
  if (sun < 1 && !(y >= 18 && y % 3 === 0)) return sunCore < 1 ? 3 : 2;
  if ((y === 5 || y === 6) && (x < 29 || (x >= 159 && x < 186))) return 1;
  if (y === 11 && x > 194 && x < 224) return 1;
  if (y > 20 || (y === 20 && (x & 1) === 0)) return 2;
  return 0;
}

function treeline(x, y) {
  const trees = [[4,9],[14,15],[22,9],[32,15],[46,12],[57,9]];
  let height = 0;
  for (const [center, peak] of trees) {
    const distance = Math.min(Math.abs(x - center), treesPeriod - Math.abs(x - center));
    const slope = distance * 3;
    height = Math.max(height, peak - slope);
  }
  if (y >= 13 || y >= 15 - height) return 1;
  return y < 2 || y % 3 === 0 ? 2 : 0;
}

function galleryParallax(charset) {
  const glyphs = new Map();
  const tables = [];
  function addRows(draw, period, rowCount) {
    for (let row = 0; row < rowCount; row++) {
      tables.push(Buffer.from(Array.from({ length: period }, (_, start) => {
        const tile = Buffer.alloc(8);
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 4; x++) {
            tile[y] |= draw((start + x) % period, row * 8 + y) << (6 - x * 2);
          }
        }
        const key = tile.toString('hex');
        if (!glyphs.has(key)) {
          const next = characterSlots[glyphs.size];
          if (next === undefined) throw Error('Gallery parallax exceeds the spare character slots');
          if (charset.subarray(next * 8, next * 8 + 8).some(Boolean)) throw Error('Gallery parallax overlaps a game glyph');
          glyphs.set(key, next);
          tile.copy(charset, next * 8);
        }
        return glyphs.get(key);
      })));
    }
  }
  addRows(sunset, skyPeriod, 3);
  addRows(treeline, treesPeriod, 2);
  return Buffer.concat(tables);
}

module.exports = { galleryParallax };
