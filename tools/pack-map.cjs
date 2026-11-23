const MAP_STRIDE = 768;
const HEIGHT = 25;

// A packet carries 1–127 literal bytes or a repeated byte. Zero ends the map.
function packMap(map) {
  const width = map.length / HEIGHT;
  if (!Number.isInteger(width) || width > MAP_STRIDE) throw Error('Invalid map dimensions');
  const padded = Buffer.alloc(MAP_STRIDE * HEIGHT);
  for (let row = 0; row < HEIGHT; row++) {
    map.copy(padded, row * MAP_STRIDE, row * width, (row + 1) * width);
  }
  const packed = [];
  let position = 0;
  const runAt = start => {
    let count = 1;
    while (count < 127 && start + count < padded.length &&
      padded[start + count] === padded[start]) count++;
    return count;
  };
  while (position < padded.length) {
    const run = runAt(position);
    if (run >= 3) {
      packed.push(0x80 | run, padded[position]);
      position += run;
      continue;
    }
    const start = position++;
    while (position < padded.length && position - start < 127 && runAt(position) < 3) position++;
    packed.push(position - start, ...padded.subarray(start, position));
  }
  return Buffer.from([...packed, 0]);
}

module.exports = { MAP_STRIDE, packMap };
