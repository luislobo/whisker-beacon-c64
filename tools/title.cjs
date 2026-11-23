const { glyphs } = require('./garden.cjs');

const width = 160;
const height = 200;
const promptRow = 23;
const [black, white, , cyan, purple, green, blue, yellow, orange, brown,
  , charcoal, gray, lime, periwinkle, silver] = Array.from({ length: 16 }, (_, ink) => ink);
const font = glyphs();

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
  function text(label, y, color, size, offset = 0) {
    const start = Math.floor((width - (label.length * 6 - 1) * size) / 2) + offset;
    for (const [i, letter] of [...label].entries()) {
      const code = letter.charCodeAt(0) + (letter === ' ' ? 0 : 128);
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (font[code * 8 + row] & (64 >> col)) {
            rect(start + (i * 6 + col) * size, y + row * size, size, size, color);
          }
        }
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
  for (const [x, y] of [[10,14],[150,13],[137,23],[8,49],[15,73],[30,80],[49,78],[76,76],
    [83,9],[102,83],[117,70],[148,74],[68,93],[18,96],[43,98],[154,98],[4,110]]) {
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

  text('WHISKER', 18, purple, 3, 2);
  text('WHISKER', 15, white, 3);
  text('BEACON', 48, orange, 3, 2);
  text('BEACON', 45, yellow, 3);
  rect(0, 176, 160, 24, black);
  rect(15, 179, 130, 1, blue);
  text('FIRE OR SPACE TO START', 184, yellow, 1);
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
    const palette = y === promptRow ? [black, black, black, yellow] : [black, ...inks];
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

function hires(rows) {
  const bytes = Buffer.alloc(64);
  for (const [y, row] of rows.entries()) {
    for (const [x, pixel] of [...row].entries()) {
      if (pixel === '#') bytes[y * 3 + (x >> 3)] |= 128 >> (x & 7);
    }
  }
  return bytes;
}

function titleArt(pip) {
  const sprites = Buffer.concat([
    ...pip.map(frame => Buffer.concat([frame, Buffer.alloc(64 - frame.length)])),
    hires(['...##...', '..####..', '.######.', '.######.', '..####..', '...##...']),
    hires(['..#..', '.###.', '..#..']),
    hires(['.....', '..#..', '.....'])
  ]);
  return { ...encodeScene(drawScene()), sprites };
}

module.exports = { titleArt };
