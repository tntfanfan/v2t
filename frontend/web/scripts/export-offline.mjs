// Export the current maintained English source for the existing desktop shortcut.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const destination=process.argv[2];
if(!destination)throw new Error('Pass the existing offline output directory.');
const out=path.resolve(destination),src=path.join(root,'src/english'),media=path.join(root,'public/english');
const read=name=>fs.readFileSync(path.join(src,name),'utf8');
const model=JSON.parse(read('content.json'));
const embedded=JSON.parse(JSON.stringify(model).replace(/fast-assets\/[a-f0-9]+\.(mp3|jpg)/g,(asset,extension)=>
  `data:${extension==='mp3'?'audio/mpeg':'image/jpeg'};base64,${fs.readFileSync(path.join(media,asset)).toString('base64')}`));
const literal=v=>JSON.stringify(v).replace(/</g,'\\u003c');
// An explicit reset request applies once in each browser opening this local export.
// Keep its receipt in the same saved state, so a later refresh cannot clear new work.
const resetId=process.argv.includes('--reset-progress')?'offline-reset-'+Date.now():null;
const resetScript=resetId?`(()=>{try{
 const key='bobo-adventure-u012-v1',id=${JSON.stringify(resetId)};
 const old=JSON.parse(localStorage.getItem(key)||'null')||{};
 if(old.offlineResetId!==id)localStorage.setItem(key,JSON.stringify({unit:old.unit,effects:old.effects,dailyWordCount:old.dailyWordCount,resetId:id,offlineResetId:id}));
}catch{}})();\n`:'';
const script=`${resetScript}const SOURCE_UNITS=${literal(embedded.units)};\nconst SENTENCE_AUDIO=${literal(embedded.sentenceAudio)};\n${read('memory.js')}\n${read('island.js')}\n${read('app.js')}\n${read('island-view.js')}`;
const html=read('index.html').replace(/<link rel="stylesheet"[^>]+>\s*/g,'')
  .replace(/<nav class="product-nav"[\s\S]*?<\/nav>/,'')
  .replace('</head>',()=>`<style>${read('style.css')}</style></head>`)
  .replace(/<script src="data.js"><\/script><script src="memory.js"><\/script><script src="island.js"><\/script><script src="island-view.js"><\/script><script src="app.js"><\/script>/,
    ()=>`<script>${script.replace(/<\/script/gi,'<\\/script')}</script>`);
fs.mkdirSync(out,{recursive:true});
for(const lesson of model.units.flatMap(u=>u.lessons)){
  const file=path.join(out,lesson.src);
  if(!fs.existsSync(file)){fs.mkdirSync(path.dirname(file),{recursive:true});fs.copyFileSync(path.join(media,lesson.src),file);}
}
for(const name of ['英语星球冒险_U0-U2.html','英语星球冒险_U0-U9.html','index.html'])fs.writeFileSync(path.join(out,name),html);
console.log(JSON.stringify({destination:out,htmlBytes:Buffer.byteLength(html),units:model.units.length,words:model.units.flatMap(u=>u.words).length,resetOnNextOpen:!!resetId}));
