import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
export const dist=path.join(root,'dist');
function copyTree(from,to){
 fs.mkdirSync(to,{recursive:true});
 for(const entry of fs.readdirSync(from,{withFileTypes:true})){
  const source=path.join(from,entry.name),target=path.join(to,entry.name);
  if(entry.isDirectory())copyTree(source,target);
  else if(entry.name!=='content.json'&&(!fs.existsSync(target)||!fs.readFileSync(source).equals(fs.readFileSync(target))))fs.copyFileSync(source,target);
 }
}
export function build(){
 copyTree(path.join(root,'public'),dist);copyTree(path.join(root,'src'),dist);
 const model=JSON.parse(fs.readFileSync(path.join(root,'src/english/content.json'),'utf8'));
 const literal=v=>JSON.stringify(v).replace(/</g,'\\u003c');
 fs.writeFileSync(path.join(dist,'english/data.js'),`const SOURCE_UNITS = ${literal(model.units)};\nconst SENTENCE_AUDIO = ${literal(model.sentenceAudio)};\n`);
 return dist;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(build());
