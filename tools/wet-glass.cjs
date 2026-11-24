// Original pane animation inspired by Linus Åkesson's bump-mapped rain in Lunatico.
// https://www.linusakesson.net/scene/lunatico/rain.php
const phases = 32;
const columns = 40;
const roofRidge = 118;
const roofBottom = 146;
const impacts = [
  [44,140,3], [74,124,31], [104,127,11], [120,137,28]
].map(([x, y, phase]) => ({
  x, y, phase,
  scale: 0.45 + 0.75 * (y - roofRidge) / (roofBottom - roofRidge)
}));
const paneColors = new Set([0, 4, 5, 6, 11]);
const brightness = [0, 100, 34, 78, 47, 53, 37, 90, 58, 27, 69, 38, 52, 83, 66, 81];
const bytesPerFrame = 128;

function heightAt(x, y, phase, impact) {
  const age = (phase + impact.phase) % phases;
  const fromImpactX = (x - impact.x) / impact.scale;
  const fromImpactY = (y - impact.y) / impact.scale;
  if (age < 8) {
    const dx = (fromImpactX + (8 - age) * 0.13) / 0.66;
    const dy = (fromImpactY + (8 - age) * 0.93) / 1.7;
    return 1.1 * Math.exp(-(dx * dx + dy * dy));
  }
  const time = age - 8;
  const radius = 0.9 + time * 0.31;
  const distance = Math.hypot(fromImpactX, fromImpactY * 1.5);
  const trough = (distance - radius) / 0.83;
  return Math.max(0, 1 - time / 19) * Math.exp(-trough * trough);
}

function reflectsLight(x, y, phase) {
  const warm = x < 85;
  const direction = warm ? -1 : 1;
  for (const impact of impacts) {
    if (Math.abs(x - impact.x) > 8 || Math.abs(y - impact.y) > 10) continue;
    const east = heightAt(x + 0.45, y, phase, impact);
    const west = heightAt(x - 0.45, y, phase, impact);
    const north = heightAt(x, y - 0.45, phase, impact);
    const south = heightAt(x, y + 0.45, phase, impact);
    const slopeTowardLight = (east - west) * direction * 0.72 + (north - south) * 0.67;
    if (slopeTowardLight > 0.21) return true;
  }
  return false;
}

function glassAnimation({ bitmap, screen, color }) {
  const locations = [];
  const warmCells = new Set();
  for (let cell = 15 * columns; cell < Math.ceil(roofBottom / 8) * columns; cell++) {
    const x0 = (cell % columns) * 4;
    const y0 = Math.floor(cell / columns) * 8;
    const palette = [0, screen[cell] >> 4, screen[cell] & 15, color[cell]];
    const original = bitmap.subarray(cell * 8, cell * 8 + 8);
    const spareInk = original.every(byte => [0, 2, 4, 6].every(shift => (byte >> shift & 3) !== 3));
    const warm = x0 >= 44 && x0 < 84;
    const light = spareInk ? 3 : palette.reduce((brightest, ink, pair) =>
      brightness[ink] > brightness[palette[brightest]] ? pair : brightest, 1);
    let animated = false;
    for (const [row, dry] of original.entries()) {
      const y = y0 + row;
      if (y >= roofBottom) break;
      const pixels = [6, 4, 2, 0].map(shift => dry >> shift & 3);
      const frames = Buffer.alloc(phases, dry);
      for (const [column, pair] of pixels.entries()) {
        if (pair === light || !paneColors.has(palette[pair])) continue;
        if (!spareInk && brightness[palette[light]] - brightness[palette[pair]] < 23) continue;
        const shift = 6 - column * 2;
        for (let phase = 0; phase < phases; phase++) {
          if (reflectsLight(x0 + column, y, phase)) {
            frames[phase] = (frames[phase] & ~(3 << shift)) | light << shift;
          }
        }
      }
      if (frames.some(byte => byte !== dry)) {
        locations.push({ address: cell * 8 + row, frames });
        animated = true;
      }
    }
    if (animated && spareInk) {
      color[cell] = warm ? 15 : 3;
      if (warm) warmCells.add(cell);
    }
  }
  if (locations.length > bytesPerFrame) {
    throw new Error(`Wet glass uses ${locations.length} bitmap bytes per frame, limit ${bytesPerFrame}`);
  }
  const assembly = [
    'animate_wet_glass:',
    '    lda title_ticks',
    '    lsr',
    '    and #31',
    '    tax',
    ...locations.flatMap(({ address }, index) => [
      `    lda WET_GLASS_FRAMES+${index * phases},x`,
      `    sta TITLE_BITMAP+${address}`
    ]),
    '    lda title_ticks',
    '    lsr',
    '    lsr',
    '    lsr',
    '    lsr',
    '    and #7',
    '    tax',
    '    lda wet_beacon_inks,x',
    ...[...warmCells].map(cell => `    sta $d800+${cell}`),
    '    rts',
    'wet_beacon_inks:',
    '    .byte 15,15,7,7,7,7,7,15',
    ''
  ].join('\n');
  return { bytes: Buffer.concat(locations.map(({ frames }) => frames)), assembly };
}

module.exports = { glassAnimation };
