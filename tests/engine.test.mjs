import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS, INITIAL, WORLD, DURATION, STEP, simulate, normalizeSettings, sampleTimeline, buildSourceTimeline, energy} from '../src/engine.js';
test('deterministic trajectory, same inputs give identical frames',()=>{
 const a=simulate(DEFAULTS), b=simulate(DEFAULTS);
 assert.deepEqual(a.frames,b.frames);assert.equal(a.frames.length,Math.round(DURATION/STEP)+1);
});
test('vertical acceleration increases downward velocity before first impact',()=>{
 const s=simulate({...DEFAULTS,gravity:1,restitution:.7}, {x:2,y:1,vx:0,vy:0});
 assert.ok(sampleTimeline(s,.2).vy>1.8);
 assert.ok(sampleTimeline(s,.2).y>sampleTimeline(s,0).y);
});
test('zero gravity maintains almost constant vertical velocity with no drag',()=>{
 const a=simulate({...DEFAULTS,gravity:0,drag:0,wind:0}, {x:4,y:2,vx:0,vy:-.3});
 assert.ok(Math.abs(sampleTimeline(a,.4).vy+.3)<.000001);
});
test('perfectly inelastic collision does not rebound',()=>{
 const a=simulate({...DEFAULTS,restitution:0,wind:0});
 assert.equal(a.events.length,0);assert.ok(a.frames.every(p=>p.y<=WORLD.ground-WORLD.radius+.0001));
 assert.equal(a.frames.at(-1).vy,0);
});
test('restitution e=1 preserves vertical speed at first collision when drag=0',()=>{
 const a=simulate({...DEFAULTS,restitution:1,drag:0,wind:0},{x:3,y:2,vx:0,vy:0});
 const idx=a.frames.findIndex(x=>x.bounceCount>0);
 assert.ok(idx>0);
 const pre=a.frames[idx-1], post=a.frames[idx];
 assert.ok(Math.abs(pre.vy+post.vy)<.15,`pre=${pre.vy} post=${post.vy}`);
});
test('drag decreases speed in no-gravity, no-wind free flight',()=>{
 const a=simulate({gravity:0,restitution:1,wind:0,drag:0},{x:2,y:2,vx:1,vy:0});
 const b=simulate({gravity:0,restitution:1,wind:0,drag:.6},{x:2,y:2,vx:1,vy:0});
 assert.ok(Math.abs(sampleTimeline(b,.5).vx)<Math.abs(sampleTimeline(a,.5).vx));
});
test('wind modifies horizontal displacement in correct direction',()=>{
 const a=simulate({gravity:.1,restitution:.7,wind:-3,drag:0});
 const b=simulate({gravity:.1,restitution:.7,wind:3,drag:0});
 assert.ok(sampleTimeline(a,.7).x<sampleTimeline(b,.7).x);
});
test('Moon ground impact occurs later than Earth ground impact',()=>{
 const initial={x:1.5,y:1.5,vx:0,vy:0};
 const earth=simulate({gravity:1,restitution:.5,wind:0,drag:0},initial);
 const moon=simulate({gravity:.165,restitution:.5,wind:0,drag:0},initial);
 assert.ok(earth.events[0].t<moon.events[0].t);
});
test('controls normalize out-of-range, NaN and invalid settings',()=>{
 assert.equal(normalizeSettings({gravity:'nan',restitution:4,wind:-200}).gravity,1);
 assert.equal(normalizeSettings({gravity:'nan',restitution:4,wind:-200}).restitution,1);
 assert.equal(normalizeSettings({gravity:'nan',restitution:4,wind:-200}).wind,-8);
});
