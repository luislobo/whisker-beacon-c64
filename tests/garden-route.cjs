const FULL_JUMP_TICKS = 16;
const jumpAt = [17,52,122,149,185,210,238,298,324,358,403,433];
const gardenRoute = Array.from({ length: 466 }, (_, tick) => (
  8 | (jumpAt.some(start => tick >= start && tick < start + FULL_JUMP_TICKS) ? 16 : 0)
));

module.exports = { gardenRoute };
