import test from 'node:test';
import assert from 'node:assert/strict';
import {trackPixelFrame} from '../src/tracker.js';
test('local RGB segmentation locates bright target in a neutral frame',()=>{
 const w=80,h=50,data=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;data[i]=25;data[i+1]=35;data[i+2]=45;data[i+3]=255;
  if((x-34)**2+(y-20)**2<100){data[i]=245;data[i+1]=71;data[i+2]=18;}
 }
 const hit=trackPixelFrame(data,w,h,[245,71,18]);
 assert.ok(hit);assert.ok(Math.abs(hit.x-34/w)<.025);assert.ok(Math.abs(hit.y-20/h)<.04);
});
test('tracker returns null rather than making up points',()=>{
 const data=new Uint8ClampedArray(30*30*4);for(let i=3;i<data.length;i+=4)data[i]=255;
 assert.equal(trackPixelFrame(data,30,30,[255,10,10]),null);
});
