const test=require('node:test'),assert=require('node:assert/strict');
const createPage=require('../src/lib/adventure/island-page'),{Engine,Memory,catalog,KEY}=require('../src/lib/adventure/engine');
function harness(){
 const store=new Map(),api={getStorageSync:k=>store.get(k),setStorageSync:(k,v)=>store.set(k,JSON.parse(JSON.stringify(v))),showToast(){},pageScrollTo(){},reLaunch(o){this.route=o.url;},loadSubpackage(o){this.loaded=o.name;o.success();}};
 const e=new Engine(api,require('../src/english/u0/data'));
 for(const id of [0,9])Memory.pass(e.state.progress[id],catalog[id].words[0].w,{day:Memory.today()-1});e.save();
 const player={stop(){},play(clip){this.clip=clip;}};global.getApp=()=>({player});
 const def=createPage(api),page={...def,data:{...def.data},setData(v){Object.assign(this.data,v);}};page.onLoad();page.onShow();return {page,api,store,player};
}
test('native island presents mixed units, loads the matching subpackage and persists unfinished input',()=>{
 const {page,api,store,player}=harness();try{assert.equal(page.data.summary.due,2);page.start();assert.equal(page.data.q.ready,true);page.input({detail:{value:'partial'}});assert.equal(store.get(KEY).island.items[0].draft,'partial');page.listen();assert.match(player.clip.audio,/\/english\/u0\//);page.input({detail:{value:page.data.q.word.w}});page.answer();page.next();assert.equal(api.loaded,'englishUnit9');assert.equal(page.data.q.word.w,catalog[9].words[0].w);assert.equal(page.data.q.total,2);}finally{page.onUnload();}
});
test('native completed session awards once and offers the next review date',()=>{
 const {page,store}=harness();try{page.start();while(page.view==='game'){page.input({detail:{value:page.data.q.word.w}});page.answer();page.next();}assert.equal(page.view,'result');assert.equal(page.data.summary.due,0);assert.ok(page.data.nextLabel);assert.equal(store.get(KEY).progress.reduce((n,p)=>n+p.stars,0),2);page.next();assert.equal(store.get(KEY).progress.reduce((n,p)=>n+p.stars,0),2);}finally{page.onUnload();}
});
test('stale native island cannot resurrect records after a reset',()=>{
 const {page,api,store}=harness();try{page.start();const e=new Engine(api,require('../src/english/u0/data'));e.reset();page.input({detail:{value:'old'}});assert.equal(store.get(KEY).island,null);assert.equal(page.view,'home');}finally{page.onUnload();}
});
