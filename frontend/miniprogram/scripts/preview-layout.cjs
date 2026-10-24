// Compiled WXML layout checks; this is not a native WeChat simulator.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const runtime=require('../../dev-runtime.cjs'),{chromium}=runtime.load('playwright',path.resolve(__dirname,'..'));
const compiler=require('miniprogram-compiler');
const root=path.resolve(__dirname,'..'),app=path.join(root,'src'),qa=path.resolve(root,'../../output/qa/frontend/miniprogram/layout');
fs.mkdirSync(qa,{recursive:true});
const generate=new Function('global','window',compiler.wxmlToJs(app,{maxBuffer:32*1024*1024}))({},{});
const {makePage}=require('../tests/page-harness.cjs');
const {books}=require('../src/data/library'),{stageFor}=require('../src/lib/reading');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html(n){
 if(typeof n==='string'||typeof n==='number')return esc(n);if(!n)return '';if(!n.tag||n.tag==='virtual')return(n.children||[]).map(html).join('');
 const tag=({'wx-page':'main','wx-view':'div','wx-text':'span','wx-image':'img','wx-button':'button','wx-picker':'div','wx-slider':'input','wx-input':'input','wx-navigator':'a','wx-scroll-view':'div'})[n.tag]||'div',a=n.attr||{};
 let attrs=['class','style'].filter(k=>a[k]!==undefined).map(k=>' '+k+'="'+esc(a[k])+'"').join('');
 if(a.src)attrs+=' src="'+(a.src.startsWith('http')?esc(a.src):pathToFileURL(path.join(app,a.src)).href)+'"';
 if(a.disabled)attrs+=' disabled';if(n.tag==='wx-input')attrs+=' type="text" value="'+esc(a.value||'')+'" placeholder="'+esc(a.placeholder||'')+'"';if(n.tag==='wx-slider')attrs+=' type="range"';
 return '<'+tag+attrs+'>'+(n.children||[]).map(html).join('')+(['img','input'].includes(tag)?'':'</'+tag+'>');
}
function css(file,width){let code=fs.readFileSync(file,'utf8');code=code.replace(/@import\s+["']([^"']+)["'];?/g,(_,p)=>css(path.resolve(path.dirname(file),p),width));return code.replace(/(-?[\d.]+)rpx/g,(_,n)=>Number(n)*width/750+'px').replace(/(?<![-\w.])(page|view|text|image|navigator)(?![-\w])/g,n=>({page:'body',view:'div',text:'span',image:'img',navigator:'a'}[n]));}
const cases=[['welcome','pages/index/index',{}]];
for(const view of ['home','words','recordings','collection','progress']){const h=makePage(0,view);cases.push(['english-'+view,'english/u0/'+view+'/index',h.page.data]);h.page.onUnload();}
for(const i of [0,2,4,6,8]){const h=makePage(3,'game');h.page.engine.round.index=i;h.page.refresh();cases.push(['game-'+h.page.engine.current().type,'english/u3/game/index',h.page.data]);h.page.onUnload();}
for(const [book,dir]of [[books[0],'chapters/p01'],[books[1],'magic/p07']]){const chapter=require(path.join(app,dir,'data')),panel=chapter.panels[2];for(const view of ['panel','page'])cases.push([book.episode+'-'+view,dir+'/index',{chapter,catalog:book,current:panel,selected:panel.bubbles[0],selectedId:panel.bubbles[0]?.id||'',lines:panel.bubbles,view,imageVisible:true,readyImage:true,status:'idle',pageLabels:book.chapters.map(c=>c.title),pageIndex:chapter.number-1,speeds:['0.75×','1.0×','1.25×'],speedIndex:1,elapsed:'0:00',duration:'0:00',seek:0,playSymbol:'▶',playLabel:'听这一格',playerKind:'视频原声',playerMessage:'点气泡听一句，点画面听整格',storageAvailable:true,...stageFor(chapter,panel,view)}]);}
(async()=>{
 const browser=await chromium.launch(runtime.browserOptions());
 try{const page=await browser.newPage();const results=[];
 for(const width of [360,390]){await page.setViewportSize({width,height:844});for(const [name,route,data]of cases){
  const target=path.join(qa,`${name}-${width}.html`);fs.writeFileSync(target,'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}img{display:block;object-fit:contain}button,input{font-family:inherit;box-sizing:border-box}input[type=range]{width:100%}'+css(path.join(app,'app.wxss'),width)+css(path.join(app,route+'.wxss'),width)+'</style>'+html(generate(route+'.wxml')(data)));
  await page.goto(pathToFileURL(target).href);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
  const result=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,brokenImages:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src)}));
  assert.equal(result.brokenImages.length,0,name+' broken images');assert.ok(result.scrollWidth<=width+1,name+' horizontal overflow: '+result.scrollWidth);
  if(width===390)await page.screenshot({path:path.join(qa,`${name}.png`),fullPage:true});results.push({name,...result});
 }}fs.writeFileSync(path.join(qa,'report.json'),JSON.stringify({status:'passed',note:'Compiled WXML in Chromium, not native WeChat runtime',cases:results},null,2));console.log('Layout checks passed: '+results.length+' states; screenshots in '+qa);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
