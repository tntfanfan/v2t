import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {build,dist} from './build.mjs';
build();
const port=Number(process.env.PORT||5175);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{return res.writeHead(400).end();}
 if(pathname==='/favicon.ico')return res.writeHead(204).end();
 if(/^\/english\/(words|build|quiz|chant|story|progress|review)\.html$/.test(pathname))return res.writeHead(302,{Location:'/english/index.html'}).end();
 const file=path.resolve(dist,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!file.startsWith(dist+path.sep)||!fs.statSync(file,{throwIfNoEntry:false})?.isFile())return res.writeHead(404).end('Not found');
 const size=fs.statSync(file).size,headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
 const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
 let start=0,end=size-1,status=200;
 if(range){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),size-1):size-1;if(start>end||start>=size)return res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;}
 res.writeHead(status,{...headers,'Content-Length':end-start+1});
 if(req.method==='HEAD')return res.end();
 const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);req.on('close',()=>stream.destroy());
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`端口 ${port} 已占用，请检查已有首页服务。`:e);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`英语小花园：http://127.0.0.1:${port}/`));
let timer;fs.watch(new URL('../src/',import.meta.url),{recursive:true},()=>{clearTimeout(timer);timer=setTimeout(()=>{build();console.log('页面已更新，刷新浏览器查看。');},150);});
