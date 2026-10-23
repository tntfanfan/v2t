const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||'E:/英语复习/miniprogram/english-review-bluey-v5'),appRoot=path.join(root,'miniprogram');
const list=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?list(path.join(dir,e.name)):[path.join(dir,e.name)]);
const read=f=>fs.readFileSync(f,'utf8'),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const oldRoot='E:/英语复习/miniprogram/english-review-bluey-v2/miniprogram';
const files=list(appRoot),app=JSON.parse(read(path.join(appRoot,'app.json'))),config=JSON.parse(read(path.join(root,'project.config.json')));
assert.equal(config.appid,'wxeffdeea9ba92682b');
const routes=[...app.pages,...app.subPackages.flatMap(p=>p.pages.map(page=>p.root+'/'+page))];assert.equal(routes.length,24);
for(const route of routes)for(const ext of ['js','json','wxml','wxss'])assert.ok(fs.existsSync(path.join(appRoot,route+'.'+ext)),route+'.'+ext);
for(const file of files){
 if(file.endsWith('.json'))JSON.parse(read(file));
 if(file.endsWith('.js'))new vm.Script(read(file),{filename:file});
 if(!/\.(js|wxml|wxss|json)$/.test(file))continue;
 const source=read(file);
 for(const m of source.matchAll(/require\(['"](\.[^'"]+)['"]\)/g))assert.ok(fs.existsSync(path.resolve(path.dirname(file),m[1]+'.js')),file+' -> '+m[1]);
 assert.ok(!/localhost|127\.0\.0\.1|wx391fb3582be51f5c|wxda7774b0c474eb96/.test(source),file);
}
let originalMedia=0,reviewFiles=0;
for(const f of list(oldRoot)){
 const rel=path.relative(oldRoot,f);
 if(rel.startsWith('review')||/\.(mp3|jpg|png)$/.test(rel)){assert.equal(hash(path.join(appRoot,rel)),hash(f),'Original changed '+rel);if(rel.startsWith('review'))reviewFiles++;else originalMedia++;}
}
const sizes={main:0};for(const p of app.subPackages)sizes[p.root]=0;
for(const f of files){const rel=path.relative(appRoot,f).replaceAll('\\','/');const pack=app.subPackages.find(p=>rel.startsWith(p.root+'/'));sizes[pack?pack.root:'main']+=fs.statSync(f).size;}
for(const [name,bytes]of Object.entries(sizes))assert.ok(bytes<2*1024*1024,`${name} exceeds 2MiB: ${bytes}`);
const total=Object.values(sizes).reduce((a,b)=>a+b,0);assert.ok(total<30*1024*1024,'Total exceeds current 30MiB limit');
const {books}=require(path.join(appRoot,'data/library')),{stageFor,chapterUrl,readProgress,writeProgress}=require(path.join(appRoot,'lib/reading'));
const compiler=require('E:/v2t/miniprogram/bluey-reader/node_modules/miniprogram-compiler');
const generator=new Function('global','window',compiler.wxmlToJs(appRoot))({},{});assert.ok(compiler.wxssToJs(appRoot));
let states=0,audio=0;
function render(route,data){const t=generator(route+'.wxml')(data);assert.ok(t?.children?.length,route);states++;return t;}
render('pages/index/index',{});
for(const catalog of books){
 render('pages/bluey/index',{catalog,books,saved:{panel:1,started:false},opening:false});
 for(const c of catalog.chapters){
  const route=chapterUrl(c.number,c.first,catalog).split('?')[0].slice(1),chapter=require(path.join(appRoot,path.dirname(route),'data'));
  for(const panel of chapter.panels){
   for(const clip of [panel,...panel.bubbles]){assert.ok(fs.statSync(path.join(appRoot,clip.audio)).size>0);assert.equal(hash(path.join(appRoot,clip.audio)),clip.sha256);audio++;}
   for(const view of ['page','panel']){
    const stage=stageFor(chapter,panel,view);
    render(route,Object.assign({chapter,catalog,current:panel,selected:panel.bubbles[0]||null,selectedId:panel.bubbles[0]?.id||'',lines:panel.bubbles,view,imageVisible:true,readyImage:true,status:'idle',pageLabels:catalog.chapters.map(c=>c.title),pageIndex:chapter.number-1,speeds:['0.75×','1.0×','1.25×'],speedIndex:1,elapsed:'0:00',duration:'0:00',seek:0,playSymbol:'▶',playLabel:'听这一格'},stage));
    if(catalog.episode==='S03E10'){assert.equal(stage.artSpots.length,view==='panel'?1:6);assert.ok(stage.bubbleSpots.every(b=>b.text));}
   }
   if(chapter.overlayBubbles){
    assert.deepEqual(panel.rect,panel.imageRect);assert.deepEqual(panel.artRect,panel.imageRect);
    const [x,y,w,h]=panel.imageRect;
    for(const b of panel.bubbles){const r=b.visualRect||b.rect;assert.ok(r[0]>=x&&r[0]+r[2]<=x+w);assert.ok(r[1]>=y&&r[1]+r[3]<=y+h);if(b.bubbleImage)assert.ok(fs.statSync(path.join(appRoot,b.bubbleImage)).size>0);}
   }
  }
 }
}
const storage=new Map(),api={getStorageSync:k=>storage.get(k),setStorageSync:(k,v)=>storage.set(k,v)};
writeProgress(api,{panel:54,started:true},books[0]);writeProgress(api,{panel:72,started:true},books[1]);
assert.equal(readProgress(api,books[0]).panel,54);assert.equal(readProgress(api,books[1]).panel,72);
assert.equal(chapterUrl(12,72,books[1]),'/magic/p12/index?panel=72');
const {makePage,event}=require(path.join(root,'tests/harness.cjs'));const {page}=makePage();
for(const tab of page.data.tabs){page.switchTab(event({tab:tab.id}));render('review/pages/index/index',page.data);}page.onUnload();
const report={status:'passed',version:'1.2.2',routes:routes.length,templateStatesRendered:states,originalMediaUnchanged:originalMedia,englishReviewFilesUnchanged:reviewFiles,originalAudioFilesVerified:audio,independentProgress:true,packageBytes:sizes,totalMiB:+(total/1048576).toFixed(3),packageLimitSource:'https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html',limits:{eachMiB:2,totalMiB:30},limitations:['Native simulator / phone checks recorded separately.','Full manual audio-boundary listening remains pending.']};
fs.writeFileSync(path.join(root,'qa/integration-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
