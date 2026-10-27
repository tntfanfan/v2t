const Memory=require('./memory');
const catalog=require('./catalog');
const Island=require('./island');
const DEFAULT_WORD_COUNT=2, MAX_WORD_COUNT=6;
const validWordCount=n=>Number.isInteger(n)&&n>=1&&n<=MAX_WORD_COUNT;
const roundWordCount=r=>r?.version===2?r.wordCount:DEFAULT_WORD_COUNT;
const KEY='english-garden-adventure-u0-u9-v1';
const LEVELS=[{type:'listen',name:'听一听',icon:'🎧'},{type:'letter',name:'补一补',icon:'🔧'},{type:'hide',name:'躲猫猫',icon:'🙈'},{type:'recall',name:'自己拼',icon:'⌨️'},{type:'sentence',name:'句子挑战',icon:'💬'}];
const TARGETS={'get up':'get','get dressed':'dressed','have breakfast':'breakfast','brush your teeth':'teeth','go to school':'school','have lunch':'lunch','play in the park':'park','have dinner':'dinner','go to bed':'bed','swimming pool':'swimming','bus stop':'stop','train station':'station','table tennis':'tennis','visit my cousins':'cousins','go hiking':'hiking','keep a scrapbook':'scrapbook','help in the garden':'garden','build a tree house':'house','read a comic':'comic','learn to swim':'swim','go camping':'camping','take riding lessons':'riding'};
const clone=v=>JSON.parse(JSON.stringify(v));
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const fresh=()=>({rounds:0,stars:0,seen:[],grammar:0,independent:0,assisted:0,memory:{},studyTurn:0,studyClock:0});
function initial(){return {unit:0,effects:true,dailyWordCount:DEFAULT_WORD_COUNT,island:null,resetId:'',progress:catalog.map(u=>({...fresh(),memory:Memory.hydrate({},u.words)})),dailyByUnit:catalog.map(()=>null)};}
function read(api){
 const state=initial();let ok=true;
 try{const raw=api.getStorageSync(KEY);if(raw&&typeof raw==='object'){
  state.unit=Number.isInteger(raw.unit)&&catalog[raw.unit]?raw.unit:0;state.effects=raw.effects!==false;state.island=Island.hydrate(raw.island,catalog);state.dailyWordCount=validWordCount(raw.dailyWordCount)?raw.dailyWordCount:DEFAULT_WORD_COUNT;state.resetId=typeof raw.resetId==='string'?raw.resetId:'';
  state.progress=state.progress.map((p,i)=>{const r=raw.progress&&raw.progress[i];if(!r||typeof r!=='object')return p;for(const k of ['rounds','stars','grammar','independent','assisted','studyTurn','studyClock'])p[k]=Number.isSafeInteger(r[k])&&r[k]>=0?r[k]:0;p.memory=Memory.hydrate(r.memory,catalog[i].words);p.studyClock=Math.max(p.studyClock,...Object.values(p.memory).map(v=>v.order));p.seen=Array.isArray(r.seen)?r.seen.filter(w=>catalog[i].words.some(v=>v.w===w)):[];return p;});
  state.dailyByUnit=catalog.map((_,i)=>validRound(raw.dailyByUnit&&raw.dailyByUnit[i],i)?raw.dailyByUnit[i]:null);
 }}catch{ok=false;}return {state,ok};
}
function validRound(r,unit){
 const n=roundWordCount(r),total=5*n;
 if(!validWordCount(n))return false;
 if(!r||![1,2].includes(r.version)||r.unit!==unit||!Number.isInteger(r.day)||!Number.isInteger(r.index)||r.index<0||r.index>total||typeof r.committed!=='boolean'||r.committed!==(r.index===total)||!Array.isArray(r.questions)||r.questions.length!==total)return false;
 return r.questions.every((q,i)=>q&&q.type===LEVELS[Math.floor(i/n)].type&&typeof q.solved==='boolean'&&Array.isArray(q.wrong)&&(i>=r.index||q.solved)&&(q.type==='sentence'?Number.isInteger(q.sentenceIndex)&&q.sentenceIndex>=0:catalog[unit].words.some(w=>w.w===q.wordKey))&&(!['listen','letter','sentence'].includes(q.type)||Array.isArray(q.options)&&q.options.includes(q.answer))&&(q.type!=='hide'||typeof q.target==='string'&&Array.isArray(q.keys)&&Array.isArray(q.picked)&&q.picked.every(n=>Number.isInteger(n)&&n>=0&&n<q.keys.length))&&(q.type!=='recall'||typeof q.draft==='string'));
}
class Engine{
 constructor(api,unit){this.api=api;this.unit=unit;const result=read(api);this.state=result.state;this.storageOK=result.ok;this.state.unit=unit.id;this.round=this.state.dailyByUnit[unit.id];if(this.round&&this.round.questions.some(q=>q.type==='sentence'&&!unit.sentences[q.sentenceIndex]))this.round=this.state.dailyByUnit[unit.id]=null;}
 get progress(){return this.state.progress[this.unit.id];}
 save(){try{const latest=this.api.getStorageSync(KEY);if(latest&&typeof latest.resetId==='string'&&latest.resetId!==this.state.resetId){const current=read(this.api);this.state=current.state;this.round=this.state.dailyByUnit[this.unit.id];return false;}this.api.setStorageSync(KEY,clone(this.state));this.storageOK=true;return true;}catch{this.storageOK=false;return false;}}
 todayRound(){return this.round&&(!this.round.committed||this.round.day===Memory.today())?this.round:null;}
 start(){
  if(this.todayRound())return this.round;
  const all=this.unit.words,p=this.progress,pending=all.filter(w=>{const r=Memory.entry(p,w.w);return r.passes===0&&!r.learned;});
  if(!pending.length)return null;
  const n=Math.min(this.state.dailyWordCount,pending.length),pair=Memory.studyWords(p,all,n);
  const listening=word=>({type:'listen',wordKey:word.w,answer:word.w,options:shuffle([word,...shuffle(all.filter(w=>w.w!==word.w)).slice(0,2)]).map(w=>w.w)});
  const letter=word=>{const target=TARGETS[word.w]||word.w.split(' ').reduce((a,b)=>b.length>a.length?b:a,''),offset=word.w.lastIndexOf(target),index=offset+(target.length>3?Math.floor(target.length/2):Math.min(1,target.length-1)),answer=word.w[index];return {type:'letter',wordKey:word.w,index,answer,options:shuffle([answer,...shuffle([...'abcdefghijklmnopqrstuvwxyz'].filter(c=>c!==answer)).slice(0,2)])};};
  const hide=word=>{const target=TARGETS[word.w]||word.w.split(' ').reduce((a,b)=>b.length>a.length?b:a,'');return {type:'hide',wordKey:word.w,target,offset:word.w.lastIndexOf(target),keys:shuffle([...target,...shuffle([...'abcdefghijklmnopqrstuvwxyz'].filter(c=>!target.includes(c))).slice(0,3)]),picked:[],phase:'look'};};
  const recall=word=>{const r=Memory.entry(p,word.w);return {type:'recall',wordKey:word.w,draft:'',reveal:false,memoryRecorded:false,failureRecorded:false,mode:'study'};};
  const qs=[...pair.map(listening),...pair.map(letter),...pair.map(hide),...pair.map(recall)];
  pair.forEach((word,i)=>{const bank=this.unit.sentences;let index=bank.findIndex(q=>q.wordKey===word.w);if(index<0)index=(p.grammar+i)%bank.length;const q=bank[index];qs.push({type:'sentence',sentenceIndex:index,answer:q.a,options:shuffle(q.options)});});
  this.round={version:2,wordCount:n,unit:this.unit.id,day:Memory.today(),index:0,committed:false,questions:qs.map(q=>({...q,solved:false,helped:false,wrong:[],hint:false,notice:''}))};
  this.state.dailyByUnit[this.unit.id]=this.round;this.save();return this.round;
 }
 current(){return this.round&&this.round.questions[this.round.index];}
 word(q=this.current()){return q&&this.unit.words.find(w=>w.w===q.wordKey);}
 sentence(q=this.current()){return q&&this.unit.sentences[q.sentenceIndex];}
 answer(value){const q=this.current();if(!q||q.solved||!q.options||!q.options.includes(value)||q.wrong.includes(value))return false;if(value!==q.answer){q.wrong.push(value);q.helped=true;q.notice='没关系，再找找！';}else q.solved=true;this.save();return q.solved;}
 hide(action,index){const q=this.current();if(!q||q.type!=='hide'||q.solved)return;
  if(action==='hide'){q.phase='find';q.hint=false;}else if(action==='peek'){q.phase='look';q.helped=true;}else if(action==='undo'){q.picked.pop();q.hint=false;}else if(action==='key'&&q.phase==='find'&&Number.isInteger(index)&&q.keys[index]&&!q.picked.includes(index)){
   if(q.keys[index]!==q.target[q.picked.length]){q.helped=true;q.notice='还不是这个字母，再试试！';}else{q.picked.push(index);q.notice='';q.hint=false;if(q.picked.length===q.target.length){q.solved=true;q.phase='done';}}
  }this.save();
 }
 draft(value){const q=this.current();if(q&&q.type==='recall'&&!q.solved){q.draft=String(value).slice(0,60);this.save();}}
 recall(){const q=this.current();if(!q||q.type!=='recall'||q.solved)return false;const w=this.word(q);
  if(!Memory.normalize(q.draft)){q.notice='先拼一拼，再点“拼好了”。';}
  else if(![w.w,...(w.aliases||[])].some(a=>Memory.normalize(a)===Memory.normalize(q.draft))){q.helped=true;q.reveal=true;q.notice='差一点，看一看再试试。';if(!q.failureRecorded){Memory.fail(this.progress,w.w);q.failureRecorded=true;}}
  else{q.solved=true;q.reveal=false;q.notice='拼对啦，过关！';q.memoryResult=Memory.pass(this.progress,w.w,{mode:q.mode,primed:q.helped});q.memoryRecorded=true;}this.save();return q.solved;
 }
 hint(){const q=this.current();if(!q||q.solved)return;q.hint=true;q.helped=true;if(q.type==='recall')q.reveal=true;this.save();}
 next(){const q=this.current();if(!q||!q.solved||this.round.committed)return false;this.round.index++;if(this.round.index===this.round.questions.length){this.round.committed=true;const p=this.progress;p.rounds++;p.stars+=this.round.questions.length;p.grammar+=roundWordCount(this.round);for(const item of this.round.questions){if(item.wordKey&&!p.seen.includes(item.wordKey))p.seen.push(item.wordKey);if(item.helped)p.assisted++;else p.independent++;}for(const w of this.unit.words.filter(w=>this.round.questions.some(q=>q.wordKey===w.w)))Memory.shown(p,w.w);}this.save();return true;}
 continue(){if(!this.round||!this.round.committed)return;this.round=null;this.state.dailyByUnit[this.unit.id]=null;this.start();}
 restart(){if(!this.round||!this.round.committed)return;this.round.index=0;this.round.day=Memory.today();this.round.committed=false;for(const q of this.round.questions){Object.assign(q,{solved:false,helped:false,wrong:[],hint:false,notice:''});if(q.type==='hide')Object.assign(q,{picked:[],phase:'look'});if(q.type==='recall'){const r=Memory.entry(this.progress,q.wordKey);Object.assign(q,{draft:'',reveal:false,memoryResult:null,memoryRecorded:false,failureRecorded:false,mode:'study'});}}this.save();}
 shown(word){Memory.shown(this.progress,word);this.save();}
 reset(){const next=initial();next.unit=this.unit.id;next.effects=this.state.effects;next.dailyWordCount=this.state.dailyWordCount;next.resetId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);try{this.api.setStorageSync(KEY,next);this.state=next;this.round=null;this.storageOK=true;return true;}catch{this.storageOK=false;return false;}}
 setDailyWordCount(n){if(!validWordCount(n))return false;const previous=this.state.dailyWordCount;this.state.dailyWordCount=n;if(this.save())return true;this.state.dailyWordCount=previous;return false;}
 summary(){return Memory.summary(this.progress,this.unit.words);}
}
module.exports={Engine,Memory,catalog,KEY,LEVELS,read,validRound,roundWordCount,MAX_WORD_COUNT,Island};
