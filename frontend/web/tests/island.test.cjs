const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../src/english');
const model=JSON.parse(fs.readFileSync(path.join(root,'content.json'),'utf8'));
function fixture(){
 const c=vm.createContext({});vm.runInContext(['memory.js','island.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n'),c);
 const {Memory,Island}=vm.runInContext('({Memory,Island})',c),units=model.units;
 const state={dailyWordCount:2,island:null,progress:units.map(u=>({stars:0,independent:0,assisted:0,studyTurn:0,studyClock:0,memory:Memory.hydrate({},u.words)}))};
 return {Memory,Island,units,state};
}
test('spacing expands 1, 2, 4, 7, 15, 30 days from actual completion; same-day retries do not advance',()=>{
 const {Memory:M,state:s,units}=fixture(),p=s.progress[0],w=units[0].words[0].w;let day=20000;
 M.pass(p,w,{day});assert.equal(p.memory[w].due,day+1);
 for(const gap of [2,4,7,15,30,30]){day=p.memory[w].due;M.pass(p,w,{mode:'review',day});assert.equal(p.memory[w].due,day+gap);const step=p.memory[w].reviewStep;M.pass(p,w,{mode:'review',day});assert.equal(p.memory[w].reviewStep,step);assert.equal(p.memory[w].due,day+gap);}
});
test('late review moves forward one stage, anchored to the actual day',()=>{
 const {Memory:M,state:s,units}=fixture(),w=units[0].words[0].w;M.pass(s.progress[0],w,{day:20000});M.pass(s.progress[0],w,{mode:'review',day:20020});assert.equal(s.progress[0].memory[w].due,20022);
});
test('legacy saved mastery and due dates survive migration',()=>{
 const {Memory:M,units}=fixture(),w=units[0].words[0].w;
 const record=M.hydrate({[w]:{passes:3,lastPass:19999,due:20006,shown:19999}},units[0].words)[w];
 assert.equal(record.passes,3);assert.equal(record.due,20006);assert.equal(record.learned,true);assert.equal(record.reviewStep,2);
});
test('global queue combines units, prioritizes overdue, excludes unlearned and future words',()=>{
 const {Memory:M,Island:I,state:s,units:u}=fixture();
 M.pass(s.progress[0],u[0].words[0].w,{day:19999});M.pass(s.progress[9],u[9].words[0].w,{day:19997});M.pass(s.progress[3],u[3].words[0].w,{day:20000});
 assert.deepEqual(JSON.parse(JSON.stringify(I.summary(s,u,20000))),{total:3,due:2,overdue:1,next:20001,remaining:0});
 const round=I.start(s,u,20000);assert.deepEqual(Array.from(round.items,q=>q.unit),[9,0]);
});
test('wrong answers and hints shorten spacing to tomorrow without losing the old word',()=>{
 const {Memory:M,Island:I,state:s,units:u}=fixture(),w=u[2].words[0].w;
 M.pass(s.progress[2],w,{day:19999});I.start(s,u,20000);s.island.items[0].draft='incorrect';assert.equal(I.answer(s,u,20000),false);assert.equal(s.progress[2].memory[w].passes,0);assert.equal(s.progress[2].memory[w].learned,true);assert.equal(s.progress[2].memory[w].due,20001);
 s.island.items[0].draft=w;I.answer(s,u,20000);assert.equal(s.progress[2].memory[w].passes,1);assert.equal(s.progress[2].memory[w].due,20001);
 I.next(s);I.start(s,u,20001);I.hint(s);s.island.items[0].draft=w;I.answer(s,u,20001);assert.equal(s.progress[2].memory[w].reviewStep,0);assert.equal(s.progress[2].memory[w].due,20002);
});
test('saved mixed-unit drafts resume unchanged across midnight and preference changes; rewards exactly once',()=>{
 const {Memory:M,Island:I,state:s,units:u}=fixture();for(const i of [0,7,9])M.pass(s.progress[i],u[i].words[0].w,{day:19999});
 I.start(s,u,20000);s.island.items[0].draft='partial';s.dailyWordCount=6;s.island=I.hydrate(JSON.parse(JSON.stringify(s.island)),u);
 assert.equal(I.start(s,u,20001).items.length,2);assert.equal(s.island.items[0].draft,'partial');
 while(!s.island.committed){const q=I.current(s);q.draft=q.wordKey;I.answer(s,u,20001);I.next(s);}
 assert.equal(s.progress.reduce((n,p)=>n+p.stars,0),2);I.next(s);assert.equal(s.progress.reduce((n,p)=>n+p.stars,0),2);
 assert.equal(I.start(s,u,20001).items.length,1);
});
test('no due words means no early session; opening on the due day exposes the reminder',()=>{
 const {Memory:M,Island:I,state:s,units:u}=fixture();assert.equal(I.start(s,u,20000),null);M.pass(s.progress[1],u[1].words[0].w,{day:20000});assert.equal(I.start(s,u,20000),null);assert.equal(I.summary(s,u,20001).due,1);assert.ok(I.start(s,u,20001));
});
test('every allowed parent limit caps a batch without dropping the rest',()=>{
 for(let n=1;n<=6;n++){const {Memory:M,Island:I,state:s,units:u}=fixture();s.dailyWordCount=n;for(const unit of u)M.pass(s.progress[unit.id],unit.words[0].w,{day:19999});assert.equal(I.start(s,u,20000).items.length,n);assert.equal(I.summary(s,u,20000).due,10);}
});
test('invalid cross-unit saved questions and duplicate items are rejected',()=>{
 const {Memory:M,Island:I,state:s,units:u}=fixture();M.pass(s.progress[0],u[0].words[0].w,{day:19999});I.start(s,u,20000);const bad=JSON.parse(JSON.stringify(s.island));bad.items[0].unit=9;assert.equal(I.hydrate(bad,u),null);const duplicate=JSON.parse(JSON.stringify(s.island));duplicate.items.push(duplicate.items[0]);assert.equal(I.hydrate(duplicate,u),null);
});
test('new-word selection leaves previously learned words for the global island',()=>{
 const {Memory:M,state:s,units:u}=fixture(),p=s.progress[0],old=u[0].words[0];M.pass(p,old.w,{day:19999});M.fail(p,old.w,{day:20000});assert.ok(M.studyWords(p,u[0].words,6).every(w=>w.w!==old.w));
});
function webFixture(){
 const store=new Map(),nodes=new Map(),listeners={};let day=20000;
 class TestDate extends Date{static now(){return day*86400000;}}
 const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',dataset:{},style:{setProperty(){}},classList:{toggle(){},remove(){}},focus(){},setAttribute(){},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);};
 const document={hidden:false,documentElement:node('html'),getElementById:node,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(n,fn)=>{(listeners[n]??=[]).push(fn);}};
 const window={addEventListener(){},scrollTo(){},matchMedia:()=>({matches:true})};
 const c=vm.createContext({SOURCE_UNITS:model.units,SENTENCE_AUDIO:model.sentenceAudio,document,window,Date:TestDate,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}});
 vm.runInContext(['memory.js','island.js','island-view.js','app.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n'),c);
 const run=s=>vm.runInContext(s,c);return {run,nodes,store,setDay:d=>{day=d;}};
}
test('web reminder updates on due day; cross-unit answer writes to the originating unit and leaves the adventure intact',()=>{
 const {run,nodes,setDay}=webFixture();
 run("startRound();home();Memory.pass(state.progress[9],SOURCE_UNITS[9].words[0].w,{day:20000});save();");
 const before=run('JSON.stringify(state.dailyByUnit[0])');
 setDay(20001);run('refreshIslandReminder()');assert.match(nodes.get('islandNotice').textContent,/1 个待复习/);
 run('openIsland();startIsland()');assert.equal(nodes.get('unitNav').hidden,true);assert.match(nodes.get('app').innerHTML,/还记得怎么拼/);
 run("Island.current(state).draft=Island.current(state).wordKey;islandAction('island-answer');islandAction('island-next');");
 assert.equal(run('state.progress[9].stars'),1);assert.equal(run('state.progress[0].stars'),0);assert.equal(run('JSON.stringify(state.dailyByUnit[0])'),before);assert.equal(run('state.progress[9].memory[SOURCE_UNITS[9].words[0].w].due'),20003);
});
test('web ordinary adventure uses remaining new words without adding due old words',()=>{
 const {run}=webFixture();run('state.dailyWordCount=6;for(const w of SOURCE_UNITS[0].words.slice(0,7))Memory.pass(state.progress[0],w.w,{day:19999});startRound();');
 assert.equal(run('round.questions.length'),10);assert.equal(run('round.wordCount'),2);assert.ok(run('round.questions.filter(q=>q.word).every(q=>SOURCE_UNITS[0].words.slice(7).includes(q.word))'));
});
