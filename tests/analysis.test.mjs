import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeObservations,measureTrack,confidenceSummary,estimateInitial,calculateSeries} from '../src/analysis.js';
import {simulate} from '../src/engine.js';
test('sanitizes and orders normalized observations, discards invalid values',()=>{
 const x=sanitizeObservations([{t:1,x:.3,y:.2},{t:-1,x:.2,y:.3},{t:0,x:.1,y:.4},{t:2,x:1.7,y:.4},{t:.0001,x:.1,y:.4}]);
 assert.equal(x.length,2);assert.deepEqual(x.map(a=>a.t),[0,1]);
});
test('calibration changes units from frame fractions to metres',()=>{
 const rows=[{t:0,x:.2,y:.1},{t:1,x:.3,y:.2}];
 const raw=measureTrack(rows),meter=measureTrack(rows,100,1000,500);
 assert.ok(Math.abs(raw[0].vx-.1)<1e-6);
 assert.ok(Math.abs(meter[0].vx-1)<1e-6);
 assert.ok(Math.abs(meter[0].y-.5)<1e-6);
});
test('confidence reflects missing observations; not a model accuracy claim',()=>{
 const s=confidenceSummary([{t:0,x:.2,y:.2},{t:.1,x:.22,y:.24}],10);
 assert.equal(s.grade,'Low');assert.match(s.note,/20%/);
});
test('initial state estimate remains within world bounds',()=>{
 const s=estimateInitial([{t:0,x:.1,y:.1},{t:.2,x:.2,y:.2}]);
 assert.ok(Number.isFinite(s.vx)&&Number.isFinite(s.vy));assert.ok(s.ground>s.y);
});
test('graph can describe model-only and measured data',()=>{
 const a=simulate(),b=simulate({gravity:.17});
 const model=calculateSeries('speed',a,b,[]);
 assert.ok(model.observed.length>10);assert.ok(model.fork.length>10);
 const uploaded=calculateSeries('positionY',a,b,[{t:0,x:.1,y:.4},{t:.4,x:.2,y:.8}]);
 assert.equal(uploaded.unit,'frame fraction');assert.equal(uploaded.observed.length,2);
});
