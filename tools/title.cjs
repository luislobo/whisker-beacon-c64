const { glyphs } = require('./garden.cjs');

const width = 160;
const height = 200;
const hiresWidth = width * 2;
const columns = hiresWidth / 8;
const sceneRow = 8;
const nameRow = 22;
const nameCells = 20;
const [black, white, , cyan, purple, green, blue, yellow, orange, brown,
  , charcoal, gray, lime, periwinkle, silver] = Array.from({ length: 16 }, (_, ink) => ink);
const font = glyphs();

function drawText(pixels, label, y) {
  const glyphWidth = 7;
  const advance = 9;
  const start = Math.floor((hiresWidth - label.length * advance + advance - glyphWidth) / 2);
  for (const [i, letter] of [...label].entries()) {
    const code = letter.charCodeAt(0) + (letter === ' ' ? 0 : 128);
    for (let row = 0; row < 7; row++) {
      for (let x = 0; x < glyphWidth; x++) {
        const source = Math.floor(5 * x / glyphWidth);
        if (!(font[code * 8 + row] & (64 >> source))) continue;
        pixels[(y + row) * hiresWidth + start + i * advance + x] = 1;
      }
    }
  }
}

// The logo strokes use a 24 by 18 grid and are rasterized at single-dot resolution.
const logoStrokes = {
  W: [[[0,0],[4,18],[7,18],[12,8],[17,18],[20,18],[24,0]]],
  H: [[[0,0],[0,18]], [[0,9],[24,9]], [[24,0],[24,18]]],
  I: [[[3,0],[21,0]], [[12,0],[12,18]], [[3,18],[21,18]]],
  S: [[[24,0],[4,0],[0,3],[0,6],[3,9],[21,9],[24,12],[24,15],[20,18],[0,18]]],
  K: [[[0,0],[0,18]], [[24,0],[7,9],[0,9]], [[7,9],[24,18]]],
  E: [[[24,0],[0,0],[0,18],[24,18]], [[0,9],[19,9]]],
  R: [[[0,18],[0,0],[20,0],[24,3],[24,6],[20,9],[0,9]], [[13,9],[24,18]]],
  B: [[[0,9],[0,0],[19,0],[23,3],[23,6],[19,9],[0,9],[0,18],[20,18],[24,15],[24,12],[20,9]]],
  A: [[[0,18],[0,6],[5,0],[19,0],[24,6],[24,18]], [[0,11],[24,11]]],
  C: [[[24,0],[5,0],[0,4],[0,14],[5,18],[24,18]]],
  O: [[[5,0],[19,0],[24,4],[24,14],[19,18],[5,18],[0,14],[0,4],[5,0]]],
  N: [[[0,18],[0,0],[24,18],[24,0]]]
};

function drawLogoWord(pixels, word, top, letterWidth, spacing) {
  const wordWidth = word.length * (letterWidth + spacing) - spacing;
  for (const [letterIndex, letter] of [...word].entries()) {
    const left = Math.floor((hiresWidth - wordWidth) / 2) + letterIndex * (letterWidth + spacing);
    for (const stroke of logoStrokes[letter]) {
      for (let i = 1; i < stroke.length; i++) {
        const [x1, y1] = stroke[i - 1];
        const [x2, y2] = stroke[i];
        const dx = (x2 - x1) * letterWidth / 24;
        const count = Math.ceil(Math.max(Math.abs(dx), Math.abs(y2 - y1)));
        for (let dot = 0; dot <= count; dot++) {
          const x = left + Math.round(x1 * letterWidth / 24 + dx * dot / count);
          const y = top + Math.round(y1 + (y2 - y1) * dot / count);
          for (let dy = -2; dy <= 2; dy++) {
            const start = (y + dy) * hiresWidth + x;
            const radius = Math.abs(dy) === 2 ? 1 : 2;
            pixels.fill(1, start - radius, start + radius + 1);
          }
        }
      }
    }
  }
}

function drawScene() {
  const pixels = Buffer.alloc(width * height);
  function dot(x, y, color) {
    if (x >= 0 && x < width && y >= 0 && y < height) pixels[y * width + x] = color;
  }
  function rect(x, y, w, h, color) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) dot(px, py, color);
    }
  }
  function line(x1, y1, x2, y2, color) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
    for (let i = 0; i <= steps; i++) {
      dot(Math.round(x1 + (x2 - x1) * i / steps), Math.round(y1 + (y2 - y1) * i / steps), color);
    }
  }
  function polygon(points, color) {
    const edges = points.map(([x, y], i) => [x, y, ...points[(i + 1) % points.length]]);
    for (let y = 0; y < height; y++) {
      const cross = edges.filter(([, y1, , y2]) => (y1 > y) !== (y2 > y))
        .map(([x1, y1, x2, y2]) => x1 + (x2 - x1) * (y - y1) / (y2 - y1))
        .sort((a, b) => a - b);
      for (let i = 0; i < cross.length; i += 2) {
        const x = Math.ceil(cross[i]);
        rect(x, y, Math.ceil(cross[i + 1]) - x, 1, color);
      }
    }
  }
  // Dusk and the far treeline.
  for (let y = 77; y < 140; y++) {
    for (let x = 0; x < width; x++) {
      const horizon = 91 - Math.round(10 * Math.sin(x / 40));
      if (y >= horizon || (y >= horizon - 4 && (x + y) % 4 === 0)) dot(x, y, blue);
      if (y >= 104 && (x + 2 * y) % 12 < (y - 103) / 7) dot(x, y, purple);
    }
  }
  line(3, 103, 58, 103, purple);
  line(13, 105, 44, 105, purple);
  line(95, 94, 157, 94, periwinkle);
  for (const [x, y] of [[15,73],[30,80],[49,78],[76,76],
    [102,83],[117,70],[148,74],[68,93],[18,96],[43,98],[154,98],[4,110]]) {
    dot(x, y, periwinkle);
    if (x % 3 === 0) line(x, y - 1, x, y + 1, silver);
  }
  for (let y = 65; y < 114; y++) for (let x = 110; x < 154; x++) {
    const distance = ((x - 134) / 14) ** 2 + ((y - 87) / 21) ** 2;
    if (distance >= 1) continue;
    dot(x, y, y >= 94 ? ((x + y) % 3 === 0 ? periwinkle : silver) : white);
  }
  polygon([[0,126],[16,112],[25,118],[42,104],[60,124],[83,116],[106,128],
    [129,107],[145,116],[160,105],[160,152],[0,152]], blue);
  polygon([[0,136],[12,118],[32,133],[53,115],[69,130],[96,125],[120,135],
    [144,116],[160,125],[160,159],[0,159]], charcoal);
  for (const [x, y] of [[2,123],[9,115],[16,122],[33,125],[42,119],[145,118],[154,108]]) {
    polygon([[x,y],[x-5,y+20],[x+6,y+20]], black);
  }

  // Lit panes, framing, and reflections in the sloped greenhouse roof.
  rect(9, 146, 143, 30, blue);
  for (let x = 12; x < 150; x += 16) {
    rect(x + 1, 150, 13, 22, x < 68 ? green : blue);
    line(x + 2, 160, x + 7, 151, x < 68 ? lime : periwinkle);
    line(x + 7, 160, x + 12, 151, x < 68 ? green : purple);
    rect(x, 145, 1, 31, periwinkle);
  }
  line(10, 163, 151, 163, charcoal);
  line(10, 164, 151, 164, periwinkle);
  polygon([[5,147],[68,118],[110,118],[156,147]], blue);
  polygon([[6,146],[68,119],[94,119],[155,146]], charcoal);
  for (const [i, x] of [10,26,42,58,74,90,106,122,138,154].entries()) {
    const ridge = 68 + Math.round(i * 42 / 9);
    if (i < 9) {
      polygon([[x+3,145],[ridge+2,121],[ridge+4,121],[x+13,145]], i < 5 ? purple : blue);
      line(x + 6, 141, ridge + 3, 124, blue);
    }
    line(x, 146, ridge, 118, periwinkle);
  }
  line(5, 145, 68, 117, silver);
  line(68, 117, 110, 117, silver);
  line(110, 117, 156, 145, cyan);
  rect(5, 146, 151, 2, periwinkle);
  rect(8, 148, 145, 2, charcoal);
  rect(7, 173, 149, 3, charcoal);
  for (let i = 0; i < 24; i++) {
    const x = i * 17 % 158;
    const y = 169 + i * 7 % 8;
    line(x, 176, x + (i % 5) - 2, y, black);
  }

  // The beacon housing stays in the bitmap. A sprite lights its window.
  rect(61, 109, 4, 13, charcoal);
  rect(59, 101, 8, 10, brown);
  rect(60, 102, 6, 6, orange);
  line(58, 101, 68, 101, charcoal);
  line(59, 100, 63, 97, gray);
  line(63, 97, 67, 100, gray);
  line(59, 111, 67, 111, gray);

  return pixels;
}

// Colors that can share the same role if a cell contains more than three inks.
const nearest = [
  [], [15,7,12], [8,9,4], [14,13,15], [6,10,11], [13,3,6], [4,14,11],
  [15,8,1], [7,9,10], [11,8,4], [4,8,12], [6,9,12], [11,15,14],
  [5,3,7], [3,6,15], [1,12,7]
];
function encodeScene(pixels) {
  const screen = Buffer.alloc(1000);
  const color = Buffer.alloc(1000);
  const bitmap = Buffer.alloc(8000);
  for (let cell = 0; cell < 1000; cell++) {
    const y = Math.floor(cell / 40);
    const x = cell % 40;
    const rows = Array.from({ length: 8 }, (_, row) => {
      const start = (8 * y + row) * width + 4 * x;
      return pixels.subarray(start, start + 4);
    });
    const samples = rows.flatMap(row => [...row]);
    const count = Array(16).fill(0);
    for (const ink of samples) count[ink]++;
    const inks = count.slice(1).map((_, index) => index + 1)
      .filter(ink => count[ink] > 0).sort((a, b) => count[b] - count[a]).slice(0, 3);
    const palette = [black, ...inks];
    screen[cell] = (palette[1] ?? 0) << 4 | (palette[2] ?? 0);
    color[cell] = palette[3] ?? 0;
    for (const [r, row] of rows.entries()) {
      bitmap[cell * 8 + r] = row.reduce((byte, ink) => {
        const selected = palette.includes(ink) ? ink : nearest[ink].find(other => palette.includes(other));
        return byte << 2 | Math.max(0, palette.indexOf(selected));
      }, 0);
    }
  }
  return { bitmap, screen, color };
}

function packHires(pixels, firstColumn = 0, count = columns) {
  const rows = pixels.length / (hiresWidth * 8);
  const bytes = Buffer.alloc(rows * count * 8);
  for (let cell = 0; cell < rows * count; cell++) {
    const top = Math.floor(cell / count) * 8;
    const left = (firstColumn + cell % count) * 8;
    for (let row = 0; row < 8; row++) {
      const start = (top + row) * hiresWidth + left;
      bytes[cell * 8 + row] = pixels.subarray(start, start + 8)
        .reduce((byte, pixel) => byte << 1 | pixel, 0);
    }
  }
  return bytes;
}

function drawLettering({ bitmap, screen }) {
  const logo = Buffer.alloc(hiresWidth * sceneRow * 8);
  drawLogoWord(logo, 'WHISKER', 11, 26, 10);
  drawLogoWord(logo, 'BEACON', 40, 30, 12);
  for (const [x, y] of [[23,14],[295,13],[289,24],[28,51],[300,48],[167,7],[252,35]]) {
    logo[y * hiresWidth + x] = 1;
  }

  const footer = Buffer.alloc(hiresWidth * 24);
  drawText(footer, 'C OR UP TO CHOOSE CAT', 8);
  drawText(footer, 'FIRE OR SPACE TO START', 16);
  packHires(logo).copy(bitmap);
  packHires(footer).copy(bitmap, nameRow * columns * 8);
  const inks = [silver, white, white, silver, silver, yellow, yellow, orange];
  for (const [row, ink] of inks.entries()) screen.fill(ink << 4, row * columns, (row + 1) * columns);
  for (const [row, ink] of [cyan, silver, yellow].entries()) {
    const start = (nameRow + row) * columns;
    screen.fill(ink << 4, start, start + columns);
  }
}

function hires(rows) {
  const bytes = Buffer.alloc(64);
  for (const [y, row] of rows.entries()) {
    for (const [x, pixel] of [...row].entries()) {
      if (pixel === '#') bytes[y * 3 + (x >> 3)] |= 128 >> (x & 7);
    }
  }
  return bytes;
}

function titleName(label) {
  const pixels = Buffer.alloc(hiresWidth * 8);
  // Keep the first scanline blank for the multicolor-to-hi-res switch.
  drawText(pixels, label, 1);
  return packHires(pixels, (columns - nameCells) / 2, nameCells);
}

function titleArt(cats) {
  const sprites = Buffer.concat([
    ...cats.flatMap(cat => cat.frames.map(frame => Buffer.concat([frame, Buffer.alloc(64 - frame.length)]))),
    hires(['...##...', '..####..', '.######.', '.######.', '..####..', '...##...']),
    hires(['..#..', '.###.', '..#..']),
    hires(['.....', '..#..', '.....'])
  ]);
  const scene = encodeScene(drawScene());
  drawLettering(scene);
  return { ...scene, sprites, names: Buffer.concat(cats.map(cat => titleName(cat.name))) };
}

module.exports = { titleArt };
