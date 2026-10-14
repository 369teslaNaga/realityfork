import { DURATION, WORLD, clamp, sampleTimeline } from './engine.js';
import { sanitizeObservations } from './analysis.js';
const INK='#e9f1ff', SKY='#7feaff', LIME='#d3ff72', QUIET='#8294b1';
function label(ctx,text,x,y,size=14,color=INK,weight=600){ctx.fillStyle=color;ctx.font=`${weight} ${size}px Inter, system-ui, sans-serif`;ctx.fillText(text,x,y);}
function roundRect(ctx,x,y,w,h,r=12){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function backdrop(ctx,w,h,variant='real'){
 const grad=ctx.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#0d1c31');grad.addColorStop(.6,'#0b1828');grad.addColorStop(1,'#0a1322');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
 ctx.save();ctx.strokeStyle='rgba(131,166,201,0.105)';ctx.lineWidth=1;
 for(let x=0;x<w;x+=55){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
 for(let y=0;y<h;y+=55){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
 ctx.restore();
 const glow=ctx.createRadialGradient(w*.72,h*.35,0,w*.72,h*.35,w*.7);glow.addColorStop(0,variant==='fork'?'rgba(206,255,111,.10)':'rgba(64,220,255,.10)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
}
function sceneCoordinates(w,h,c=WORLD){const pad=36;const width=w-2*pad,height=h-2*pad;const scale=Math.min(width/c.width,height/c.height);return {scale,x: (w-c.width*scale)/2,y:(h-c.height*scale)/2};}
function worldPoint(p,tr){return {x:tr.x+p.x*tr.scale,y:tr.y+p.y*tr.scale};}
function linePath(ctx, frames, until, tr, col, opacity=.75) {
 ctx.beginPath();let started=false;const n=Math.min(frames.length,Math.floor(until / (frames[1]?.t || 1/120))+1);
 for(let i=0;i<n;i+=3){const p=frames[i],c=worldPoint(p,tr);if(!started){ctx.moveTo(c.x,c.y);started=true;}else ctx.lineTo(c.x,c.y);}
 if(!started)return;
 ctx.strokeStyle=col;ctx.globalAlpha=opacity;ctx.lineWidth=3;ctx.lineJoin='round';ctx.stroke();ctx.globalAlpha=1;
}
function drawBall(ctx,x,y,r,col){ctx.save();ctx.shadowColor=col;ctx.shadowBlur=28;const gradient=ctx.createRadialGradient(x-r*.34,y-r*.38,r*.04,x,y,r);gradient.addColorStop(0,'#fff');gradient.addColorStop(.25,col);gradient.addColorStop(1,'#39718b');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();}
function videoRect(video,w,h){const vw=video.videoWidth||16,vh=video.videoHeight||9;const s=Math.min(w/vw,h/vh);return {x:(w-vw*s)/2,y:(h-vh*s)/2,w:vw*s,h:vh*s};}
function drawObservations(ctx,obs,w,h,t,variant='real',video=null){
 const pts=sanitizeObservations(obs);
 const rect=video?.videoWidth ? videoRect(video,w,h) : {x:0,y:0,w,h};
 const visible=pts.filter(p=>p.t<=t+.012);
 if(!visible.length)return;
 ctx.beginPath();visible.forEach((p,i)=>{const x=rect.x+p.x*rect.w,y=rect.y+p.y*rect.h;if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);});
 ctx.strokeStyle=variant==='fork'?LIME:SKY;ctx.lineWidth=3;ctx.stroke();
 for(let i=0;i<visible.length;i+=Math.max(1,Math.round(visible.length/14))){const p=visible[i];ctx.beginPath();ctx.arc(rect.x+p.x*rect.w,rect.y+p.y*rect.h,3,0,Math.PI*2);ctx.fillStyle=variant==='fork'?LIME:SKY;ctx.fill();}
 const end=visible.at(-1);drawBall(ctx,rect.x+end.x*rect.w,rect.y+end.y*rect.h,8,variant==='fork'?LIME:SKY);
}
export function drawScene(ctx, timeline, time, {kind='real',observations=[],video=null,showVideo=false,source='synthetic',annotation='',noTrackedVideo=false}={}) {
 const w=ctx.canvas.width,h=ctx.canvas.height;
 backdrop(ctx,w,h,kind);
 const tl=timeline;const world=tl.world||WORLD;const tr=sceneCoordinates(w,h,world);const groundY=worldPoint({x:0,y:world.ground},tr).y;
 if(showVideo&&video?.videoWidth&&!noTrackedVideo){const r=videoRect(video,w,h);try{ctx.save();ctx.globalAlpha=.86;ctx.drawImage(video,r.x,r.y,r.w,r.h);ctx.restore();}catch{}ctx.fillStyle='rgba(6,16,27,.15)';ctx.fillRect(0,0,w,h);}else{
  // Not a real-world background: procedural visualization with explicit status label.
  ctx.fillStyle='#12293e';ctx.fillRect(0,groundY,w,h-groundY);
  ctx.fillStyle='rgba(189,232,248,.24)';ctx.fillRect(0,groundY,w,2);
  ctx.fillStyle='#abc2d4';ctx.font='11px system-ui';ctx.fillText('GROUND PLANE · 2D MODEL',tr.x+12,groundY+20);
 }
 if(showVideo && video?.videoWidth && kind==='real' && !observations?.length){
   label(ctx,'NO TRACK YET · CLICK THE OBJECT TO SELECT IT',22,h-46,13,SKY,700);
 } else if(observations?.length&&kind==='real'){
   drawObservations(ctx,observations,w,h,time,'real',showVideo&&!noTrackedVideo?video:null);
 }else{
   linePath(ctx,tl.frames,time,tr,kind==='fork'?LIME:SKY,.85);
   const p=sampleTimeline(tl,time),pt=worldPoint(p,tr);
   ctx.save();ctx.globalAlpha=.2;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(pt.x,groundY,22,5,0,0,Math.PI*2);ctx.fill();ctx.restore();
   drawBall(ctx,pt.x,pt.y,world.radius*tr.scale,kind==='fork'?LIME:SKY);
 }
 ctx.fillStyle='rgba(7,18,30,.75)';roundRect(ctx,14,14,Math.min(w-28,270),34,8);ctx.fill();
 label(ctx,annotation|| (kind==='real'?'OBSERVED · SYNTHETIC SAMPLE':'FORKED · COMPUTED MODEL'),27,36,11,kind==='fork'?LIME:SKY,700);
 label(ctx,`${time.toFixed(2)}s`,w-70,h-21,14,'#c9daea',600);
}
export function drawMotionGraph(ctx, observed, fork, {unit='m',title='Vertical position'}={}){
 const w=ctx.canvas.width,h=ctx.canvas.height;const dpr=1;
 backdrop(ctx,w,h,'real');const pad={l:66,r:18,t:34,b:38};const usableW=w-pad.l-pad.r,usableH=h-pad.t-pad.b;
 const all=[...observed,...fork].map(x=>x.v).filter(Number.isFinite);let min=Math.min(...all,0),max=Math.max(...all,1);if(!Number.isFinite(min)||!Number.isFinite(max)){min=0;max=1;}
 if(max-min<.0001)max+=1;const extra=(max-min)*.12;min-=extra;max+=extra;
 const duration=Math.max(1,...[...observed,...fork].map(x=>x.t));
 const xx=t=>pad.l+t/duration*usableW,yy=v=>pad.t+(max-v)/(max-min)*usableH;
 ctx.strokeStyle='rgba(169,196,223,.19)';ctx.lineWidth=1;
 for(let i=0;i<=4;i++){const y=pad.t+usableH*i/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();label(ctx,(max-(max-min)*i/4).toFixed(1),14,y+4,11,QUIET,500);}
 for(let i=0;i<=4;i++){const x=pad.l+usableW*i/4;ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,h-pad.b);ctx.stroke();label(ctx,(duration*i/4).toFixed(1)+'s',x-8,h-14,11,QUIET,500);}
 for(const [series,color] of [[observed,SKY],[fork,LIME]]){
  if(!series.length)continue;ctx.beginPath();series.forEach((p,i)=>{if(i===0)ctx.moveTo(xx(p.t),yy(p.v));else ctx.lineTo(xx(p.t),yy(p.v));});ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();
 }
 label(ctx,`${title} (${unit})`,pad.l,20,13,INK,700);
}
function pill(ctx,x,y,text,color){ctx.font='700 14px system-ui';const width=ctx.measureText(text).width+30;roundRect(ctx,x,y-21,width,30,9);ctx.fillStyle='rgba(255,255,255,.075)';ctx.fill();label(ctx,text,x+15,y,14,color,700);return width;}
export function paintRealityCard(canvas,{sourceCanvas,forkCanvas,time,settings,sourceType='synthetic',mode='gravity'}={}){
 const c=canvas.getContext('2d');canvas.width=1600;canvas.height=940;const w=canvas.width,h=canvas.height;
 const grad=c.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#071626');grad.addColorStop(1,'#0d1726');c.fillStyle=grad;c.fillRect(0,0,w,h);
 const glow=c.createRadialGradient(900,150,0,900,150,900);glow.addColorStop(0,'#243c4a');glow.addColorStop(1,'#07162600');c.fillStyle=glow;c.fillRect(0,0,w,h);
 label(c,'REALITYFORK',56,100,54,'#eff8ff',900);label(c,'CHANGE THE LAWS. FORK REALITY.',59,139,17,LIME,800);
 label(c,`A DIFFERENT WORLD, ONE VARIABLE AT A TIME.`,59,195,18,'#b8c8d8',500);
 const paneTop=245,paneH=435,paneW=728;
 for(const [x,title,src,color] of [[55,'01 / OBSERVED',sourceCanvas,SKY],[817,'02 / FORKED WORLD',forkCanvas,LIME]]){
  c.fillStyle='#112234';roundRect(c,x,paneTop-45,paneW,paneH+67,17);c.fill();label(c,title,x+23,paneTop-15,19,color,800);
  if(src)c.drawImage(src,x+8,paneTop+4,paneW-16,paneH-16);
 }
 pill(c,60,771,`GRAVITY ${settings.gravity.toFixed(2)}×`,LIME);
 pill(c,290,771,`BOUNCE ${settings.restitution.toFixed(2)}`,SKY);
 pill(c,510,771,`WIND ${settings.wind.toFixed(1)} m/s²`,'#f6cd8c');
 pill(c,760,771,`TIME ${time.toFixed(2)}s`,'#f4eefc');
 label(c,`MODE / ${mode.toUpperCase()}`,60,844,20,'#e7f2fe',700);
 label(c,`SOURCE: ${sourceType==='synthetic'?'SYNTHETIC DEMO':sourceType==='video'?'USER VIDEO + DERIVED TRACK':'IMPORTED TRACK'} · SIMULATED PATH IS A MODEL, NOT ALTERED FOOTAGE`,60,880,15,'#afc0d1',600);
 label(c,'369 TESLA  ·  KALVIYOGI                                      OPEN SOURCE  ·  LOCAL-FIRST  ·  NO PAID API',60,919,15,LIME,700);
 return canvas;
}
export function paintShareFilm(canvas,{realTL,forkTL,t,settings,sourceType='synthetic',observations=[]}={}){
 const ctx=canvas.getContext('2d');const w=canvas.width,h=canvas.height;
 backdrop(ctx,w,h);label(ctx,'REALITYFORK',36,64,38,INK,900);label(ctx,'CHANGE THE LAWS. FORK REALITY.',38,95,15,LIME,800);
 const left=document.createElement('canvas'),right=document.createElement('canvas');left.width=right.width=584;left.height=right.height=355;
 drawScene(left.getContext('2d'),realTL,t,{kind:'real',observations,source:sourceType,noTrackedVideo:true,annotation:sourceType==='synthetic'?'OBSERVED · SYNTHETIC DEMO':'OBSERVED · DERIVED TRACK REPLAY'});
 drawScene(right.getContext('2d'),forkTL,t,{kind:'fork',annotation:'FORKED · MODEL'});
 ctx.drawImage(left,36,140);ctx.drawImage(right,660,140);
 label(ctx,`GRAVITY ${settings.gravity.toFixed(2)}×   /   BOUNCE ${settings.restitution.toFixed(2)}   /   WIND ${settings.wind.toFixed(1)} m/s²`,38,570,19,INK,800);
 label(ctx,`TIME ${t.toFixed(2)}s                         Synthetic / derived data only. Not a scientifically validated video transformation.`,38,620,15,QUIET,600);
 label(ctx,'369 TESLA  ·  KALVIYOGI     ·     OPEN SOURCE',38,685,16,LIME,800);
}
