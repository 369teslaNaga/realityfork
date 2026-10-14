import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webm':'video/webm','.mp4':'video/mp4','.json':'application/json','.txt':'text/plain'};
const port=Number(process.env.PORT||5173);
createServer(async(req,res)=>{
 const url=new URL(req.url||'/', 'http://localhost');
 let path;
 try{path=decodeURIComponent(url.pathname);}catch{res.writeHead(400).end('Bad path');return;}
 const filename=resolve(root,'.'+(path.endsWith('/') ? path+'index.html' : path));
 if(filename!==root && !filename.startsWith(root+sep)){res.writeHead(403).end('Forbidden');return;}
 if(/(^|\/)(\.git|node_modules|docs|tests|scripts)(\/|$)/.test(filename.slice(root.length))){res.writeHead(404).end('Not found');return;}
 try{const s=await stat(filename);if(!s.isFile())throw Error('Not a file');const data=await readFile(filename);res.writeHead(200,{'Content-Type':mime[extname(filename)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Access-Control-Allow-Origin':'same-origin'});res.end(data);}catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`RealityFork running at http://127.0.0.1:${port}`));
