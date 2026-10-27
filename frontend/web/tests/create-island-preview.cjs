// Build a disposable browser fixture from the exact standalone release HTML.
// No test controls or seed records are copied into the production release.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const release=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
if(!process.argv[2]||!process.argv[3]||fs.existsSync(out))throw Error('Pass release and a new QA directory.');
const content=require('../src/english/content.json');
const day=Math.floor((Date.now()+8*3600000)/86400000);
const seed={unit:0,effects:false,dailyWordCount:2,resetId:'fixture',dailyByUnit:content.units.map(()=>null),progress:content.units.map(()=>({stars:0,rounds:0,memory:{}}))};
for(const [unit,delta,stars] of [[0,-1,10],[9,0,2],[5,3,4]]){
 const w=content.units[unit].words[0].w;
 // Old-format records exercise migration while retaining existing review dates.
 seed.progress[unit].stars=stars;seed.progress[unit].memory[w]={passes:1,lastPass:day+delta-1,due:day+delta,shown:day-2,practice:1,attempts:1};
}
const bootstrap=`(()=>{
 const key='bobo-island-browser-qa-v1',clock='bobo-island-browser-qa-day';
 if(!localStorage.getItem(key))localStorage.setItem(key,${JSON.stringify(JSON.stringify(seed))});
 if(!localStorage.getItem(clock))localStorage.setItem(clock,'${day}');
 Date.now=()=>Number(localStorage.getItem(clock))*86400000;
 document.addEventListener('DOMContentLoaded',()=>{
  const tools=document.createElement('aside');tools.id='qaControls';tools.style='padding:12px;background:#fff3c8;color:#243e3f;font:16px sans-serif;';
  tools.innerHTML='<strong>仅演示数据 · 独立验证页面</strong> <button id="qaNextDay">模拟第二天</button> <button id="qaReset">重置演示数据</button>';
  document.body.prepend(tools);
  document.getElementById('qaNextDay').onclick=()=>{localStorage.setItem(clock,String(Number(localStorage.getItem(clock))+1));location.reload();};
  document.getElementById('qaReset').onclick=()=>{localStorage.setItem(key,${JSON.stringify(JSON.stringify(seed))});localStorage.setItem(clock,'${day}');location.reload();};
 });
})();`;
let html=fs.readFileSync(path.join(release,'index.html'),'utf8').replace("const STORAGE_KEY = 'bobo-adventure-u012-v1';","const STORAGE_KEY = 'bobo-island-browser-qa-v1';");
if(html.includes("const STORAGE_KEY = 'bobo-adventure-u012-v1';"))throw Error('QA must use isolated storage');
html=html.replace('<script>',()=>'<script>'+bootstrap+'\n');
new vm.Script([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1]);
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'index.html'),html);
for(const dir of ['fast-assets','u0-u9-assets'])fs.cpSync(path.join(release,dir),path.join(out,dir),{recursive:true});
fs.writeFileSync(path.join(out,'fixture.json'),JSON.stringify({seedDay:day,words:[0,9,5].map(unit=>({unit,word:content.units[unit].words[0].w})),initialStars:16,productionStorageKeyUsed:false},null,2));
console.log(out);
