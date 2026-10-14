import { DEFAULTS, DURATION, WORLD, INITIAL, GRAVITIES, MATERIALS, STEP, buildSourceTimeline, simulate, sampleTimeline, normalizeSettings, clamp } from './engine.js';
import { analyzeVideo } from './tracker.js';
import { sanitizeObservations, measureTrack, estimateInitial, confidenceSummary, calculateSeries } from './analysis.js';
import { buildExperiment, parseExperiment, shareHash, readHash, rowsToCSV, downloadBlob, downloadText } from './io.js';
import { drawScene, drawMotionGraph, paintRealityCard, paintShareFilm } from './render.js';
const el=id=>document.getElementById(id);
const MODE_COPY={
 gravity:['01','GravityFork','What if Earth was the Moon? Watch how gravity changes the very same launch.'],
 time:['02','TimeFork','Freeze the moment, scrub every frame, or accelerate the simulation without changing its physics.'],
 material:['03','MaterialFork','Change collision restitution and see how rebound heights change over repeated impacts.'],
 wind:['04','WindFork','Rewrite horizontal forces and drag. Watch the alternate trajectory diverge.'],
 motion:['05','MotionDNA','Reveal the measured track, position, speed, and acceleration — with honest calibration limits.'],
 share:['06','RealityShare','Capture a Reality Card, export a clip, or share your reproducible experiment settings.']
};
const srcVideo=el('sourceVideo');
const originalCanvas=el('realCanvas'),forkCanvas=el('forkCanvas'),graphCanvas=el('graphCanvas');
const realCtx=originalCanvas.getContext('2d'),forkCtx=forkCanvas.getContext('2d'),graphCtx=graphCanvas.getContext('2d');
const restored=readHash(location.hash);
const state={mode:restored?.mode||'gravity',settings:normalizeSettings(restored?.settings||DEFAULTS),time:0,playing:true,sourceType:'synthetic',obs:[],sampleCount:0,selectedRGB:null,selectedPoint:null,videoURL:null,videoDuration:DURATION,videoDims:{width:0,height:0},calibration:{pixelsPerMeter:0,width:0,height:0},tracking:null,recording:false};
let reference=buildSourceTimeline();
let fork=simulate(state.settings);
let lastStamp=performance.now();
const maxDuration=()=>state.sourceType==='video'?Math.min(DURATION,state.videoDuration||DURATION):DURATION;
function setStatus(message,warning=false){const tag=el('status');tag.textContent=message;tag.dataset.kind=warning?'warn':'good';}
function pause(){state.playing=false;srcVideo.pause();el('playBtn').textContent='▶';el('playBtn').setAttribute('aria-label','Resume playback');}
async function play(){if(state.tracking || state.recording)return;state.playing=true;el('playBtn').textContent='Ⅱ';el('playBtn').setAttribute('aria-label','Pause playback');if(state.sourceType==='video'){srcVideo.playbackRate=state.settings.speed;try{await srcVideo.play();}catch(e){pause();setStatus('Browser blocked video playback. Press Play again.',true);}}}
function seekTime(t){state.time=clamp(t,0,maxDuration());if(state.sourceType==='video' && Number.isFinite(srcVideo.duration) && srcVideo.readyState>0){try{srcVideo.currentTime=Math.min(Math.max(0,state.time),srcVideo.duration-.001);}catch{}}render();}
function recompile(){
 if(state.obs.length){const init=estimateInitial(state.obs);fork=simulate(state.settings,init,{...WORLD,ground:init.ground});}
 else fork=simulate(state.settings);
 redrawGraph();render();
}
function setSettings(next){state.settings=normalizeSettings({...state.settings,...next});updateFields();recompile();}
function updateFields(){
 const s=state.settings;
 for(const [id,value] of [['gravityRange',s.gravity],['speedRange',s.speed],['bounceRange',s.restitution],['windRange',s.wind],['dragRange',s.drag]])el(id).value=String(value);
 el('gravityValue').textContent=`${s.gravity.toFixed(3)}×`;
 el('speedValue').textContent=`${s.speed.toFixed(2)}×`;
 el('bounceValue').textContent=s.restitution.toFixed(2);
 el('windValue').textContent=`${s.wind.toFixed(1)} m/s²`;
 el('dragValue').textContent=`${s.drag.toFixed(3)} s⁻¹`;
 el('forkLabel').textContent=`GRAVITY ${s.gravity.toFixed(2)}×`;
 el('dataGravity').innerHTML=`${(s.gravity*9.81).toFixed(2)} <span>m/s²</span>`;
 el('dataWind').innerHTML=`${s.wind.toFixed(1)} <span>m/s²</span>`;
 for(const b of document.querySelectorAll('[data-gravity]'))b.classList.toggle('is-active',Math.abs(Number(b.dataset.gravity)-s.gravity)<.002);
 for(const b of document.querySelectorAll('[data-speed]'))b.classList.toggle('is-active',Math.abs(Number(b.dataset.speed)-s.speed)<.04);
 for(const b of document.querySelectorAll('[data-material]'))b.classList.toggle('is-active',Math.abs(MATERIALS[b.dataset.material]-s.restitution)<.005);
 for(const b of document.querySelectorAll('[data-wind]'))b.classList.toggle('is-active',Math.abs(Number(b.dataset.wind)-s.wind)<.05);
 if(state.sourceType==='video'){try{srcVideo.playbackRate=s.speed;}catch{}}
}
function selectMode(mode){if(!MODE_COPY[mode])return;state.mode=mode;
 el('modeNumber').textContent=`EXPERIMENT / ${MODE_COPY[mode][0]}`;
 el('modeTitle').innerHTML=`${MODE_COPY[mode][1]} <span class="up-arrow">↗</span>`;
 el('modeDescription').textContent=MODE_COPY[mode][2];
 el('activeModeShort').textContent=mode.toUpperCase();
 for(const tab of document.querySelectorAll('.mode-tab')){const active=tab.dataset.mode===mode;tab.classList.toggle('selected',active);tab.setAttribute('aria-pressed',String(active));}
 for(const control of document.querySelectorAll('.mode-control'))control.hidden=control.dataset.control!==mode;
 redrawGraph();
}
function observationsAtTime(){return state.obs;}
function render(){
 const t=state.time,s=state.settings;
 drawScene(realCtx,reference,t,{kind:'real',observations:observationsAtTime(),video:srcVideo,showVideo:state.sourceType==='video',source:state.sourceType,
  annotation:state.sourceType==='synthetic'?'OBSERVED · SYNTHETIC DEMO':state.sourceType==='video'?'OBSERVED · USER VIDEO':'OBSERVED · IMPORTED TRACK'});
 drawScene(forkCtx,fork,t,{kind:'fork',annotation:'FORKED · 2D PHYSICS MODEL'});
 const timeline=el('timeline');timeline.max=String(maxDuration());timeline.value=String(t);
 el('clock').textContent=`${t.toFixed(2)} / ${maxDuration().toFixed(2)} s`;
 el('dataBounces').textContent=String(sampleTimeline(fork,t).bounceCount);
 el('dataTime').innerHTML=`${t.toFixed(2)} <span>s</span>`;
}
function redrawGraph(){
 const key=el('graphVariable').value;
 const title=el('graphVariable').selectedOptions[0].textContent;
 if(state.obs.length){
   const report=calculateSeries(key,reference,fork,state.obs,state.calibration);
   const factorX=state.calibration.pixelsPerMeter>0 && state.videoDims.width ? state.videoDims.width/state.calibration.pixelsPerMeter:1;
   const factorY=state.calibration.pixelsPerMeter>0 && state.videoDims.height ? state.videoDims.height/state.calibration.pixelsPerMeter:1;
   const mapped=fork.frames.filter((_,i)=>i%10===0).map(p=>{
     const fx=factorX/WORLD.width,fy=factorY/WORLD.height;
     const k=report.key;
     return {t:p.t,v:k==='x'?p.x*fx:k==='y'?p.y*fy:k==='speed'?Math.hypot(p.vx*fx,p.vy*fy):Math.hypot((state.settings.wind-state.settings.drag*p.vx)*fx,(9.81*state.settings.gravity-state.settings.drag*p.vy)*fy)};
   });
   drawMotionGraph(graphCtx,report.observed,mapped,{unit:report.unit,title});
   el('graphNote').textContent=state.calibration.pixelsPerMeter>0?'Measured scale is user-provided; perspective can distort values.':'Uncalibrated frame fractions / second; model overlay illustrative.';
 } else {
   const r=calculateSeries(key,reference,fork,[],{});
   drawMotionGraph(graphCtx,r.observed,r.fork,{title,unit:r.unit});
   el('graphNote').textContent='Synthetic reference and alternate world; model units only.';
 }
}
function tick(now){
 const elapsed=Math.min(.05,Math.max(0,(now-lastStamp)/1000));lastStamp=now;
 if(state.playing && !state.tracking && !state.recording){
   if(state.sourceType==='video'){
      state.time=Math.min(maxDuration(),srcVideo.currentTime||0);
      if(state.time>=maxDuration()-.03){srcVideo.currentTime=0;state.time=0;}
   } else {state.time+=elapsed*state.settings.speed;if(state.time>maxDuration())state.time=0;}
 }
 render();requestAnimationFrame(tick);
}
function updateTrackState(){
 const conf=confidenceSummary(state.obs,state.sampleCount);
 el('sourceLabel').textContent=state.sourceType==='synthetic'?'SYNTHETIC DEMO':state.sourceType==='video'?'LOCAL VIDEO': 'IMPORTED OBSERVATIONS';
 el('realCaption').textContent=state.sourceType==='synthetic'?'Deterministic synthetic reference — not real camera footage':state.sourceType==='video'?'User-provided footage · local RGB tracking is approximate':'Imported derived observations · original video not included';
 el('trackStat').textContent=state.obs.length?conf.note:state.sourceType==='video'?'Pause, select a colored object, then Track or Mark frame.':'Sample world ready. Try all six experiment modes.';
 el('confidenceStat').textContent=`TRACK QUALITY: ${conf.grade} — ${conf.note}`;
 el('trackBtn').disabled=state.sourceType!=='video'||!state.selectedRGB||!!state.tracking;
 el('markBtn').disabled=state.sourceType!=='video'||!state.selectedPoint;
}
function resetSource(){
 state.tracking?.abort();state.tracking=null;pause();
 if(state.videoURL){URL.revokeObjectURL(state.videoURL);state.videoURL=null;}
 srcVideo.removeAttribute('src');srcVideo.load();state.sourceType='synthetic';state.obs=[];state.sampleCount=0;state.selectedRGB=null;state.selectedPoint=null;state.videoDims={width:0,height:0};state.calibration={pixelsPerMeter:0,width:0,height:0};state.videoDuration=DURATION;el('calibrationRange').value='0';
 state.time=0;recompile();updateTrackState();setStatus('Synthetic sample restored. Try Moon, Material, Wind, and TimeFork.');void play();
}
async function loadVideo(file){
 if(!file)return;
 if(file.size > 175*1024*1024){setStatus('For browser performance, use a video under 175 MB.',true);return;}
 if(file.type && !file.type.startsWith('video/')){setStatus('Choose a supported video file (MP4 or WebM recommended).',true);return;}
 state.tracking?.abort();state.tracking=null;pause();
 if(state.videoURL)URL.revokeObjectURL(state.videoURL);
 state.videoURL=URL.createObjectURL(file);state.sourceType='video';state.obs=[];state.sampleCount=0;state.selectedRGB=null;state.selectedPoint=null;state.time=0;state.videoDuration=DURATION;
 srcVideo.src=state.videoURL;srcVideo.loop=true;srcVideo.load();
 try{await new Promise((resolve,reject)=>{let ended=false;const done=e=>{if(ended)return;ended=true;clearTimeout(timer);srcVideo.removeEventListener('loadedmetadata',ok);srcVideo.removeEventListener('error',bad);e?reject(e):resolve();};const ok=()=>done(),bad=()=>done(Error('Cannot decode this video in your browser.'));const timer=setTimeout(()=>done(Error('Video metadata timed out. Try a smaller file.')),10000);srcVideo.addEventListener('loadedmetadata',ok);srcVideo.addEventListener('error',bad);});
   if(!srcVideo.videoWidth || !Number.isFinite(srcVideo.duration)||srcVideo.duration<.25)throw Error('Video needs valid dimensions and duration over 0.25 seconds.');
   state.videoDims={width:srcVideo.videoWidth,height:srcVideo.videoHeight};state.calibration.width=srcVideo.videoWidth;state.calibration.height=srcVideo.videoHeight;state.videoDuration=srcVideo.duration;
   recompile();updateTrackState();setStatus(`Local video ready (${srcVideo.videoWidth}×${srcVideo.videoHeight}). Pause, click the ball in the left canvas, then Track.`);render();
 }catch(e){resetSource();setStatus(`Video error: ${e.message}`,true);}
}
function selectVideoColor(evt){
 if(state.sourceType!=='video'||!srcVideo.videoWidth)return;
 pause();const rect=originalCanvas.getBoundingClientRect();const X=(evt.clientX-rect.left)/rect.width*originalCanvas.width,Y=(evt.clientY-rect.top)/rect.height*originalCanvas.height;
 const vw=srcVideo.videoWidth,vh=srcVideo.videoHeight,W=originalCanvas.width,H=originalCanvas.height;
 const sc=Math.min(W/vw,H/vh),ox=(W-vw*sc)/2,oy=(H-vh*sc)/2;
 const videoX=(X-ox)/sc,videoY=(Y-oy)/sc;
 if(videoX<0||videoY<0||videoX>vw||videoY>vh){setStatus('Click inside the video image to select the ball.',true);return;}
 const c=document.createElement('canvas');c.width=c.height=1;const ctx=c.getContext('2d',{willReadFrequently:true});
 try{ctx.drawImage(srcVideo,Math.floor(videoX),Math.floor(videoY),1,1,0,0,1,1);const d=ctx.getImageData(0,0,1,1).data;state.selectedRGB=[d[0],d[1],d[2]];state.selectedPoint={x:videoX/vw,y:videoY/vh};updateTrackState();setStatus(`Color selected: rgb(${state.selectedRGB.join(', ')}). Click Track selected color or mark this frame.`);
 }catch{setStatus('Could not sample this frame. Try another timestamp.',true);}
}
async function track(){
 if(state.sourceType!=='video'||!state.selectedRGB)return;
 state.tracking?.abort();const ac=new AbortController();state.tracking=ac;pause();el('trackBtn').disabled=true;
 setStatus('Tracking frames locally. The browser may take a moment to decode the video.');
 try{const result=await analyzeVideo(srcVideo,state.selectedRGB,{signal:ac.signal,count:48,maxSeconds:maxDuration(),onProgress:(i,n)=>{if(i%8===1)setStatus(`Local tracking ${i}/${n} frames · your video stays on this device`);}});
   state.obs=sanitizeObservations(result.points);state.sampleCount=result.requestedSamples;state.time=0;srcVideo.currentTime=0;
   recompile();updateTrackState();const quality=confidenceSummary(state.obs,state.sampleCount);
   setStatus(`Tracked ${state.obs.length}/${state.sampleCount} frames · ${quality.grade} evidence. Change laws and export the result.`);
 }catch(e){if(e.name!=='AbortError')setStatus(`Tracker: ${e.message}`,true);}
 finally{if(state.tracking===ac)state.tracking=null;updateTrackState();render();}
}
function addManualPoint(){
 if(state.sourceType!=='video'||!state.selectedPoint)return;
 const p={t:Number(srcVideo.currentTime.toFixed(4)),x:state.selectedPoint.x,y:state.selectedPoint.y,manual:true};
 // Replace a nearby mark rather than hiding two points at same timestamp.
 state.obs=sanitizeObservations([...state.obs.filter(x=>Math.abs(x.t-p.t)>.03),p]);state.sampleCount=0;recompile();updateTrackState();setStatus(`Added a manual point at ${p.t.toFixed(2)}s. Step frames and add more to build an observed track.`);
}
async function copyShareLink(){
 const url=new URL(location.href);url.hash=shareHash(state.settings,state.mode);
 try{await navigator.clipboard.writeText(url.toString());setStatus(location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'?'Local URL copied. Deploy to GitHub Pages for a publicly usable link.':'Copied a settings-only experiment URL (no video or track included).');}
 catch{window.prompt('Copy this reproducible URL. Videos and observed tracks are not included:',url.toString());setStatus('Link displayed for manual copying; no data was uploaded.');}
}
function makePNG(){try{render();const c=document.createElement('canvas');paintRealityCard(c,{sourceCanvas:originalCanvas,forkCanvas:forkCanvas,time:state.time,settings:state.settings,sourceType:state.sourceType,mode:state.mode});c.toBlob(blob=>{if(blob){downloadBlob(blob,'realityfork-reality-card.png');setStatus('Reality Card saved as PNG. Explicitly exported screenshot may include the current source frame.');}else setStatus('PNG encoding failed.',true);},'image/png');}catch(e){setStatus(`PNG export failed: ${e.message}`,true);}}
async function makeWebM(){
 if(state.recording)return;
 const can=document.createElement('canvas');can.width=1280;can.height=720;
 if(!can.captureStream||typeof MediaRecorder==='undefined'){setStatus('This browser cannot record canvas WebM. Use PNG export instead.',true);return;}
 const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
 if(!mime){setStatus('WebM recording unavailable in this browser. Try Chromium or Firefox.',true);return;}
 let recorder,stream;
 state.recording=true;pause();el('webmBtn').disabled=true;
 try{
   stream=can.captureStream(30);
   recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2600000});
   const chunks=[];recorder.addEventListener('dataavailable',e=>{if(e.data.size)chunks.push(e.data);});
   const done=new Promise((res,rej)=>{recorder.addEventListener('stop',()=>res(new Blob(chunks,{type:mime})),{once:true});recorder.addEventListener('error',()=>rej(Error('MediaRecorder failed.')),{once:true});});
   recorder.start(200);const start=performance.now(),duration=5000;
   await new Promise(resolve=>{const paint=now=>{const sec=clamp((now-start)/1000,0,5);paintShareFilm(can,{realTL:reference,forkTL:fork,t:sec,settings:state.settings,sourceType:state.sourceType,observations:state.obs});if(now-start<duration)requestAnimationFrame(paint);else resolve();};requestAnimationFrame(paint);});
   recorder.stop();const blob=await done;
   if(blob.size<500)throw Error('The recorded clip appears empty.');
   downloadBlob(blob,'realityfork-5sec-demo.webm');setStatus('5s WebM exported. Uploaded video pixels are not included; only derived track visualization.');
 }catch(e){try{if(recorder?.state==='recording')recorder.stop();}catch{}setStatus(`WebM export failed: ${e.message}`,true);}
 finally{stream?.getTracks().forEach(t=>t.stop());state.recording=false;el('webmBtn').disabled=false;}
}
function exportJSON(){const document=buildExperiment({...state,settings:state.settings,observations:state.obs,sourceType:state.sourceType,calibration:state.calibration});downloadText(JSON.stringify(document,null,2),'realityfork-experiment.json','application/json');setStatus('Experiment exported. JSON contains settings and derived observations only — no original video.');}
async function importJSON(file){if(!file)return;try{if(file.size>1000000)throw Error('JSON file exceeds 1 MB.');const loaded=parseExperiment(await file.text());resetSource();pause();state.settings=normalizeSettings(loaded.settings);state.mode=loaded.mode;state.obs=loaded.observations;state.sampleCount=loaded.sampleCount;state.calibration=loaded.calibration;state.videoDims={width:loaded.calibration.width,height:loaded.calibration.height};state.sourceType=state.obs.length?'imported':'synthetic';el('calibrationRange').value=String(state.calibration.pixelsPerMeter);
 updateTrackState();updateFields();selectMode(state.mode);recompile();setStatus(`Loaded experiment schema v1 with ${state.obs.length} derived points. Original source video is not present.`);
 }catch(e){setStatus(`Import failed: ${e.message}`,true);}finally{el('importFile').value='';}}
function exportCSV(){if(!state.obs.length){setStatus('Upload and track a video, or mark frames, before exporting observations.',true);return;}
 const measurements=measureTrack(state.obs,state.calibration.pixelsPerMeter,state.calibration.width,state.calibration.height);
 downloadText(rowsToCSV(state.obs,measurements),'realityfork-observed-track.csv','text/csv');setStatus('CSV exported. Velocity columns are frame/s unless you entered a calibrated pixels-per-metre scale.');}
function attach(){
 document.querySelectorAll('.mode-tab').forEach(btn=>btn.addEventListener('click',()=>selectMode(btn.dataset.mode)));
 el('heroMoon').addEventListener('click',()=>{selectMode('gravity');setSettings({gravity:GRAVITIES.Moon});el('workspace').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});setStatus('Moon gravity selected. Compare the cyan Earth path with the green Moon trajectory.');});
 el('gravityRange').addEventListener('input',e=>setSettings({gravity:Number(e.target.value)}));
 el('speedRange').addEventListener('input',e=>setSettings({speed:Number(e.target.value)}));
 el('bounceRange').addEventListener('input',e=>setSettings({restitution:Number(e.target.value)}));
 el('windRange').addEventListener('input',e=>setSettings({wind:Number(e.target.value)}));
 el('dragRange').addEventListener('input',e=>setSettings({drag:Number(e.target.value)}));
 document.querySelectorAll('[data-gravity]').forEach(btn=>btn.addEventListener('click',()=>setSettings({gravity:Number(btn.dataset.gravity)})));
 document.querySelectorAll('[data-speed]').forEach(btn=>btn.addEventListener('click',()=>setSettings({speed:Number(btn.dataset.speed)})));
 document.querySelectorAll('[data-material]').forEach(btn=>btn.addEventListener('click',()=>setSettings({restitution:MATERIALS[btn.dataset.material]})));
 document.querySelectorAll('[data-wind]').forEach(btn=>btn.addEventListener('click',()=>setSettings({wind:Number(btn.dataset.wind)})));
 el('defaultBtn').addEventListener('click',()=>{state.settings=normalizeSettings(DEFAULTS);updateFields();recompile();setStatus('Default Earth physics restored.');});
 el('sampleBtn').addEventListener('click',resetSource);
 el('videoFile').addEventListener('change',e=>{void loadVideo(e.target.files?.[0]);e.target.value='';});
 originalCanvas.addEventListener('click',selectVideoColor);
 el('trackBtn').addEventListener('click',()=>void track());
 el('markBtn').addEventListener('click',addManualPoint);
 el('playBtn').addEventListener('click',()=>state.playing?pause():void play());
 el('resetBtn').addEventListener('click',()=>{seekTime(0);setStatus('Timeline restarted.');});
 el('stepBack').addEventListener('click',()=>{pause();seekTime(state.time-1/30);});
 el('stepNext').addEventListener('click',()=>{pause();seekTime(state.time+1/30);});
 el('timeline').addEventListener('input',e=>{pause();seekTime(Number(e.target.value));});
 el('graphVariable').addEventListener('change',redrawGraph);
 el('calibrationRange').addEventListener('change',e=>{const n=Number(e.target.value);state.calibration.pixelsPerMeter=Number.isFinite(n)?clamp(n,0,10000):0;redrawGraph();setStatus(n>0?`Using user-reported ${n} pixels/metre, assuming one camera plane.`:'Calibration disabled. Using normalized frame fractions.');});
 el('csvBtn').addEventListener('click',exportCSV);
 el('pngBtn').addEventListener('click',makePNG);
 el('webmBtn').addEventListener('click',()=>void makeWebM());
 el('jsonBtn').addEventListener('click',exportJSON);
 el('linkBtn').addEventListener('click',()=>void copyShareLink());
 el('importFile').addEventListener('change',e=>void importJSON(e.target.files?.[0]));
 document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName))return;if(e.key===' '){e.preventDefault();state.playing?pause():void play();}else if(e.key==='ArrowRight'){e.preventDefault();pause();seekTime(state.time+1/30);}else if(e.key==='ArrowLeft'){e.preventDefault();pause();seekTime(state.time-1/30);}});
 window.addEventListener('pagehide',()=>{state.tracking?.abort();if(state.videoURL)URL.revokeObjectURL(state.videoURL);srcVideo.pause();});
}
attach();updateTrackState();updateFields();selectMode(state.mode);render();requestAnimationFrame(tick);
// Narrow, read-only API for self-hosted verification. No secrets, no video access.
window.__realityforkTest={getState:()=>({mode:state.mode,settings:{...state.settings},time:state.time,sourceType:state.sourceType,observations:state.obs.length}),pause,seekTime,sourceTimeline:()=>reference.frames.length,forkAt:t=>sampleTimeline(fork,t),getTrack:()=>[...state.obs]};
