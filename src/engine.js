/** Deterministic, illustrative 2D projectile & bounce model (SI units in synthetic demo). */
export const STEP = 1 / 120;
export const DURATION = 7;
export const WORLD = Object.freeze({ width: 16, height: 9, ground: 8.1, radius: 0.28 });
export const DEFAULTS = Object.freeze({ gravity: 1, restitution: 0.77, wind: 0, drag: 0.045, speed: 1 });
export const INITIAL = Object.freeze({ x: 1.65, y: 1.3, vx: 3.05, vy: -1.7 });
export const GRAVITIES = Object.freeze({ Earth: 1, Moon: 0.165, Mars: 0.38, Jupiter: 2.53, 'Micro-g': 0.02 });
export const MATERIALS = Object.freeze({ Rubber: 0.90, Wood: 0.58, Concrete: 0.42, Foam: 0.18, 'Perfectly elastic': 1 });
export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
export function safeNumber(value, fallback, min, max) { const n = Number(value); return Number.isFinite(n) ? clamp(n, min, max) : fallback; }
export function normalizeSettings(input = {}) {
  return {
    gravity: safeNumber(input.gravity, DEFAULTS.gravity, 0, 3),
    restitution: safeNumber(input.restitution, DEFAULTS.restitution, 0, 1),
    wind: safeNumber(input.wind, DEFAULTS.wind, -8, 8),
    drag: safeNumber(input.drag, DEFAULTS.drag, 0, 1.5),
    speed: safeNumber(input.speed, DEFAULTS.speed, 0.1, 5)
  };
}
export function simulate(settingsInput = DEFAULTS, initialInput = INITIAL, configInput = WORLD, duration = DURATION) {
  const s = normalizeSettings(settingsInput);
  const c = { ...WORLD, ...configInput };
  const ground = clamp(c.ground, 0.8, c.height - 0.05);
  const radius = clamp(c.radius, 0.03, 0.8);
  let x = safeNumber(initialInput.x, INITIAL.x, radius, c.width - radius);
  let y = safeNumber(initialInput.y, INITIAL.y, radius, ground - radius);
  let vx = safeNumber(initialInput.vx, INITIAL.vx, -30, 30);
  let vy = safeNumber(initialInput.vy, INITIAL.vy, -30, 30);
  let bounceCount = 0;
  let grounded = false;
  const frames = [{ t: 0, x, y, vx, vy, bounceCount }];
  const count = Math.round(clamp(duration, 0.1, 20) / STEP);
  for (let i = 1; i <= count; i++) {
    const ax = s.wind - s.drag * vx;
    vx += ax * STEP;
    x += vx * STEP;
    if (x < radius) { x = radius; if (vx < 0) vx = -vx * 0.86; }
    if (x > c.width - radius) { x = c.width - radius; if (vx > 0) vx = -vx * 0.86; }
    if (!grounded) {
      // Semi-implicit Euler; drag always acts against vertical velocity.
      const ay = 9.81 * s.gravity - s.drag * vy;
      vy += ay * STEP;
      y += vy * STEP;
      if (y >= ground - radius && vy >= 0) {
        y = ground - radius;
        if (s.restitution === 0 || Math.abs(vy * s.restitution) < 0.38) {
          vy = 0;
          grounded = true;
        } else {
          vy = -vy * s.restitution;
          bounceCount++;
        }
      }
    } else {
      y = ground - radius;
      vy = 0;
    }
    frames.push({ t: i * STEP, x, y, vx, vy, bounceCount });
  }
  return { frames, events: frames.filter((f, i) => i > 0 && f.bounceCount > frames[i - 1].bounceCount), settings: s, world: c };
}
export function sampleTimeline(timeline, time) {
  const { frames } = timeline;
  const idx = clamp(Math.round(clamp(time, 0, frames.at(-1).t) / STEP), 0, frames.length - 1);
  return frames[idx];
}
export function energy(state, gravity = 1, mass = 1, ground = WORLD.ground) {
  // Relative potential above floor; ignores reference sphere radius.
  return 0.5 * mass * (state.vx ** 2 + state.vy ** 2) + mass * 9.81 * gravity * Math.max(0, ground - state.y);
}
export function buildSourceTimeline() {
  return simulate({ ...DEFAULTS, gravity: 1, restitution: 0.77, wind: 0, drag: .045 });
}
