/** Intentionally modest local RGB region tracker, not a universal vision model. */
function diff3(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
export function trackPixelFrame(data, width, height, rgb, prior = null, tolerance = 85) {
  if (!data || !width || !height || !rgb) return null;
  let mx=0,my=0,mass=0,matched=0;
  const pr = prior ? .28 : 1.6;
  for(let y=0;y<height;y+=2){
    for(let x=0;x<width;x+=2){
      if(prior && Math.hypot((x/width-prior.x),(y/height-prior.y))>pr)continue;
      const i=(y*width+x)*4;
      if(data[i+3]<160)continue;
      const dis=diff3([data[i],data[i+1],data[i+2]],rgb);
      if(dis>tolerance)continue;
      const weight=Math.max(.01,1-dis/tolerance);
      mx+=x*weight;my+=y*weight;mass+=weight;matched++;
    }
  }
  if(matched<4 || mass<1.2)return null;
  return {x:mx/(mass*width),y:my/(mass*height),matched};
}
function seekFrame(video, t, signal) {
  return new Promise((resolve,reject)=>{
    if(signal?.aborted)return reject(new DOMException('Cancelled','AbortError'));
    if(Math.abs(video.currentTime-t)<.002 && video.readyState>=2)return resolve();
    let done=false;
    const clean=()=>{clearTimeout(timer);video.removeEventListener('seeked',onSeek);video.removeEventListener('error',onError);signal?.removeEventListener('abort',onAbort);};
    const finish=(err)=>{if(done)return;done=true;clean();err?reject(err):resolve();};
    const onSeek=()=>finish(),onError=()=>finish(Error('The browser could not decode this video frame.')),
      onAbort=()=>finish(new DOMException('Cancelled','AbortError'));
    const timer=setTimeout(()=>finish(Error('Frame decoding timed out. Try a shorter MP4/WebM.')),3200);
    video.addEventListener('seeked',onSeek);video.addEventListener('error',onError);signal?.addEventListener('abort',onAbort);
    try{video.currentTime=t;}catch(e){finish(e);}
  });
}
export async function analyzeVideo(video, rgb, { signal, onProgress, count=48, maxSeconds=7 }={}) {
  if(!video?.videoWidth || !video?.videoHeight || !Number.isFinite(video.duration)) throw Error('Choose a supported video first.');
  if(!rgb)throw Error('First pause and click the colored ball in the left video.');
  const duration=Math.min(maxSeconds,video.duration);
  if(duration<.25)throw Error('Video is too short. Try a clip longer than 0.25 seconds.');
  const c=document.createElement('canvas');
  const scale=Math.min(1,280/video.videoWidth,190/video.videoHeight);
  c.width=Math.max(16,Math.round(video.videoWidth*scale));c.height=Math.max(16,Math.round(video.videoHeight*scale));
  const ctx=c.getContext('2d',{willReadFrequently:true});
  let target=null;const points=[];
  for(let i=0;i<count;i++){
    if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
    const t=Math.min(Math.max(0,duration-.012),i*(duration-.012)/(count-1));
    await seekFrame(video,t,signal);
    ctx.drawImage(video,0,0,c.width,c.height);
    let hit=trackPixelFrame(ctx.getImageData(0,0,c.width,c.height).data,c.width,c.height,rgb,target);
    // Recovery: search the full frame occasionally, rather than silently invent positions.
    if(!hit && i%5===0)hit=trackPixelFrame(ctx.getImageData(0,0,c.width,c.height).data,c.width,c.height,rgb,null);
    if(hit){target=hit;points.push({t:Number(t.toFixed(4)),x:hit.x,y:hit.y,manual:false});}
    if(i%4===0)onProgress?.(i+1,count);
  }
  if(points.length<5)throw Error(`Only ${points.length}/${count} frames detected. Use a steady, short clip with a distinct colored ball.`);
  return {points,requestedSamples:count};
}
