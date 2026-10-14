/** Image positions are normalized [0,1], never silently treated as SI measurements. */
import { clamp, INITIAL, WORLD } from './engine.js';
export function sanitizeObservations(raw = []) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 1200).map(p => ({
    t: Number(p?.t), x: Number(p?.x), y: Number(p?.y),
    manual: !!p?.manual
  })).filter(p => Number.isFinite(p.t) && Number.isFinite(p.x) && Number.isFinite(p.y) && p.t >= 0 && p.t <= 300 && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1)
    .sort((a, b) => a.t - b.t).filter((p, i, arr) => i === 0 || p.t - arr[i - 1].t > .002);
}
export function measureTrack(observations, pixelsPerMeter = 0, width = 0, height = 0) {
  const points = sanitizeObservations(observations);
  const calibrated = pixelsPerMeter > 0 && width > 0 && height > 0;
  const sx = calibrated ? width / pixelsPerMeter : 1;
  const sy = calibrated ? height / pixelsPerMeter : 1;
  const rows = points.map((p, i) => {
    const prior = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
    const dt = next.t - prior.t;
    const vx = dt > 1e-6 ? (next.x - prior.x) * sx / dt : 0;
    const vy = dt > 1e-6 ? (next.y - prior.y) * sy / dt : 0;
    return { t: p.t, x: p.x * sx, y: p.y * sy, vx, vy, speed: Math.hypot(vx, vy), manual: p.manual };
  });
  return rows.map((p, i) => {
    const a = rows[Math.max(0, i - 1)], b = rows[Math.min(rows.length - 1, i + 1)];
    const dt = b.t - a.t;
    const ax = dt > 1e-6 ? (b.vx - a.vx) / dt : 0;
    const ay = dt > 1e-6 ? (b.vy - a.vy) / dt : 0;
    return { ...p, ax, ay, acceleration: Math.hypot(ax, ay) };
  });
}
export function estimateInitial(observations, world = WORLD) {
  const pts = sanitizeObservations(observations);
  if (pts.length < 2) return { ...INITIAL };
  // Use first short flight segment. Do not pretend to recover unobserved 3D motion.
  const first = pts[0];
  const later = pts.find(p => p.t - first.t >= .12) || pts[Math.min(pts.length - 1, 3)];
  const dt = Math.max(0.03, later.t - first.t);
  const groundY = clamp(Math.max(...pts.map(p => p.y)) * world.height + .22, world.height * .54, world.height * .95);
  return {
    x: clamp(first.x * world.width, .3, world.width - .3),
    y: clamp(first.y * world.height, .3, groundY - .3),
    vx: clamp((later.x - first.x) * world.width / dt, -9, 9),
    vy: clamp((later.y - first.y) * world.height / dt - 9.81 * dt / 2, -14, 14),
    ground: groundY
  };
}
export function confidenceSummary(observations, sampleCount = 0) {
  const pts = sanitizeObservations(observations);
  if (!pts.length) return { grade: 'None', coverage: 0, note: 'No track yet. Select a colored object in a video.' };
  const coverage = sampleCount > 0 ? pts.length / sampleCount : 0;
  let jumps = 0;
  for (let i = 1; i < pts.length; i++) {
    if (Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y) > .16) jumps++;
  }
  const grade = sampleCount === 0 ? 'Manual / imported' : coverage >= .8 && jumps < 2 ? 'Moderate' : 'Low';
  return { grade, coverage: clamp(coverage, 0, 1), note: `${pts.length} points · ${jumps} large jumps${sampleCount ? ` · ${Math.round(coverage * 100)}% detections` : ''}. Not a physical accuracy guarantee.` };
}
export function calculateSeries(mode, sourceTimeline, forkTimeline, observations, calibration = {}) {
  const key = ({ positionX:'x', positionY:'y', speed:'speed', acceleration:'acceleration' })[mode] || 'y';
  const measured = measureTrack(observations, calibration.pixelsPerMeter, calibration.width, calibration.height);
  if (measured.length) return { key, unit: calibration.pixelsPerMeter > 0 ? (['x','y'].includes(key) ? 'm' : key === 'speed' ? 'm/s' : 'm/s²') : (['x','y'].includes(key) ? 'frame fraction' : key === 'speed' ? 'frame/s' : 'frame/s²'), observed: measured.map(p=>({t:p.t, v:p[key]})), fork: [] };
  const stride = 10;
  const mapSeries = tl => tl.frames.filter((_, i) => i % stride === 0).map((p, i, all) => {
    const frames = tl.frames; const idx = i * stride; const a = frames[Math.max(idx - 1, 0)], b = frames[Math.min(idx + 1, frames.length-1)];
    const ax=(b.vx-a.vx)/(b.t-a.t || 1), ay=(b.vy-a.vy)/(b.t-a.t || 1);
    return { t:p.t, v: key === 'speed' ? Math.hypot(p.vx,p.vy) : key === 'acceleration' ? Math.hypot(ax,ay) : p[key] };
  });
  return { key, unit: ['x','y'].includes(key) ? 'm' : key === 'speed' ? 'm/s' : 'm/s²', observed: mapSeries(sourceTimeline), fork: mapSeries(forkTimeline) };
}
