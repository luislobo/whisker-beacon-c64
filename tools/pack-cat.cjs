// Literal packets have a 1..127 byte count. A set high bit encodes a
// backreference of 4..131 bytes, followed by its 1..255 byte distance.
function packCat(bytes) {
  const packets = [];
  let literals = [];
  function flushLiterals() {
    if (literals.length === 0) return;
    packets.push(literals.length, ...literals);
    literals = [];
  }

  for (let offset = 0; offset < bytes.length;) {
    let length = 3;
    let distance = 0;
    for (let back = 1; back <= Math.min(offset, 255); back++) {
      let match = 0;
      while (match < 131 && offset + match < bytes.length &&
             bytes[offset + match] === bytes[offset + match - back]) match++;
      if (match > length) {
        length = match;
        distance = back;
      }
    }
    if (distance) {
      flushLiterals();
      packets.push(0x80 | (length - 4), distance);
      offset += length;
    } else {
      literals.push(bytes[offset++]);
      if (literals.length === 127) flushLiterals();
    }
  }
  flushLiterals();
  return Buffer.from([...packets, 0]);
}

module.exports = { packCat };
