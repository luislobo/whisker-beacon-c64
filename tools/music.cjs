// Lantern Paws, an original three-voice loop. Zero denotes a rest.
const melody = [
  62,0,65,69,72,0,69,65, 58,0,65,70,69,0,65,62,
  65,0,69,72,76,74,72,69, 67,0,64,67,72,70,67,64
];
const bass = [
  38,0,38,45,38,0,41,45, 34,0,34,41,34,0,38,41,
  41,0,41,48,41,0,45,48, 36,0,36,43,36,0,40,43
];
const harmony = [
  0,57,0,60,0,57,0,53, 0,53,0,58,0,55,0,53,
  0,57,0,60,0,64,0,60, 0,55,0,60,0,58,0,55
];

function score() {
  const registers = [985248, 1022727].flatMap(clock =>
    Array.from({ length: 96 }, (_, note) => Math.round(440 * 2 ** ((note - 69) / 12) * 2 ** 24 / clock))
  );
  const data = {
    melody, bass, harmony,
    pitch_low: registers.map(value => value & 255),
    pitch_high: registers.map(value => value >> 8)
  };
  return Object.entries(data).map(([label, bytes]) => {
    const lines = [];
    for (let i = 0; i < bytes.length; i += 16) lines.push('    .byte ' + bytes.slice(i, i + 16).join(','));
    return label + ':\n' + lines.join('\n') + '\n';
  }).join('\n');
}

module.exports = { score };
