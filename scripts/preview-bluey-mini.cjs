// Render compiled WXML for visual QA. This does not emulate the WeChat runtime.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/Zwhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const compiler=require('E:/v2t/miniprogram/bluey-reader/node_modules/miniprogram-compiler');
const root='E:/英语复习/miniprogram/english-review-bluey-v5',appRoot=path.join(root,'miniprogram');
const generate=new Function('global','window',compiler.wxmlToJs(appRoot))({},{});
const {books}=require(path.join(appRoot,'data/library')),{stageFor}=require(path.join(appRoot,'lib/reading'));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html(n){
 if(typeof n==='string'||typeof n==='number')return esc(n);if(!n)return '';if(!n.tag||n.tag==='virtual')return(n.children||[]).map(html).join('');
 const tag=({'wx-page':'main','wx-view':'div','wx-text':'span','wx-image':'img','wx-button':'button','wx-picker':'div','wx-slider':'input','wx-navigator':'a'})[n.tag]||'div',a=n.attr||{};
 let attrs=['class','style'].filter(k=>a[k]!==undefined).map(k=>' '+k+'="'+esc(a[k])+'"').join('');
 if(a.src)attrs+=' src="'+pathToFileURL(path.join(appRoot,a.src)).href+'"';
 if(a.disabled)attrs+=' disabled';if(tag==='input')attrs+=' type="range"';
 return '<'+tag+attrs+'>'+(n.children||[]).map(html).join('')+(['img','input'].includes(tag)?'':'</'+tag+'>');
}
function css(file,width){return fs.readFileSync(path.join(appRoot,file),'utf8').replace(/(-?[\d.]+)rpx/g,(_,n)=>Number(n)*width/750+'px').replace(/(?<![-\w])(page|view|text|image)(?![-\w])/g,n=>({page:'body',view:'div',text:'span',image:'img'}[n]));}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const page=await browser.newPage({viewport:{width:390,height:844}});
 const catalog=books[1],chapter=require(path.join(appRoot,'magic/p07/data')),panel=chapter.panels[2];
 const cases=[['mini-home','pages/index/index',{},'pages/index/index.wxss'],['mini-books','pages/bluey/index',{catalog,books,saved:{started:false,panel:1},opening:false},'pages/bluey/index.wxss']];
 for(const view of ['panel','page'])cases.push(['mini-'+view,'magic/p07/index',Object.assign({chapter,catalog,current:panel,selected:panel.bubbles[0],selectedId:panel.bubbles[0].id,lines:panel.bubbles,view,imageVisible:true,readyImage:true,status:'idle',speeds:['0.75×','1.0×','1.25×'],speedIndex:1,elapsed:'0:00',duration:'0:00',seek:0,playSymbol:'▶',playLabel:'听这一格',playerKind:'第39格 · 视频原声',playerMessage:'点气泡听一句，点画面听整格',storageAvailable:true},stageFor(chapter,panel,view)),'magic/p07/index.wxss']);
 for(const [name,route,data,style] of cases){
  const target=path.join(root,'qa',name+'.html');fs.writeFileSync(target,'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}img{display:block}button{font-family:inherit}input{width:100%}'+css('app.wxss',390)+css(style,390)+'</style>'+html(generate(route+'.wxml')(data)));
  await page.goto(pathToFileURL(target).href);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:path.join(root,'qa',name+'.png'),fullPage:true});
 }
 await browser.close();console.log('Four compiled-WXML layout previews saved; not a native WeChat runtime.');
})().catch(e=>{console.error(e);process.exit(1)});
