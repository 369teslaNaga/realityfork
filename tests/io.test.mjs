import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExperiment,parseExperiment,shareHash,readHash,rowsToCSV} from '../src/io.js';
test('v1 experiment exported/imported without raw video or user file path',()=>{
 const original=buildExperiment({mode:'material',sourceType:'video',settings:{gravity:.165,restitution:.43,wind:-1.2,speed:2},observations:[{t:0,x:.2,y:.3},{t:.3,x:.25,y:.4}],calibration:{pixelsPerMeter:110,width:1280,height:720}});
 const serialized=JSON.stringify(original);
 const roundtrip=parseExperiment(serialized);
 assert.equal(roundtrip.mode,'material');assert.equal(roundtrip.settings.gravity,.165);
 assert.equal(roundtrip.observations.length,2);assert.equal(roundtrip.calibration.pixelsPerMeter,110);
 assert.equal(serialized.includes('data:video'),false);
 assert.ok(!serialized.includes('filename'));
});
test('rejects unrelated data and unsupported schemas',()=>{
 assert.throws(()=>parseExperiment({}),/Unsupported experiment/);
 assert.throws(()=>parseExperiment('{ invalid'),SyntaxError);
 assert.throws(()=>parseExperiment({format:'realityfork-experiment',schemaVersion:99}),/Unsupported experiment/);
});
test('hash reproducibly encodes settings only, no observation data',()=>{
 const hash=shareHash({gravity:.38,restitution:.8,wind:2,drag:.1,speed:.5},'wind');
 const restored=readHash(hash);
 assert.equal(restored.mode,'wind');assert.equal(restored.settings.wind,2);
 assert.equal(restored.settings.gravity,.38);
 assert.ok(!hash.includes('filename'));assert.ok(!hash.includes('observations'));
});
test('CSV has predictable columns and row count',()=>{
 const csv=rowsToCSV([{t:0,x:.3,y:.5,manual:true}],[{vx:1,vy:2,speed:3,acceleration:4}]);
 assert.equal(csv.trim().split('\n').length,2);
 assert.match(csv,/0,0\.3,0\.5,1,1,2,3,4/);
});
