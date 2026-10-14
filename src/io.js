/** Strict, versioned derived-data IO. Never serializes original video file bytes. */
import { normalizeSettings } from './engine.js';
import { sanitizeObservations } from './analysis.js';
export const FORMAT = 'realityfork-experiment';
export const VERSION = 1;
const MODES = new Set(['gravity','time','material','wind','motion','share']);
export function buildExperiment({ mode='gravity', settings, observations=[], sourceType='synthetic', calibration={}, sampleCount=0 }={}) {
  return {
    format: FORMAT,
    schemaVersion: VERSION,
    appVersion: '1.0.0-beta.1',
    generatedAt: new Date().toISOString(),
    source: { type: sourceType === 'video' ? 'video-derived' : sourceType === 'imported' ? 'imported-data' : 'synthetic' },
    mode: MODES.has(mode) ? mode : 'gravity',
    settings: normalizeSettings(settings),
    calibration: { pixelsPerMeter: finitePositive(calibration.pixelsPerMeter, 0, 1e5), width: finitePositive(calibration.width, 0, 1e5), height: finitePositive(calibration.height, 0, 1e5) },
    sampleCount: Math.min(1200, Math.max(0, Math.round(Number(sampleCount)||0))),
    observations: sanitizeObservations(observations),
    notice: 'Derived coordinates only. Video not included. This model is approximate; absolute measurements need calibration.'
  };
}
function finitePositive(x, fallback=0, max=1e6){ const n=Number(x); return Number.isFinite(n) && n >= 0 ? Math.min(n,max) : fallback; }
export function parseExperiment(input) {
  const x = typeof input === 'string' ? JSON.parse(input) : input;
  if (!x || typeof x !== 'object' || x.format !== FORMAT || x.schemaVersion !== VERSION) throw new Error('Unsupported experiment file. Expected RealityFork schema v1.');
  if (JSON.stringify(x).length > 1000000) throw new Error('Experiment file too large.');
  return buildExperiment({
    mode: x.mode,
    settings: x.settings,
    observations: x.observations,
    sourceType: x.source?.type === 'synthetic' ? 'synthetic' : 'imported',
    calibration: x.calibration,
    sampleCount: x.sampleCount
  });
}
export function shareHash(settings, mode) {
  const s=normalizeSettings(settings);
  const params = new URLSearchParams({v:'1',m:MODES.has(mode)?mode:'gravity',g:s.gravity.toFixed(3),e:s.restitution.toFixed(3),w:s.wind.toFixed(3),d:s.drag.toFixed(3),s:s.speed.toFixed(2)});
  return '#'+params;
}
export function readHash(hash) {
  try {
    const p = new URLSearchParams(String(hash).replace(/^#/,''));
    if (p.get('v') !== '1') return null;
    return { mode: MODES.has(p.get('m')) ? p.get('m') : 'gravity', settings: normalizeSettings({gravity:p.get('g'),restitution:p.get('e'),wind:p.get('w'),drag:p.get('d'),speed:p.get('s')}) };
  } catch { return null; }
}
export function rowsToCSV(observations, measurements) {
  const rows = ['t_seconds,x_fraction,y_fraction,manual,velocity_x,velocity_y,speed,acceleration'];
  for (let i=0;i<observations.length;i++) {
    const p=observations[i], m=measurements[i]||{};
    rows.push([p.t,p.x,p.y,p.manual?1:0,m.vx??'',m.vy??'',m.speed??'',m.acceleration??''].join(','));
  }
  return rows.join('\n')+'\n';
}
export function downloadBlob(blob, filename) {
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}
export function downloadText(text, name, mime='text/plain') {downloadBlob(new Blob([text], {type:mime}),name);}
