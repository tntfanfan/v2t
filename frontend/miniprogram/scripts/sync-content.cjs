const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sharp=require('../../dev-runtime.cjs').load('sharp',path.resolve(__dirname,'..'));
const root=path.resolve(__dirname,'..'),web=path.resolve(root,'../web'),app=path.join(root,'src');
const model=JSON.parse(fs.readFileSync(path.join(web,'src/english/content.json'),'utf8'));
const source=fs.readFileSync(path.join(web,'src/english/app.js'),'utf8');
const context=vm.createContext({SOURCE_UNITS:model.units});vm.runInContext(source.slice(0,source.indexOf('const SENTENCES = makeSentences')),context);
const meta=vm.runInContext('META',context),sentences=vm.runInContext('makeSentences(SOURCE_UNITS)',context);
function write(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);}
const literal=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const memory=fs.readFileSync(path.join(web,'src/english/memory.js'),'utf8');
write(path.join(app,'lib/adventure/memory.js'),memory+'\nmodule.exports = Memory;\n');
const media=JSON.parse(fs.readFileSync(path.join(root,'config/media.json'),'utf8'));
write(path.join(app,'lib/adventure/media-config.js'),'module.exports = '+literal({lessonBaseUrl:media.lessonBaseUrl})+';\n');
write(path.join(app,'lib/adventure/catalog.js'),'module.exports = '+literal(model.units.map((u,i)=>({...meta[i],id:i,words:u.words.map((w,index)=>({w:w.w,cn:w.cn,aliases:w.aliases||[],image:`/english/u${i}/assets/word-${index}.png`,audio:`/english/u${i}/assets/word-${index}.mp3`}))})))+';\n');
write(path.join(app,'lib/adventure/island.js'),"const Memory=require('./memory');\n"+fs.readFileSync(path.join(web,'src/english/island.js'),'utf8')+'\nmodule.exports = Island;\n');
async function wordImage(unit,word){
 const art=word.art;
 if(typeof art==='object'){
  const [x,y,w,h]=art.rect;
  return sharp(path.join(web,'public/english',unit.sheets[art.sheet])).extract({left:Math.floor(x),top:Math.floor(y),width:Math.ceil(w),height:Math.ceil(h)});
 }
 if(art.startsWith('<svg'))return sharp(Buffer.from(art));
 return sharp(path.join(web,'public/english',art));
}
(async()=>{
 for(const u of model.units){
  const pack=`english/u${u.id}`,assets=path.join(app,pack,'assets');fs.mkdirSync(assets,{recursive:true});
  const words=[];
  for(const [i,w]of u.words.entries()){
   const image=`/${pack}/assets/word-${i}.png`,audio=`/${pack}/assets/word-${i}.mp3`;
   await (await wordImage(u,w)).resize(220,220,{fit:'contain',background:'#fffef9'}).png({palette:true}).toFile(path.join(app,image));
   fs.copyFileSync(path.join(web,'public/english',u.audio[w.w]),path.join(app,audio));
   const {art,...rest}=w;words.push({...rest,image,audio});
  }
  const qs=sentences[u.id].map((q,i)=>{
   const audio=`/${pack}/assets/sentence-${i}.mp3`;
   fs.copyFileSync(path.join(web,'public/english',model.sentenceAudio[q.full]),path.join(app,audio));
   return {...q,audio};
  });
  write(path.join(app,pack,'data.js'),'module.exports = '+literal({id:u.id,...meta[u.id],words,sentences:qs,lessons:u.lessons})+';\n');
  for(const view of ['home','game','words','recordings','collection','progress']){
   const dir=path.join(app,pack,view);
   // Routes sit one level below their unit package; shared logic lives in the main package.
   write(path.join(dir,'index.js'),`const createPage=require('../../../lib/adventure/page');\nconst unit=require('../data');\nPage(createPage('${view}',unit,wx));\n`);
   write(path.join(dir,'index.json'),JSON.stringify({navigationBarTitleText:`U${u.id} · ${meta[u.id].title}`,disableScroll:false}));
   write(path.join(dir,'index.wxml'),`<import src="../../../lib/adventure/page.wxml"/><template is="adventure" data="{{...pageData}}"/>`);
   write(path.join(dir,'index.wxss'),'@import "../../../lib/adventure/page.wxss";');
  }
 }
 await sharp(path.join(web,'public/images/bobo.svg')).resize(180,216).png({palette:true}).toFile(path.join(app,'assets/bobo.png'));
 const config=JSON.parse(fs.readFileSync(path.join(app,'app.json'),'utf8'));
 config.pages=['pages/index/index','pages/bluey/index','pages/english/index','pages/island/index'];
 config.subPackages=config.subPackages.filter(p=>!p.root.startsWith('english/'));
 config.subPackages.push(...model.units.map(u=>({root:`english/u${u.id}`,name:`englishUnit${u.id}`,pages:['home','game','words','recordings','collection','progress'].map(v=>v+'/index')})));
 write(path.join(app,'app.json'),JSON.stringify(config,null,2));
 console.log('Generated 10 native unit packages from the retained web content.');
})().catch(e=>{console.error(e);process.exitCode=1;});
