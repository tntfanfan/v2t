// Publish the existing standalone English site from the maintained web source.
// This deliberately excludes the local export's one-time progress reset.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
if(!process.argv[2])throw new Error('Pass a new publication directory.');
const out=path.resolve(process.argv[2]),src=path.join(root,'src/english');
if(fs.existsSync(out))throw new Error('Use a new directory to preserve earlier publications.');
const read=name=>fs.readFileSync(path.join(src,name),'utf8');
const model=JSON.parse(read('content.json'));
const literal=v=>JSON.stringify(v).replace(/</g,'\\u003c');
const script=`const SOURCE_UNITS=${literal(model.units)};\nconst SENTENCE_AUDIO=${literal(model.sentenceAudio)};\n${read('memory.js')}\n${read('island.js')}\n${read('app.js')}\n${read('island-view.js')}`;
const html=read('index.html').replace(/<link rel="stylesheet"[^>]+>\s*/g,'')
  .replace(/<nav class="product-nav"[\s\S]*?<\/nav>/,'')
  .replace('</head>',()=>`<style>${read('style.css')}</style></head>`)
  .replace(/<script src="data.js"><\/script><script src="memory.js"><\/script><script src="island.js"><\/script><script src="island-view.js"><\/script><script src="app.js"><\/script>/,
    ()=>`<script>${script.replace(/<\/script/gi,'<\\/script')}</script>`);
assert.ok(!html.includes('offline-reset-'));
assert.ok(!html.includes('data:audio/mpeg;base64,'));
assert.ok(html.includes('id="dailyWordCount"'));
fs.mkdirSync(out,{recursive:true});
for(const dir of ['fast-assets','u0-u9-assets'])fs.cpSync(path.join(root,'public/english',dir),path.join(out,dir),{recursive:true});
fs.writeFileSync(path.join(out,'index.html'),html);
fs.writeFileSync(path.join(out,'_headers'),'/\n  Cache-Control: public, max-age=0, must-revalidate\n\n/index.html\n  Cache-Control: public, max-age=0, must-revalidate\n\n/fast-assets/*\n  Cache-Control: public, max-age=31536000, immutable\n');
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
const paths=files(out),sizes=paths.map(f=>fs.statSync(f).size);
console.log(JSON.stringify({dist:out,files:paths.length,bytes:sizes.reduce((a,b)=>a+b,0),max_file_bytes:Math.max(...sizes),html_bytes:Buffer.byteLength(html),html_sha256:crypto.createHash('sha256').update(html).digest('hex'),words_per_round:{default:2,min:1,max:6},round_levels:5,automatic_progress_reset:false},null,2));
