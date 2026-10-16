import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {basePath,stripBase} from '../dist/js/site.js';
const root = resolve('dist');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.xml':'application/xml','.txt':'text/plain'};
http.createServer(async(req,res)=>{
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400);res.end();return; }
  if(pathname==='/'){res.writeHead(302,{Location:basePath+'/'});res.end();return;}
  pathname=stripBase(pathname);
  if(pathname===null){res.writeHead(404);res.end();return;}
  let file = resolve(root,'.'+pathname);
  if (file!==root && !file.startsWith(root+sep)) {res.writeHead(403);res.end();return;}
  let status = 200;
  try { if ((await stat(file)).isDirectory()) file=resolve(file,'index.html'); await stat(file); }
  catch { if(extname(file)){res.writeHead(404);res.end();return;} file=resolve(root,'404.html');status=404; }
  try {const body=await readFile(file);res.writeHead(status,{'Content-Type':mime[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(body);}
  catch {res.writeHead(503);res.end('Run npm run build first.');}
}).listen(4276,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:4276${basePath}/`));
