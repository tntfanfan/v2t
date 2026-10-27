const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),app=path.join(root,'src');
const compiler=require('miniprogram-compiler');
const list=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?list(path.join(d,e.name)):[path.join(d,e.name)]);
const config=JSON.parse(fs.readFileSync(path.join(app,'app.json'),'utf8'));
const routes=[...config.pages,...config.subPackages.flatMap(p=>p.pages.map(v=>p.root+'/'+v))];
for(const route of routes)for(const ext of ['js','json','wxml','wxss'])assert.ok(fs.existsSync(path.join(app,route+'.'+ext)),route+'.'+ext);
const sizes={main:0};for(const p of config.subPackages)sizes[p.root]=0;
for(const file of list(app)){
 const rel=path.relative(app,file).replaceAll('\\','/'),pack=config.subPackages.find(p=>rel.startsWith(p.root+'/'));sizes[pack?pack.root:'main']+=fs.statSync(file).size;
 if(file.endsWith('.json'))JSON.parse(fs.readFileSync(file,'utf8'));
 if(!file.endsWith('.js'))continue;
 const js=fs.readFileSync(file,'utf8');new vm.Script(js,{filename:rel});
 for(const m of js.matchAll(/require\(['"](\.[^'"]+)['"]\)/g))assert.ok(fs.existsSync(path.resolve(path.dirname(file),m[1]+'.js')),rel+' '+m[1]);
}
for(const [name,size]of Object.entries(sizes))assert.ok(size<2*1024*1024,`${name}: ${size} exceeds 2 MiB`);
const total=Object.values(sizes).reduce((a,b)=>a+b,0);assert.ok(total<30*1024*1024,'Total package exceeds 30 MiB: '+total);
const wxmlOnly=process.argv.includes('--wxml-only');
const generate=new Function('global','window',compiler.wxmlToJs(app,{maxBuffer:32*1024*1024}))({},{});
if(!wxmlOnly)assert.ok(compiler.wxssToJs(app,{maxBuffer:32*1024*1024}));
const render=(route,data)=>{const tree=generate(route+'.wxml')(data);assert.ok(tree&&tree.children?.length,route);return tree;};
const {makePage}=require('../tests/page-harness.cjs');
let states=0,clips=0;
render('pages/index/index',{});states++;
const islandState={summary:{due:2,overdue:1,total:3},wordCount:2,intervals:[1,2,4,7,15,30],nextLabel:'明天',reward:2};
for(const state of [{view:'home'},{view:'home',summary:{due:0,total:0}},{view:'game',q:{ready:true,number:1,total:2,word:{w:'door',cn:'门',image:'/english/u0/assets/word-0.png'},draft:'',solved:false}},{view:'game',q:{ready:true,number:2,total:2,word:{w:'go camping',cn:'去露营',image:'/english/u9/assets/word-7.png'},draft:'go camping',solved:true,nextLabel:'明天'}},{view:'result'}]){render('pages/island/index',{...islandState,...state});states++;}
for(let u=0;u<10;u++)for(const view of ['home','game','words','recordings','collection','progress']){
 const harness=makePage(u,view);render(`english/u${u}/${view}/index`,harness.page.data);states++;
 if(view==='game'){
  const e=harness.page.engine;
  for(let index=0;index<10;index++){e.round.index=index;harness.page.refresh();render(`english/u${u}/game/index`,harness.page.data);states++;}
 }
 harness.page.onUnload();
}
const {books}=require('../src/data/library'),{stageFor,chapterUrl}=require('../src/lib/reading');
for(const book of books)for(const info of book.chapters){
 const route=chapterUrl(info.number,info.first,book).split('?')[0].slice(1),chapter=require(path.join(app,path.dirname(route),'data'));
 assert.ok(fs.statSync(path.join(app,chapter.image)).size>0);
 for(const panel of chapter.panels){
  for(const clip of [panel,...panel.bubbles]){const bytes=fs.readFileSync(path.join(app,clip.audio));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),clip.sha256);clips++;if(clip.bubbleImage)assert.ok(fs.statSync(path.join(app,clip.bubbleImage)).size>0);}
  for(const view of ['page','panel']){render(route,{chapter,catalog:book,current:panel,selected:panel.bubbles[0]||null,selectedId:panel.bubbles[0]?.id||'',lines:panel.bubbles,view,imageVisible:true,readyImage:true,status:'idle',pageLabels:book.chapters.map(c=>c.title),pageIndex:chapter.number-1,speeds:['0.75×','1.0×','1.25×'],speedIndex:1,elapsed:'0:00',duration:'0:00',seek:0,playSymbol:'▶',playLabel:'听这一格',...stageFor(chapter,panel,view)});states++;}
 }
}
const qa=path.resolve(root,'../../output/qa/frontend/miniprogram');
fs.mkdirSync(qa,{recursive:true});
const report={status:'passed',version:'2.0.0',routes:routes.length,templateStates:states,verifiedOriginalBlueyClips:clips,totalMiB:total/1048576,packages:sizes,limits:{eachMiB:2,totalMiB:30},lessonMediaConfigured:!!require('../src/lib/adventure/media-config').lessonBaseUrl,limitations:['Compiled WXML/WXSS and mocked wx interaction checks; native developer-tool and phone preview still required.','Long textbook recordings need a working HTTPS base URL and WeChat platform domain configuration.']};
if(wxmlOnly){report.status='partial';report.wxssCompiled=false;report.limitations=report.limitations.map(s=>s.replace('Compiled WXML/WXSS','Compiled WXML only'));report.limitations.unshift('WXSS compilation was explicitly omitted with --wxml-only; this is not a full verification pass.');}else report.wxssCompiled=true;
fs.writeFileSync(path.join(qa,wxmlOnly?'verification-wxml-only.json':'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,packages:undefined},null,2));
