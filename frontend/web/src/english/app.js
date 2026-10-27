function makeSentences(sourceUnits) {
const SENTENCES = [
  [
    { q:'There ___ a door.', a:'is', options:['is','are'], cn:'这里有一扇门。', visual:'🚪', hint:'a door 是一扇门，一个用 is。', full:'There is a door.' },
    { q:'There ___ some chairs.', a:'are', options:['is','are'], cn:'这里有几把椅子。', visual:'🪑 🪑 🪑', hint:'some chairs 是几把椅子，几个用 are。', full:'There are some chairs.' },
    { q:'There is a ___ on the wall.', a:'clock', options:['clock','floor'], cn:'墙上有一个钟。', visual:'🕒', hint:'钟是 clock。', full:'There is a clock on the wall.' },
    { q:'There are some ___.', a:'windows', options:['window','windows'], cn:'这里有几扇窗户。', visual:'🪟 🪟', hint:'不止一扇窗，window 后面加 s。', full:'There are some windows.' },
    { q:'There ___ a bookcase.', a:'is', options:['is','are'], cn:'这里有一个书柜。', visual:'📚', hint:'一个书柜，用 is。', full:'There is a bookcase.' },
    { q:'There ___ some books.', a:'are', options:['is','are'], cn:'这里有一些书。', visual:'📚 📚', hint:'some books 是一些书，用 are。', full:'There are some books.' }
  ],
  [
    { q:'He ___ up at seven.', a:'gets', options:['get','gets'], cn:'他七点起床。', visual:'🛏️ ☀️', hint:'说“他”做什么，get 要变成 gets。', full:'He gets up at seven.' },
    { q:'I ___ to school at eight.', a:'go', options:['go','goes'], cn:'我八点去上学。', visual:'🎒 🏫', hint:'主语是 I，用 go。', full:'I go to school at eight.' },
    { q:'She ___ breakfast at seven.', a:'has', options:['have','has'], cn:'她七点吃早饭。', visual:'🥣 ☀️', hint:'She 后面，have 变成 has。', full:'She has breakfast at seven.' },
    { q:"What’s the time? ___ nine o’clock.", a:"It’s", options:["It’s",'At'], cn:'几点了？九点。', visual:'🕘', hint:'回答“现在几点”，用 It’s…', full:"What's the time? It's nine o'clock." },
    { q:"When do you go to bed? ___ nine o’clock.", a:'At', options:['At',"It’s"], cn:'你几点睡觉？九点。', visual:'🛏️ 🌙', hint:'回答“在几点做这件事”，用 At…', full:"When do you go to bed? At nine o'clock." },
    { q:'He ___ his teeth.', a:'brushes', options:['brush','brushes'], cn:'他刷牙。', visual:'🪥 🦷', hint:'He 后面，brush 要变成 brushes。', full:'He brushes his teeth.' },
    { q:'She ___ in the park.', a:'plays', options:['play','plays'], cn:'她在公园玩。', visual:'🪁 🌳', hint:'She 后面，play 要变成 plays。', full:'She plays in the park.' }
  ],
  [
    { q:'He ___ bananas.', a:'likes', options:['like','likes'], cn:'小猴子说：他喜欢香蕉。', visual:'🐵 ❤️ 🍌', hint:'主语是 he，喜欢用 likes。', full:'He likes bananas.' },
    { q:'She ___ like apples.', a:"doesn’t", options:["don’t","doesn’t"], cn:'故事里的小熊说：她不喜欢苹果。', visual:'🐻 🙅 🍎', hint:'She 后面的“不喜欢”是 doesn’t like。', full:"She doesn't like apples." },
    { q:'___ you like zebras?', a:'Do', options:['Do','Does'], cn:'你喜欢斑马吗？', visual:'🦓 💬', hint:'问 you，用 Do。', full:'Do you like zebras?' },
    { q:'___ he like monkeys?', a:'Does', options:['Do','Does'], cn:'他喜欢猴子吗？', visual:'🐵 💬', hint:'问 he，用 Does。', full:'Does he like monkeys?' },
    { q:'Does he ___ tigers?', a:'like', options:['like','likes'], cn:'他喜欢老虎吗？', visual:'🐯 💬', hint:'前面已经有 Does，后面的 like 不加 s。', full:'Does he like tigers?' },
    { q:'Does he like bananas?', a:'Yes, he does.', options:['Yes, he does.',"No, he doesn’t."], cn:'看图回答：他喜欢香蕉。', visual:'🧒 ❤️ 🍌', hint:'图里的他喜欢香蕉，用 Yes, he does.', full:'Does he like bananas? Yes, he does.', reply:true },
    { q:'Does she like apples?', a:"No, she doesn’t.", options:['Yes, she does.',"No, she doesn’t."], cn:'看图回答：她不喜欢苹果。', visual:'👧 🙅 🍎', hint:'图里的她不喜欢苹果，用 No, she doesn’t.', full:"Does she like apples? No, she doesn't.", reply:true },
    { q:'I ___ like snakes.', a:"don’t", options:["don’t","doesn’t"], cn:'我不喜欢蛇。', visual:'🧒 🙅 🐍', hint:'I 后面用 don’t like。', full:"I don't like snakes." }
  ]
];
// Extra units use simple sentences built from their own vocabulary.
for(let unit=3;unit<sourceUnits.length;unit++){
  const words=sourceUnits[unit].words;
  SENTENCES[unit]=words.map((word,i)=>{
    const article=/^[aeiou]/.test(word.w)?'an':'a';
    const lead=unit===3||unit===5?`This is ${article} `:unit===4||unit===8?'I like ':unit===6?(['eyes','ears','cheeks','glasses'].includes(word.w)?'These are my ':'This is my '):unit===7?`I can see ${article} `:"Let's ";
    return {q:lead+'___.',a:word.w,options:[word.w,words[(i+1)%words.length].w],cn:'看图选词：'+word.cn+'。',wordKey:word.w,visual:'',hint:word.w+' · '+word.cn,full:lead+word.w+'.'};
  });
}
// Use the ordinary English apostrophe in learning text and answer buttons.
for (const bank of SENTENCES) for (const q of bank) {
  for (const key of ['q','a','full','hint']) q[key]=q[key].replace(/’/g,"'");
  q.options=q.options.map(s=>s.replace(/’/g,"'"));
}
return SENTENCES;
}

// A correct spelling clears a word immediately; review dates remain independent.


'use strict';
const META = [
  { title:'教室基地', en:'The classroom', icon:'🚀', badge:'🚀', badgeName:'火箭工程师', mission:'给基地装上能量！', copy:'Bobo 的小飞船准备出发。<br>找到教室里的秘密装备，一起点亮基地。', color:'#377a61', tip:'一个东西用 is，几个东西用 are。' },
  { title:'时光小镇', en:'My day', icon:'⏰', badge:'⏰', badgeName:'时光小队长', mission:'启动神奇的一天！', copy:'起床、上学，再去公园玩。<br>帮 Bobo 找回一天里的快乐时刻。', color:'#9a6533', tip:'I get，he gets；I have，she has。' },
  { title:'动物秘境', en:'The zoo', icon:'🐾', badge:'🦁', badgeName:'动物探险家', mission:'发现丛林好朋友！', copy:'草丛里传来了沙沙声。<br>和 Bobo 一起出发，认识可爱的动物朋友。', color:'#447c69', tip:'He likes；does / doesn’t 后面的 like 不加 s。' }
];
META.push(
  {title:'城镇探险',en:'Places in town',icon:'🏘️',badge:'🗺️',badgeName:'城镇领航员',color:'#507ca1'},
  {title:'美食补给站',en:'Food',icon:'🍉',badge:'🍉',badgeName:'美食发现家',color:'#a26d42'},
  {title:'家居工坊',en:'Furniture',icon:'🛋️',badge:'🛋️',badgeName:'小小设计师',color:'#8a7198'},
  {title:'表情实验室',en:'The face',icon:'👓',badge:'🔎',badgeName:'观察小达人',color:'#43878b'},
  {title:'交通出发港',en:'Transport',icon:'🚁',badge:'🚁',badgeName:'超级驾驶员',color:'#5878a1'},
  {title:'运动能量场',en:'Sports',icon:'🏀',badge:'🏆',badgeName:'运动小健将',color:'#ab7441'},
  {title:'假日冒险岛',en:'Holiday activities',icon:'⛺',badge:'⛺',badgeName:'假日冒险家',color:'#59815e'}
);
const SENTENCES = makeSentences(SOURCE_UNITS);
const LEVELS=[{type:'listen',icon:'🎧',name:'听一听'},{type:'letter',icon:'🔧',name:'补一补'},{type:'hide',icon:'🙈',name:'躲猫猫'},{type:'recall',icon:'⌨️',name:'自己拼'},{type:'sentence',icon:'💬',name:'句子挑战'}];
const DEFAULT_WORD_COUNT=2, MAX_WORD_COUNT=6;
const validWordCount=n=>Number.isInteger(n)&&n>=1&&n<=MAX_WORD_COUNT;
const roundWordCount=r=>r?.version===3?r.wordCount:DEFAULT_WORD_COUNT;
const STORAGE_KEY = 'bobo-adventure-u012-v1';
const app = document.getElementById('app');
const unitNav = document.getElementById('unitNav');
let storageOK = true;
const freshProgress = () => ({ rounds:0, stars:0, seen:[], bag:[], grammar:0, independent:0, assisted:0, memory:{}, studyTurn:0, studyClock:0 });
function readState() {
  const base = { unit:0, effects:true, dailyWordCount:DEFAULT_WORD_COUNT, resetId:'', offlineResetId:'', island:null, dailyByUnit:SOURCE_UNITS.map(()=>null), progress:SOURCE_UNITS.map(freshProgress) };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return base;
    base.resetId=typeof raw.resetId==='string'?raw.resetId:'';
    base.offlineResetId=typeof raw.offlineResetId==='string'?raw.offlineResetId:'';
    base.unit = Number.isInteger(raw.unit) && SOURCE_UNITS[raw.unit] ? raw.unit : 0;
    base.dailyByUnit=base.dailyByUnit.map((_,unit)=>{
      const saved=hydrateDaily(raw.dailyByUnit?.[unit]);
      return saved?.unit===unit?saved:null;
    });
    // Move the old shared round into its own unit without losing any answers.
    const legacy=hydrateDaily(raw.daily);
    if(legacy&&!base.dailyByUnit[legacy.unit])base.dailyByUnit[legacy.unit]=legacy;
    base.island=Island.hydrate(raw.island,SOURCE_UNITS);
    base.effects = raw.effects !== false;
    base.dailyWordCount=validWordCount(raw.dailyWordCount)?raw.dailyWordCount:DEFAULT_WORD_COUNT;
    base.progress = base.progress.map((p,i) => {
      const v = raw.progress?.[i];
      if (!v || typeof v !== 'object') return p;
      for (const key of ['rounds','stars','grammar','independent','assisted','studyTurn','studyClock']) p[key] = Number.isSafeInteger(v[key]) && v[key] >= 0 ? v[key] : 0;
      p.seen = Array.isArray(v.seen) ? [...new Set(v.seen.filter(w => SOURCE_UNITS[i].words.some(x => x.w === w)))] : [];
      p.bag = Array.isArray(v.bag) ? [...new Set(v.bag.filter(n => Number.isInteger(n) && n >= 0 && n < SOURCE_UNITS[i].words.length))] : [];
      p.memory=Memory.hydrate(v.memory,SOURCE_UNITS[i].words);
      p.studyClock=Math.max(p.studyClock,...Object.values(p.memory).map(r=>r.order));
      return p;
    });
  } catch { storageOK = false; }
  return base;
}
const state = readState();
state.progress.forEach((p,i)=>p.memory=Memory.hydrate(p.memory,SOURCE_UNITS[i].words));
let screen = 'home', round = null, roundId = 0, toastTimer, audioVersion = 0, activeAudio = null, audioTimer, audioContext;
let preparedSentence=null, sentencePlayback='idle', progressResetPending=false;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = a => { const b = [...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; };
const currentUnit = () => SOURCE_UNITS[state.unit];
const currentMeta = () => META[state.unit];
const button = (action, label, cls='secondary', extra='') => `<button class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
function packDaily(active) {
  return {version:3,wordCount:roundWordCount(active),day:active.day,unit:active.unit,index:active.index,committed:active.committed,questions:active.questions.map(q=>{
    const {word,data,...fields}=q;
    return {...fields,wordKey:word?.w,sentenceIndex:data?SENTENCES[active.unit].indexOf(data):undefined,options:q.type==='listen'?q.options.map(w=>w.w):q.options};
  })};
}
function hydrateDaily(raw) {
  try {
    if(![1,2,3].includes(raw?.version)||!Number.isInteger(raw.day)||raw.day<0||raw.day>Memory.today()||!Number.isInteger(raw.unit)||!SOURCE_UNITS[raw.unit])return null;
    const n=roundWordCount(raw);
    if(!validWordCount(n))return null;
    const count=raw.version===1?6:LEVELS.length*n;
    if(!Number.isInteger(raw.index)||raw.index<0||raw.index>count||typeof raw.committed!=='boolean'||!Array.isArray(raw.questions)||raw.questions.length!==count||raw.committed!==(raw.index===count))return null;
    if(raw.version===1&&(raw.questions[2].type!=='hide'||raw.questions[5].type!=='sentence'))return null;
    const words=SOURCE_UNITS[raw.unit].words;
    for(const [i,q] of raw.questions.entries()){
      if(!['listen','letter','hide','recall','sentence'].includes(q.type)||typeof q.solved!=='boolean'||!Array.isArray(q.wrong)||i<raw.index&&!q.solved)return null;
      const word=words.find(w=>w.w===q.wordKey);
      if(q.type!=='sentence'&&!word)return null;
      if(q.type==='sentence'&&(!Number.isInteger(q.sentenceIndex)||!SENTENCES[raw.unit][q.sentenceIndex]))return null;
      if(['listen','letter','sentence'].includes(q.type)&&(!Array.isArray(q.options)||!q.options.includes(q.answer)||new Set(q.options).size!==q.options.length))return null;
      if(q.type==='listen'&&q.options.some(w=>!words.some(x=>x.w===w)))return null;
      if(q.type==='hide'&&(!Array.isArray(q.keys)||!Array.isArray(q.picked)||typeof q.target!=='string'||q.picked.some(n=>!Number.isInteger(n)||!q.keys[n])))return null;
      if(q.type==='recall'&&(typeof q.draft!=='string'||!['study','review'].includes(q.mode)))return null;
    }
    if(raw.version>=2){
      const pair=raw.questions.slice(0,n).map(q=>q.wordKey);
      if(new Set(pair).size!==n||raw.questions.some((q,i)=>q.type!==LEVELS[Math.floor(i/n)].type||i<4*n&&q.wordKey!==pair[i%n]))return null;
      if(new Set(raw.questions.slice(4*n).map(q=>q.sentenceIndex)).size!==n)return null;
    }
    return raw;
  } catch { return null; }
}
function restoreDaily(saved) {
  const words=SOURCE_UNITS[saved.unit].words;
  return {...saved,id:++roundId,mode:'daily',questions:saved.questions.map(q=>({...q,wrong:[...q.wrong],word:q.wordKey?words.find(w=>w.w===q.wordKey):undefined,data:q.type==='sentence'?SENTENCES[saved.unit][q.sentenceIndex]:undefined,options:q.type==='listen'?q.options.map(w=>words.find(x=>x.w===w)):q.options?[...q.options]:undefined,keys:q.keys?[...q.keys]:undefined,picked:q.picked?[...q.picked]:undefined}))};
}
function dailyToday() {
  const saved=state.dailyByUnit[state.unit];
  return saved&&(!saved.committed||saved.day===Memory.today())?saved:null;
}
function save() {
  if(round?.mode==='daily')state.dailyByUnit[round.unit]=packDaily(round);
  try {
    // An older open tab must not write its pre-reset progress back on pagehide.
    let saved;try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch{}
    if(saved&&typeof saved.resetId==='string'&&saved.resetId!==state.resetId)return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageOK = true;
    return true;
  } catch { storageOK = false; return false; }
}
function ensureToday() {
  // An unfinished adventure survives midnight; review dates still use the real day.
  if(round&&!round.committed&&round.day!==Memory.today()){round.day=Memory.today();save();}
  return true;
}
function toast(message) { const el=document.getElementById('toast'); el.textContent=message; el.hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.hidden=true,3500); }
function stopAudio() {
  audioVersion++; clearTimeout(audioTimer);
  document.querySelectorAll('audio').forEach(el=>el.pause());
  if (activeAudio) { activeAudio.pause(); activeAudio.onplaying=null; activeAudio.ontimeupdate=null; activeAudio.onended=null; activeAudio.onerror=null; activeAudio=null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
  document.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));
  sentencePlaybackStatus('idle');
}
function voiceFallback(text, slow, token, events={}) {
  if (token !== audioVersion) return;
  if (!window.speechSynthesis) { if(events.onerror)events.onerror();else toast('声音没准备好，再试一次吧。'); return; }
  const u=new SpeechSynthesisUtterance(text.replace(/’/g,"'"));
  u.lang='en-GB'; u.rate=slow?.65:.84;
  const voices=speechSynthesis.getVoices();
  u.voice=voices.find(v=>v.localService&&v.lang==='en-GB') || voices.find(v=>v.localService&&v.lang.startsWith('en')) || voices.find(v=>v.lang==='en-GB') || voices.find(v=>v.lang.startsWith('en')) || null;
  u.lang=u.voice?.lang||'en-GB';
  u.onstart=()=>{if(token===audioVersion)events.onstart?.();};
  u.onend=()=>{if(token===audioVersion)events.onend?.();};
  u.onerror=()=>{if(token===audioVersion){if(events.onerror)events.onerror();else toast('声音没准备好，再试一次吧。');}};
  if(speechSynthesis.paused)speechSynthesis.resume();
  speechSynthesis.speak(u);
}
async function playWord(word, slow=false, unitIndex=state.unit) {
  stopAudio(); const token=audioVersion; const unit=SOURCE_UNITS[unitIndex];
  const src=unit.audio[word] || unit.track;
  if (!src) return voiceFallback(word,slow,token);
  const audio=new Audio(src); activeAudio=audio; audio.preload='auto'; audio.playbackRate=slow?.78:1;
  const playButton=document.querySelector('[data-action="listen"],[data-action="island-listen"]');
  const clearPlaying=()=>{if(token===audioVersion)playButton?.classList.remove('playing');};
  const fallback=()=>{if(token!==audioVersion)return;audio.pause();clearTimeout(audioTimer);clearPlaying();voiceFallback(word,slow,token);};
  audio.onerror=fallback;
  try {
    if (unit.segments) {
      await new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>reject(new Error('metadata timeout')),6000);
        audio.addEventListener('loadedmetadata',()=>{clearTimeout(timeout);resolve();},{once:true});
        audio.addEventListener('error',()=>{clearTimeout(timeout);reject(new Error('audio unavailable'));},{once:true});
        audio.load();
      });
      if(token!==audioVersion)return;
      const [start,end]=unit.segments[word]; audio.currentTime=start;
      const finish=()=>{if(token!==audioVersion)return;audio.pause();clearTimeout(audioTimer);clearPlaying();};
      audio.ontimeupdate=()=>{if(audio.currentTime>=end)finish();};
      audio.onplaying=()=>{if(token!==audioVersion){audio.pause();return;}playButton?.classList.add('playing');clearTimeout(audioTimer);audioTimer=setTimeout(finish,Math.max(0,(end-audio.currentTime)/audio.playbackRate)*1000);};
    } else {
      audio.onplaying=()=>{if(token!==audioVersion){audio.pause();return;}playButton?.classList.add('playing');};
    }
    audio.onended=clearPlaying;
    if(token!==audioVersion)return;
    await audio.play();
    if(token!==audioVersion)audio.pause();
  } catch { fallback(); }
}
function sentencePlaybackStatus(status,label) {
  sentencePlayback=status;
  const button=document.querySelector('[data-action="read-sentence"]');
  if(!button)return;
  button.textContent=label||({idle:'听听完整句子',loading:'准备声音…',playing:'正在朗读 · 点击暂停'})[status];
  button.setAttribute('aria-pressed',String(status!=='idle'));
  button.classList.toggle('playing',status==='playing');
}
function prepareSentence(text) {
  if(typeof Audio==='undefined'||typeof SENTENCE_AUDIO==='undefined'||!SENTENCE_AUDIO[text])return null;
  if(preparedSentence?.text===text)return preparedSentence.audio;
  const audio=new Audio(SENTENCE_AUDIO[text]);
  audio.preload='auto';audio.load();
  preparedSentence={text,audio};
  return audio;
}
function say(text) {
  // A second tap stops the current reading instead of adding another one to a queue.
  if(sentencePlayback!=='idle'){stopAudio();return;}
  stopAudio();const token=audioVersion;
  sentencePlaybackStatus('loading');
  const started=()=>{if(token===audioVersion){clearTimeout(audioTimer);sentencePlaybackStatus('playing');}};
  const finished=()=>{if(token===audioVersion){clearTimeout(audioTimer);activeAudio=null;sentencePlaybackStatus('idle','再听一遍');}};
  const failed=()=>{if(token===audioVersion){stopAudio();sentencePlaybackStatus('idle','点我重试');toast('声音没准备好，再试一次吧。');}};
  const audio=prepareSentence(text);let fallbackUsed=false;
  const fallback=()=>{
    if(token!==audioVersion||fallbackUsed)return;
    fallbackUsed=true;clearTimeout(audioTimer);
    if(audio){audio.onplaying=null;audio.onended=null;audio.onerror=null;audio.pause();}
    activeAudio=null;
    audioTimer=setTimeout(failed,5000);
    voiceFallback(text,false,token,{onstart:started,onend:finished,onerror:failed});
  };
  if(!audio){fallback();return;}
  activeAudio=audio;audio.currentTime=0;
  audio.onplaying=()=>{if(token!==audioVersion){audio.pause();return;}started();};
  audio.onended=finished;audio.onerror=fallback;
  audioTimer=setTimeout(fallback,2000);
  try { audio.play()?.catch(fallback); } catch { fallback(); }
}
function chime() {
  if(!state.effects)return;
  try {
    audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
    audioContext.resume();
    [523.25,659.25,783.99].forEach((frequency,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime+i*.09;o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+.23);});
  } catch {}
}
function picture(word, label='', unit=currentUnit()) {
  const source=word.art;
  const art=typeof source==='object'?`<svg viewBox="${source.rect.join(' ')}" aria-hidden="true"><image href="${esc(unit.sheets[source.sheet])}" width="${source.size[0]}" height="${source.size[1]}"/></svg>`:source.startsWith('<svg')?source.replace('<svg ',`<svg aria-hidden="true" `):`<img src="${esc(source)}" alt="${esc(label)}" draggable="false" decoding="async">`;
  return `<span class="picture" ${label?`role="img" aria-label="${esc(label)}"`:'aria-hidden="true"'}>${art}</span>`;
}
function robot(extra='') {
  return `<svg viewBox="0 0 150 180" ${extra} aria-hidden="true"><ellipse cx="75" cy="166" rx="49" ry="8" fill="#688d6820"/><path d="M52 132v24m46-24v24" stroke="#396259" stroke-width="16" stroke-linecap="round"/><path d="M48 158h-10m61 0h12" stroke="#263e40" stroke-width="14" stroke-linecap="round"/><path d="M31 105l-16 18m103-22l18-20" stroke="#6b9983" stroke-width="13" stroke-linecap="round"/><circle cx="137" cy="79" r="10" fill="#f4be53"/><rect x="34" y="87" width="84" height="55" rx="19" fill="#5c9479" stroke="#365f4d" stroke-width="3"/><rect x="51" y="99" width="50" height="25" rx="9" fill="#d8edc9"/><path d="m76 103-7 11h9l-6 10 15-14h-11l5-7" fill="#6e9b69"/><path d="M76 25V13" stroke="#3c6556" stroke-width="5"/><circle cx="76" cy="9" r="7" fill="#efb851"/><rect x="15" y="42" width="120" height="53" rx="23" fill="#c7d9b8" stroke="#416a53" stroke-width="3"/><rect x="26" y="36" width="101" height="59" rx="22" fill="#faf8de" stroke="#416a53" stroke-width="3"/><rect x="39" y="49" width="76" height="32" rx="13" fill="#2c4c43"/><circle cx="59" cy="62" r="6" fill="#d5edac"/><circle cx="96" cy="62" r="6" fill="#d5edac"/><path d="M70 71q8 6 15 0" fill="none" stroke="#d5edac" stroke-width="3" stroke-linecap="round"/></svg>`;
}
function scene(unit) {
  if(unit>2)return `<svg viewBox="0 0 470 340" role="img" aria-label="${esc(META[unit].title)}探险基地"><path class="flight-path" d="M41 77q80-93 145-19t170-16m48 65q92 26 17 97"/><circle cx="375" cy="75" r="32" fill="#f1d27d"/><ellipse cx="249" cy="286" rx="177" ry="22" fill="#acc09a" opacity=".25"/><path d="M80 241q23-59 174-56t158 63q-7 36-165 39T80 241" fill="#a6bb82"/><path d="M85 248q58 44 315 5l-35 41q-137 41-237-3z" fill="#c7bd8a"/><rect x="222" y="107" width="149" height="137" rx="23" fill="#fffae5" stroke="#8da66e" stroke-width="3"/><path d="M207 115l87-57 91 57Z" fill="${META[unit].color}"/><text x="297" y="182" text-anchor="middle" font-size="58">${META[unit].icon}</text><text x="297" y="221" text-anchor="middle" font-size="17" fill="#507148" font-weight="bold">UNIT ${unit}</text><g class="float"><g transform="translate(80 95) scale(.9)">${robot().replace(/<svg[^>]*>|<\/svg>/g,'')}</g></g><path d="M394 234v-36m0 0-13 9m13-4 12-12" stroke="#6d9466" stroke-width="5" stroke-linecap="round"/><path d="m155 285 2 13m44-5-1 11m92-9 2 9" stroke="#a89a68" stroke-width="5" stroke-linecap="round"/></svg>`;
  const building=unit===0?`<rect x="219" y="124" width="139" height="125" rx="9" fill="#f3e5bc" stroke="#8c9f71" stroke-width="2"/><path d="m203 127 86-60 85 60z" fill="#6f9574" stroke="#4f795e" stroke-width="2"/><rect x="271" y="172" width="35" height="77" rx="16" fill="#839e73"/><circle cx="297" cy="215" r="3" fill="#e7d797"/><rect x="236" y="151" width="25" height="29" rx="4" fill="#b5d9cc" stroke="#8c9f71" stroke-width="2"/><path d="M249 151v29m-13-14h25" stroke="#fbf5de" stroke-width="3"/><rect x="320" y="150" width="25" height="29" rx="4" fill="#b5d9cc" stroke="#8c9f71" stroke-width="2"/><path d="M333 150v29m-13-14h25" stroke="#fbf5de" stroke-width="3"/><circle cx="289" cy="117" r="17" fill="#f9efd3" stroke="#cad0a8" stroke-width="3"/><path d="M289 107v11l8 4" stroke="#5a7761" stroke-width="3" fill="none"/>`:unit===1?`<rect x="231" y="104" width="100" height="145" rx="11" fill="#e6c78a" stroke="#aa9462" stroke-width="2"/><path d="m217 107 64-49 65 49z" fill="#ba8259"/><circle cx="281" cy="146" r="33" fill="#fff6da" stroke="#ad9965" stroke-width="5"/><path d="M281 124v23l17 12" stroke="#6a7758" stroke-width="5" stroke-linecap="round"/><rect x="264" y="201" width="33" height="48" rx="16" fill="#7f9b7a"/><path d="M210 215h-26v30m162-30h24v30" stroke="#b9a46d" stroke-width="7"/><circle cx="368" cy="66" r="25" fill="#f2cf70"/>`:`<path d="M240 219v-93m75 97v-102" stroke="#8d9570" stroke-width="13"/><circle cx="244" cy="115" r="47" fill="#719a6f"/><circle cx="307" cy="103" r="51" fill="#8ba96e"/><circle cx="278" cy="72" r="40" fill="#a9bb7c"/><ellipse cx="290" cy="252" rx="71" ry="17" fill="#8fc3b6"/><path d="M218 211q-14-39-43-26l-10 38" fill="#dfb765"/><circle cx="190" cy="181" r="28" fill="#b5844d"/><circle cx="190" cy="183" r="20" fill="#f0ce83"/><circle cx="183" cy="180" r="3" fill="#3e5746"/><circle cx="198" cy="180" r="3" fill="#3e5746"/><path d="m186 190 5 4 5-4" fill="#7f6643"/><path d="m359 184 16-16-2 23 19 3-24 16z" fill="#de9e62"/><circle cx="373" cy="183" r="3" fill="#3e5746"/>`;
  return `<svg viewBox="0 0 470 340" role="img" aria-label="Bobo 小机器人正在${META[unit].title}等你"><path class="flight-path" d="M41 77q80-93 145-19t170-16m48 65q92 26 17 97"/><circle cx="58" cy="77" r="5" fill="#f4ca70"/><path d="m385 40 3 7 8 2-7 4-1 8-5-6-8 1 4-7-3-7z" fill="#f4ca70"/><path d="m109 43 2 5 6 2-5 3-1 6-4-5-6 1 3-5-2-5z" fill="#9ab584"/><ellipse cx="249" cy="286" rx="177" ry="22" fill="#acc09a" opacity=".25"/><path d="M80 241q23-59 174-56t158 63q-7 36-165 39T80 241" fill="#a6bb82"/><path d="M85 248q58 44 315 5l-35 41q-137 41-237-3z" fill="#c7bd8a"/><path d="M89 242q95 48 314 6" stroke="#8da66e" stroke-width="3" fill="none"/><path d="M125 239q85-12 149 12t90-11" stroke="#e7d8ab" stroke-width="17" fill="none"/>${building}<path d="M370 236v-37" stroke="#8f9670" stroke-width="7"/><circle cx="370" cy="184" r="23" fill="#a2b96e"/><circle cx="385" cy="199" r="18" fill="#86a966"/><circle cx="354" cy="200" r="18" fill="#8fae6a"/><g class="float"><g transform="translate(79 95) scale(.9)">${robot().replace(/<svg[^>]*>|<\/svg>/g,'')}</g></g><path d="M329 284v-23" stroke="#8c9a6b" stroke-width="4"/><path d="M329 264q-17-17-19-1 5 7 19 1m0 0q17-19 19-4-3 8-19 4" fill="#6c9967"/><path d="m155 285 2 13m44-5-1 11m92-9 2 9" stroke="#a89a68" stroke-width="5" stroke-linecap="round"/><g transform="translate(27 171) rotate(-13)"><rect width="40" height="31" rx="7" fill="#fff6da" stroke="#bfceaa" stroke-width="2"/><text x="20" y="21" text-anchor="middle" font-size="17" font-weight="bold" fill="#6b8a5f">Aa</text></g><path d="m419 242 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#edc36a"/></svg>`;
}
function renderNav() {
  unitNav.hidden=screen.startsWith('island');
  const reminder=Island.summary(state,SOURCE_UNITS),entry=document.getElementById('islandNotice');
  if(entry){entry.textContent=reminder.due?'🏝️ 回忆岛 · '+reminder.due+' 个待复习':'🏝️ 回忆岛';entry.classList.toggle('has-due',reminder.due>0);}
  document.documentElement.style.setProperty('--unit',currentMeta().color);
  unitNav.innerHTML=META.map((u,i)=>`<button data-action="unit" data-value="${i}" class="unit-tab ${i===state.unit?'active':''}" aria-pressed="${i===state.unit}"><span class="tab-icon" aria-hidden="true">${u.icon}</span><span><b class="unit-code">U${i}</b><span class="unit-name">${u.title}</span><small>${u.en}</small></span></button>`).join('');
  document.getElementById('starCount').textContent='★ '+state.progress.reduce((sum,p)=>sum+p.stars,0);
  const sound=document.getElementById('soundBtn'); sound.classList.toggle('off',!state.effects);sound.textContent=state.effects?'♫':'♪';sound.setAttribute('aria-label',state.effects?'关闭闯关音效':'打开闯关音效');sound.setAttribute('aria-pressed',String(state.effects));
}
function mount(html, focus=true) { app.innerHTML=html; renderNav(); if(focus){app.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});} }
function home(focus=true) {
  stopAudio();save();screen='home';round=null;const u=currentMeta(),p=state.progress[state.unit];
  const s=Memory.summary(p,currentUnit().words),earned=s.passed===s.total,daily=dailyToday(),done=!!daily?.committed,newCount=currentUnit().words.filter(w=>{const r=Memory.entry(p,w.w);return !r.passes&&!r.learned;}).length;
  const currentDaily=daily?.version>=2?daily:null,legacyDone=done&&daily.version===1,n=currentDaily?roundWordCount(currentDaily):Math.min(state.dailyWordCount,newCount||state.dailyWordCount);
  const completed=LEVELS.filter((_,i)=>currentDaily?.questions.slice(i*n,i*n+n).every(q=>q.solved)).length;
  const title=!newCount&&!daily?'新词学完啦，去回忆岛！':done?'这一轮，完成啦！':daily?'接着这轮小冒险！':'每轮 5 关，闯关摘星星！';
  const cta=!newCount&&!daily?'去回忆岛 →':done?'继续冒险 →':daily?currentDaily?`继续第 ${Math.floor(daily.index/n)+1} 关 →`:'继续冒险 →':'开始冒险';
  mount(`<section class="home-heading"><div><h1>小队长，一起冒险吧！</h1><p>选个单元，出发吧！</p></div><span class="home-label">LEARN · RECALL · REMEMBER</span></section>
    <section class="hero adventure-hub"><div class="hero-info"><span class="mission-label">U${state.unit} · ${u.title}</span><h2>${title}</h2><div class="hero-actions">${button(!newCount&&!daily?'island':done?'continue':'start',cta,'primary')}${done?button('restart','重新冒险','secondary')+button('book','单词星图','text-btn'):''}</div><span class="hero-companion" aria-hidden="true">${robot()}</span></div><section class="round-card hero-route"><div class="section-label"><h3>${legacyDone?'下一轮冒险':'本轮冒险'} · 5 关</h3><span>每关 ${n} 题${legacyDone?'':` · ${completed} / 5 关完成`}</span></div><div class="route daily-route">${LEVELS.map((level,i)=>{const solved=currentDaily?currentDaily.questions.slice(i*n,i*n+n).filter(q=>q.solved).length:0;return `<div class="route-stop"><span class="route-icon" aria-hidden="true">${solved===n?'✓':level.icon}</span>${i+1}. ${level.name}<small class="route-count">${legacyDone?`${n} 题`:`${solved} / ${n} 题`}</small></div>`;}).join('')}</div></section></section>
    ${islandEntryMarkup()}<section class="memory-summary"><div><strong>本单元过关进度</strong></div><div class="memory-meter" role="progressbar" aria-label="已过关单词数量" aria-valuemin="0" aria-valuemax="${s.total}" aria-valuenow="${s.passed}">${currentUnit().words.map(w=>`<span class="${Memory.status(Memory.entry(p,w.w)).passed?'lit':''}" title="${esc(w.cn)}">★</span>`).join('')}<b>${s.passed} / ${s.total}</b></div><div class="memory-counts"><div><strong><b>${s.passed}</b> 个词</strong><span>已过关</span></div><div class="pending"><strong><b>${s.total-s.passed}</b> 个词</strong><span>未过关</span></div></div></section>
    <div class="home-bottom"><section class="collection-card"><div class="section-label"><h3>单词记忆徽章</h3>${button('collection','看看收藏 →','text-btn')}</div><div class="collection-row"><span class="badge-small ${earned?'earned':''}" aria-hidden="true">${earned?u.badge:'✦'}</span><div class="collection-copy"><p>${earned?u.badgeName:'把整单元的星星点亮'}</p><small>${earned?'本单元星星全亮啦':`已点亮 ${s.passed} / ${s.total} 颗星`}</small></div></div></section></div>
    <div class="home-tools"><div class="book-tools">${button('book',`▤ 单词星图 · ${s.total} 个`,'wordbook-btn')}${button('recordings','♫ 听读小屋','wordbook-btn')}</div><span class="daily-note">每轮 ${n} 个词 · 5 关 × ${n} 题</span></div>`,focus);
}
function drawWords(n) {
  const p=state.progress[state.unit], all=currentUnit().words.map((_,i)=>i), picked=[];
  while(picked.length<n){
    if(!p.bag.length)p.bag=shuffle(all);
    let pos=p.bag.findIndex(i=>!picked.includes(i));
    if(pos<0){p.bag=shuffle(all.filter(i=>!picked.includes(i)));pos=0;}
    picked.push(p.bag.splice(pos,1)[0]);
  }
  return picked.map(i=>currentUnit().words[i]);
}
function wordOptions(word) { return shuffle([word,...shuffle(currentUnit().words.filter(w=>w.w!==word.w)).slice(0,2)]); }
const SPELL_TARGETS={'get up':'get','get dressed':'dressed','have breakfast':'breakfast','brush your teeth':'teeth','go to school':'school','have lunch':'lunch','play in the park':'park','have dinner':'dinner','go to bed':'bed'};
Object.assign(SPELL_TARGETS,{'swimming pool':'swimming','bus stop':'stop','train station':'station','table tennis':'tennis','visit my cousins':'cousins','go hiking':'hiking','keep a scrapbook':'scrapbook','help in the garden':'garden','build a tree house':'house','read a comic':'comic','learn to swim':'swim','go camping':'camping','take riding lessons':'riding'});
function spellTarget(word){return SPELL_TARGETS[word.w]||word.w.split(' ').reduce((a,b)=>b.length>a.length?b:a,'');}
function makeLetter(word) {
  const phrase=word.w;
  // Keep the phrase visible and remove just one letter from its main word.
  const target=spellTarget(word), offset=phrase.lastIndexOf(target), index=offset+(target.length>3?Math.floor(target.length/2):Math.min(1,target.length-1)), answer=phrase[index];
  const options=shuffle([answer,...shuffle([...'abcdefghijklmnopqrstuvwxyz'].filter(c=>c!==answer)).slice(0,2)]);
  return {type:'letter',word,index,answer,options};
}
function makeHide(word) {
  const target=spellTarget(word);
  const extras=shuffle([...'abcdefghijklmnopqrstuvwxyz'].filter(c=>!target.includes(c))).slice(0,3);
  return {type:'hide',word,target,offset:word.w.lastIndexOf(target),keys:shuffle([...target,...extras]),picked:[],phase:'look',notice:''};
}
function makeRecall(word,mode='study') {
  return {type:'recall',word,mode,draft:'',reveal:false,primed:Memory.entry(state.progress[state.unit],word.w).shown===Memory.today(),memoryResult:null,memoryRecorded:false,failureRecorded:false};
}
function startRound() {
  stopAudio();
  const daily=dailyToday();
  if(daily?.committed){home();return;}
  if(daily){
    state.unit=daily.unit;
    round=daily.version>=2?restoreDaily(daily):migrateDaily(daily);
    screen='game';save();renderQuestion();return;
  }
  round=null;
  const p=state.progress[state.unit],all=currentUnit().words,pending=all.filter(w=>{const r=Memory.entry(p,w.w);return r.passes===0&&!r.learned;});
  if(!pending.length){openIsland();return;}
  const pair=Memory.studyWords(p,all,Math.min(state.dailyWordCount,pending.length));
  round=makeDailyRound(pair);screen='game';save();renderQuestion();
}
function continueRound() {
  if(!dailyToday()?.committed)return;
  stopAudio();round=null;state.dailyByUnit[state.unit]=null;save();startRound();
}
function restartRound() {
  const saved=dailyToday();
  if(!saved?.committed)return;
  stopAudio();state.unit=saved.unit;
  round=saved.version>=2?restoreDaily(saved):migrateDaily(saved);
  round.day=Memory.today();round.index=0;round.committed=false;
  for(const q of round.questions){
    Object.assign(q,{solved:false,helped:false,wrong:[],hint:false,notice:''});
    if(q.type==='hide')Object.assign(q,{picked:[],phase:'look'});
    if(q.type==='recall'){
      const r=Memory.entry(state.progress[round.unit],q.word.w);
      Object.assign(q,{draft:'',reveal:false,memoryResult:null,memoryRecorded:false,failureRecorded:false,mode:r.passes>0&&r.due>=0&&r.due<=Memory.today()?'review':'study'});
    }
  }
  screen='game';save();renderQuestion();
}
function makeDailyRound(pair,day=Memory.today()) {
  const p=state.progress[state.unit],bank=SENTENCES[state.unit];
  const listening=word=>({type:'listen',word,options:wordOptions(word),answer:word.w});
  const questions=[...pair.map(listening),...pair.map(makeLetter),...pair.map(makeHide),...pair.map(word=>makeRecall(word,'study'))];
  pair.forEach((word,i)=>{
    const data=bank.find(q=>q.wordKey===word.w)||bank[(p.grammar+i)%bank.length];
    questions.push({type:'sentence',data,answer:data.a,options:shuffle(data.options)});
  });
  questions.forEach(q=>Object.assign(q,{solved:false,helped:false,wrong:[],hint:false}));
  return {version:3,wordCount:pair.length,id:++roundId,day,unit:state.unit,mode:'daily',questions,index:0,committed:false};
}
function migrateDaily(saved) {
  const previous=restoreDaily(saved),all=currentUnit().words;
  const pair=[...new Map([...previous.questions.filter(q=>q.type==='recall'),...previous.questions].filter(q=>q.word).map(q=>[q.word.w,q.word])).values()].slice(0,2);
  for(const word of all){if(pair.length===2)break;if(!pair.includes(word))pair.push(word);}
  const updated=makeDailyRound(pair,saved.day);
  updated.questions=updated.questions.map(q=>{
    const old=previous.questions.find(old=>old.type===q.type&&(q.type==='sentence'?old.data===q.data:old.word.w===q.word.w));
    return old?{...q,...old}:q;
  });
  updated.index=updated.questions.findIndex(q=>!q.solved);
  if(updated.index<0)updated.index=0;
  return updated;
}
function gameHeader() {
  const n=roundWordCount(round),level=Math.floor(round.index/n),question=round.index%n;
  return `<div class="game-header">${button('home','‹ 返回基地','back-btn')}<div class="mission-progress" role="progressbar" aria-label="关卡进度" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${level}">${LEVELS.map((_,i)=>`<span class="progress-segment ${i<level?'done':i===level?'current':''}"></span>`).join('')}</div><span class="step-count"><b>第 ${level+1} / 5 关</b><small>第 ${question+1} / ${n} 题</small></span></div>`;
}
const stepNames={listen:'声音雷达',letter:'字母维修站',hide:'Hide · 字母躲猫猫',recall:'记忆宝箱 · 自己拼',sentence:'句子小挑战'};
function optionMarkup(q, option, i, pictureMode=false) {
  const value=pictureMode?option.w:option, isWrong=q.wrong.includes(value), isCorrect=q.solved&&value===q.answer;
  const cls=`choice ${q.type==='letter'?'letter-choice':''} ${isWrong?'wrong':''} ${isCorrect?'correct':''}`;
  const label=pictureMode?`${i+1} 号图片：${option.cn}`:value;
  return `<button class="${cls}" data-action="answer" data-index="${i}" data-round="${round.id}" data-step="${round.index}" ${q.solved||isWrong?'disabled':''} aria-label="${esc(label)}">${pictureMode?picture(option)+`<span class="choice-caption">${q.solved?esc(option.w):esc(option.cn)}</span>`:esc(value)}</button>`;
}
function feedbackMarkup(q) {
  if(q.solved){
    const answer=q.type==='sentence'?q.data.full:q.word.w;
    const memoryLine=q.type==='recall'?'拼对啦，过关！':null;
    return `<div class="feedback" role="status"><div><strong>${memoryLine||(q.helped?'找到啦！学会一个新本领。':'太棒了，能量 +1！')}</strong><span>${esc(answer)}</span>${q.type==='sentence'?`<br>${esc(q.data.hint)}`:` · ${esc(q.word.cn)}`}</div>${button('next',round.index===round.questions.length-1?'收好努力星 ✦':(round.index+1)%roundWordCount(round)!==0?'下一题 →':'下一关 →','primary',`data-round="${round.id}" data-step="${round.index}"`)}</div>`;
  }
  if(q.type==='recall')return q.notice?`<div class="hint-panel" role="status">${esc(q.notice)}</div>`:'';
  if(q.type==='hide'){
    if(q.phase==='look')return '';
    if(q.hint)return `<div class="hint-panel" role="status">💡 ${esc(hintFor(q))}</div>`;
    return q.notice?`<div class="hint-panel" role="status">${esc(q.notice)}</div>`:'';
  }
  if(q.wrong.length)return `<div class="feedback try" role="status"><div><strong>没关系，再找找！</strong>${esc(hintFor(q))}</div></div>`;
  if(q.hint)return `<div class="hint-panel" role="status">💡 ${esc(hintFor(q))}</div>`;
  return '';
}
function hintFor(q) {
  if(q.type==='sentence')return q.data.hint;
  if(q.type==='letter')return `完整单词是 ${q.word.w}，这里少了字母 ${q.answer}。`;
  if(q.type==='hide')return `下一位是字母 ${q.target[q.picked.length]}，找一找它在哪儿。`;
  return `要找的是“${q.word.cn}”，英文叫 ${q.word.w}。`;
}
function letterMarkup(q) {
  let index=0;
  return q.word.w.split(' ').map(word=>{
    const tiles=[...word].map(c=>{const blank=index++===q.index&&!q.solved;return `<span class="letter-tile ${blank?'empty':''}">${blank?'?':esc(c)}</span>`;}).join('');
    index++;
    return `<span class="letter-word">${tiles}</span>`;
  }).join('');
}
function hidingBush() {
  return `<svg viewBox="0 0 32 36" aria-hidden="true"><path d="M2 34C2 23 7 16 16 16s14 7 14 18Z" fill="#8fbb74"/><path d="M9 34c0-9 2-15 7-15s7 6 7 15Z" fill="#659958"/><circle cx="12" cy="13" r="3.3" fill="white"/><circle cx="20" cy="13" r="3.3" fill="white"/><circle cx="12.5" cy="13.5" r="1.5" fill="#2c4c43"/><circle cx="20.5" cy="13.5" r="1.5" fill="#2c4c43"/></svg>`;
}
function hideMarkup(q) {
  const looking=q.phase==='look',prefix=q.word.w.slice(0,q.offset).trim(),suffix=q.word.w.slice(q.offset+q.target.length).trim();
  const tiles=[...q.target].map((ch,i)=>{
    const found=i<q.picked.length,peek=q.hint&&i===q.picked.length&&!looking,visible=looking||found||peek;
    return `<span class="hide-cell ${found?'found':!visible?'bush':peek?'peek':''}" aria-label="${visible?esc(ch):'藏起来的字母'}">${visible?esc(ch):hidingBush()}</span>`;
  }).join('');
  const controls=`data-round="${round.id}" data-step="${round.index}" data-position="${q.picked.length}"`;
  return `<h1>${q.solved?'字母全都找回来啦！':looking?'先看一看，记住它！':'字母躲进小灌木啦！'}</h1><p class="game-sub">${looking?'记住字母，再藏起来。':'按顺序，找回字母。'}</p><div class="word-target">${picture(q.word,q.word.cn)}<p>${esc(q.word.cn)}<small>${q.word.w!==q.target?'只找回这一组字母。':'慢慢来，Bobo 陪你找。'}</small></p></div><div class="hide-row">${prefix?`<span class="hide-context">${esc(prefix)}</span>`:''}<span class="hide-word" style="--letters:${q.target.length}">${tiles}</span>${suffix?`<span class="hide-context">${esc(suffix)}</span>`:''}</div>${looking?`<div class="hide-start">${button('listen','◖)) 听听这个词','secondary')}${button('hide-letters',q.picked.length?'藏起来，接着找！':'🙈 把字母藏起来！','primary',controls)}</div>`:`<p class="hide-count" role="status">找回 ${q.picked.length} / ${q.target.length} 个字母</p><div class="hide-keys">${q.keys.map((ch,i)=>button('hide-key',esc(ch),'hide-key',`data-index="${i}" ${controls} ${q.solved||q.picked.includes(i)?'disabled':''} aria-label="字母 ${esc(ch)}，第 ${i+1} 块"`)).join('')}</div><div class="sub-actions">${button('listen','◖)) 再听一遍','text-btn')}${!q.solved?`${button('hint','💡 提示下一个','text-btn')}${button('hide-undo','↶ 撤回一个','text-btn',`${controls} ${q.picked.length?'':'disabled'}`)}${button('hide-peek','再看一眼','text-btn',controls)}`:''}</div>`}`;
}
function hideAction(action,index,element) {
  if(!round||screen!=='game'||!ensureToday()||Number(element.dataset.round)!==round.id||Number(element.dataset.step)!==round.index)return;
  const q=round.questions[round.index];
  if(q.type!=='hide'||q.solved||Number(element.dataset.position)!==q.picked.length)return;
  if(action==='hide-letters'&&q.phase==='look'){stopAudio();q.phase='find';q.hint=false;q.notice='';renderQuestion(false);return;}
  if(q.phase!=='find')return;
  if(action==='hide-peek'){q.phase='look';q.helped=true;q.hint=false;q.notice='';renderQuestion(false);return;}
  if(action==='hide-undo'){
    if(!q.picked.length)return;
    q.picked.pop();q.hint=false;q.notice='撤回了一个，继续找吧。';renderQuestion(false);return;
  }
  if(action!=='hide-key'||!Number.isInteger(index)||index<0||index>=q.keys.length||q.picked.includes(index))return;
  if(q.keys[index]!==q.target[q.picked.length]){q.helped=true;q.notice='还不是这个字母，再试试！';renderQuestion(false);return;}
  q.picked.push(index);q.hint=false;q.notice='';
  if(q.picked.length===q.target.length){q.solved=true;q.phase='done';stopAudio();chime();}
  renderQuestion(false);
  if(q.solved)document.querySelector('[data-action="next"]')?.focus({preventScroll:true});
}
function recallMarkup(q) {
  const token=`data-round="${round.id}" data-step="${round.index}"`;
  return `<h1>${q.mode==='review'?'还记得怎么拼吗？':'现在，自己拼出来！'}</h1><p class="game-sub">看图拼${q.word.w.includes(' ')?'短语，记得空格':'单词'}。</p><div class="recall-picture">${picture(q.word,q.word.cn)}<h2>${esc(q.word.cn)}</h2></div>${q.reveal&&!q.solved?`<div class="recall-answer"><span>看一遍，再试试</span><strong>${esc(q.word.w)}</strong>${button('recall-cover','藏起答案','text-btn')}</div>`:''}<form id="recallForm" ${token}><label class="sr-only" for="recallInput">输入${q.word.w.includes(' ')?'完整短语':'完整单词'}</label><input id="recallInput" name="answer" value="${esc(q.draft)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" inputmode="none" maxlength="60" placeholder="${q.word.w.includes(' ')?'输入完整短语，记得空格':'输入完整单词'}" ${q.solved?'disabled':''}><button class="primary" type="submit" ${q.solved?'disabled':''}>拼好了 ✓</button></form>${!q.solved?`<div class="recall-keyboard" aria-label="字母键盘">${[...'abcdefghijklmnopqrstuvwxyz'].map(c=>button('recall-key',c,'recall-key',`data-char="${c}"`)).join('')}${button('recall-space','空格','recall-key wide')}${button('recall-delete','⌫ 删除','recall-key wide')}</div><div class="sub-actions">${button('listen','◖)) 再听一遍','text-btn')}${button('hint','看一下答案','text-btn')}</div><p class="keyboard-note">点字母，或用键盘。</p>`:''}`;
}
function recallFailure(q) {
  if(q.failureRecorded)return;
  Memory.fail(state.progress[round.unit],q.word.w);q.failureRecorded=true;save();
}
function checkRecall(element) {
  if(!round||screen!=='game'||!ensureToday()||Number(element.dataset.round)!==round.id||Number(element.dataset.step)!==round.index)return;
  const q=round.questions[round.index];if(q.type!=='recall'||q.solved)return;
  if(!Memory.normalize(q.draft)){q.notice='先拼一拼，再点“拼好了”。';renderQuestion(false);return;}
  if(![q.word.w,...(q.word.aliases||[])].some(w=>Memory.normalize(q.draft)===Memory.normalize(w))){
    q.helped=true;q.reveal=true;q.notice='差一点，看一看再试试。';recallFailure(q);renderQuestion(false);return;
  }
  q.solved=true;q.reveal=false;
  q.memoryResult=Memory.pass(state.progress[round.unit],q.word.w,{mode:q.mode,primed:q.helped});
  q.memoryRecorded=true;save();stopAudio();chime();renderQuestion(false);
  document.querySelector('[data-action="next"]')?.focus({preventScroll:true});
}
function useHint(q) {
  if(q.solved)return;
  q.hint=true;q.helped=true;
  if(q.type==='recall'){q.reveal=true;q.notice='看一遍，再自己拼。';}
  renderQuestion(false);
}
function recallKey(action,char) {
  const q=round?.questions[round.index];if(screen!=='game'||q?.type!=='recall'||q.solved)return;
  const input=document.getElementById('recallInput');
  const value=input.value,start=input.selectionStart??value.length,end=input.selectionEnd??start;
  if(action==='recall-delete')input.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');
  else if(action==='recall-space'||/^[a-z]$/.test(char||'')){if(value.length>=60)return;input.setRangeText(action==='recall-space'?' ':char,start,end,'end');}
  else return;
  q.draft=input.value;save();input.focus({preventScroll:true});
}
function noteVisibleAnswers(q) {
  if(!q.word)return;
  const p=state.progress[round.unit];
  if(q.solved||q.hint||q.type==='letter'||q.type==='hide'&&q.phase==='look'||q.type==='recall'&&q.reveal){
    Memory.shown(p,q.word.w);
    if(q.type==='listen'&&q.solved)q.options.forEach(w=>Memory.shown(p,w.w));
    save();
  }
}
function renderQuestion(focus=true) {
  if(!round||screen!=='game'||!ensureToday())return;
  const q=round.questions[round.index];noteVisibleAnswers(q);let body='';
  if(q.type==='sentence')prepareSentence(q.data.full);
  if(q.type==='listen')body=`<h1>听听 Bobo 在找谁？</h1><p class="game-sub">先点小喇叭，再选一张图片。</p>${button('listen','◖)) 点我听一听','sound-button')}<div class="sub-actions">${button('slow','慢一点听','text-btn')}</div><div class="choices">${q.options.map((w,i)=>optionMarkup(q,w,i,true)).join('')}</div>`;
  if(q.type==='letter')body=`<h1>修好一个小字母！</h1><p class="game-sub">哪块字母积木，刚好能放进空位？</p><div class="word-target">${picture(q.word,q.word.cn)}<p>${esc(q.word.cn)}<small>点下面的字母，就能装好。</small></p></div><div class="letter-line" aria-label="${esc(q.word.w.split('').map((c,i)=>i===q.index&&!q.solved?'空格':c).join(' '))}">${letterMarkup(q)}</div><div class="choices letters">${q.options.map((c,i)=>optionMarkup(q,c,i)).join('')}</div><div class="sub-actions">${button('listen','听听这个词','text-btn')}</div>`;
  if(q.type==='hide')body=hideMarkup(q);
  if(q.type==='recall')body=recallMarkup(q);
  if(q.type==='sentence')body=`<h1>${q.data.reply?'帮 Bobo 回一句！':'说出最后的密码！'}</h1><p class="game-sub">${esc(q.data.cn)}</p><div class="sentence-visual">${q.data.wordKey?picture(currentUnit().words.find(w=>w.w===q.data.wordKey),q.data.cn):q.data.visual}</div><div class="sentence-line">${esc(q.data.q).replace('___',`<span class="blank">${q.solved?esc(q.answer):'?'}</span>`)}</div><div class="choices words">${q.options.map((o,i)=>optionMarkup(q,o,i)).join('')}</div>${q.solved?`<div class="sub-actions">${button('read-sentence','听听完整句子','text-btn')}</div>`:''}`;
  mount(`${gameHeader()}<section class="game-card"><span class="game-kicker">${currentMeta().icon} ${stepNames[q.type]}</span>${body}${feedbackMarkup(q)}</section><div class="mission-note"><span class="mini-bobo">${robot()}</span><span>慢慢来，Bobo 陪着你。</span></div>`,focus);save();
}
function answer(index, element) {
  if(!round||screen!=='game'||!ensureToday()||Number(element.dataset.round)!==round.id||Number(element.dataset.step)!==round.index)return;
  const q=round.questions[round.index];if(q.solved||q.type==='hide'||q.type==='recall')return;
  const option=q.options[index];if(option===undefined)return;
  const value=typeof option==='object'?option.w:option;if(q.wrong.includes(value))return;
  stopAudio();
  if(value!==q.answer){q.wrong.push(value);q.helped=true;renderQuestion(false);return;}
  q.solved=true;chime();renderQuestion(false);
  document.querySelector('[data-action="next"]')?.focus({preventScroll:true});
}
function nextQuestion(element) {
  if(!round||screen!=='game'||!ensureToday()||Number(element.dataset.round)!==round.id||Number(element.dataset.step)!==round.index||!round.questions[round.index].solved)return;
  stopAudio();round.index++;
  while(round.questions[round.index]?.solved)round.index++;
  if(round.index===round.questions.length)finishRound();else renderQuestion();
}
function confetti() {
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const box=document.getElementById('confetti');box.replaceChildren();
  for(let i=0;i<22;i++){const el=document.createElement('span');el.className='confetti-piece';el.style.left=5+Math.random()*90+'%';el.style.background=['#6f9c78','#edc15c','#b2c487','#cf9868'][i%4];el.style.animationDelay=Math.random()*.3+'s';box.append(el);}
  setTimeout(()=>box.replaceChildren(),2400);
}
function finishRound() {
  if(!round||round.committed)return;
  const p=state.progress[round.unit];round.committed=true;screen='result';
  p.rounds++;p.stars+=round.questions.length;p.grammar+=round.questions.filter(q=>q.type==='sentence').length;
  for(const q of round.questions){if(q.word&&!p.seen.includes(q.word.w))p.seen.push(q.word.w);if(q.helped)p.assisted++;else p.independent++;}
  const u=currentMeta(),learned=[...new Map(round.questions.filter(q=>q.word).map(q=>[q.word.w,q.word])).values()],s=Memory.summary(p,currentUnit().words),earned=s.passed===s.total;
  learned.forEach(w=>Memory.shown(p,w.w));save();
  const checks=[...new Map(round.questions.filter(q=>q.type==='recall').map(q=>[q.word.w,q])).values()],passed=checks.filter(q=>Memory.status(Memory.entry(p,q.word.w)).passed).length;
  mount(`<section class="result"><div class="eyebrow">MISSION COMPLETE · 小冒险完成</div><div class="reward-badge" aria-hidden="true">${earned?u.badge:'🌱'}</div><h1>${earned?'整单元的记忆星都点亮啦！':'这一轮的 5 关，全部完成！'}</h1><div class="reward-line">★ +${round.questions.length} 颗努力星</div>${checks.length?`<div class="result-memory"><span>已过关 <b>${passed}</b></span><span>未过关 <b>${checks.length-passed}</b></span></div>`:''}<div class="review-strip">${learned.map(w=>button('word',esc(w.w),'review-chip',`data-word="${esc(w.w)}"`)).join('')}</div><div class="result-actions">${button('continue','继续冒险 →','primary')}${button('restart','重新冒险','secondary')}${button('home','回基地','secondary')}${button('book','单词星图','secondary')}</div></section>`);chime();confetti();
}
function wordbook() {
  stopAudio();screen='book';round=null;
  const p=state.progress[state.unit],s=Memory.summary(p,currentUnit().words);
  mount(`<div class="book-heading"><div><h1>U${state.unit} · 单词星图</h1><p>点词卡，看单词，听发音。</p></div>${button('home','‹ 回基地','back-btn')}</div>${s.due?`<div class="book-review-note"><span>${s.due} 个词等你复习。</span>${dailyToday()?.committed?'':button('island','去回忆岛','secondary')}</div>`:''}<div class="word-grid">${currentUnit().words.map(w=>{const r=Memory.entry(p,w.w),status=Memory.status(r);return `<button class="word-card" data-action="word" data-word="${esc(w.w)}" aria-label="查看${esc(w.cn)}的词卡"><span class="word-status ${status.key}">${status.passed?'★ ':''}${status.label}</span>${picture(w)}<h2>${esc(w.cn)}</h2><p class="word-en">点开看单词</p><small>${r.due>=0?`下次复习：${Memory.dayLabel(r.due)}`:'先练习，再独立拼一遍'}</small></button>`;}).join('')}</div>`);
}
function collection() {
  stopAudio();screen='collection';round=null;
  const sums=SOURCE_UNITS.map((u,i)=>Memory.summary(state.progress[i],u.words));
  mount(`<div class="book-heading"><div><h1>我的记忆徽章</h1><p>拼对所有单词，点亮徽章！</p></div>${button('home','‹ 回基地','back-btn')}</div><section class="result"><div class="eyebrow">REMEMBER EVERY WORD</div><h1>十个星球，一个词也不漏</h1><p>已经点亮 ${sums.filter(s=>s.passed===s.total).length} / ${META.length} 枚徽章</p><div class="stamp-grid">${META.map((u,i)=>{const s=sums[i],earned=s.passed===s.total;return `<div class="stamp ${earned?'earned':''}"><div class="symbol" aria-hidden="true">${earned?u.badge:'✧'}</div><h2>${u.badgeName}</h2><p>已点亮 ${s.passed} / ${s.total} 颗星</p>${button('unit',`去${u.title} →`,'text-btn',`data-value="${i}"`)}</div>`;}).join('')}</div><p class="collection-note">常来复习，记得更牢。</p></section>`);
}
function memoryParentMarkup() {
  const summaries=SOURCE_UNITS.map((u,i)=>Memory.summary(state.progress[i],u.words));
  return `<div class="dialog-top"><h2 id="parentTitle">给爸爸妈妈 · 学习进度</h2>${button('close-dialog','×','icon-btn','aria-label="关闭家长说明"')}</div><div class="parent-copy"><div class="parent-reset-tools"><p>当前浏览器 · 所有单元</p>${button('reset-progress','清空进度','danger-button')}</div><section class="parent-settings" aria-labelledby="studySettingTitle"><h3 id="studySettingTitle">每天学几个词？</h3><label for="dailyWordCount">每日单词数 <select id="dailyWordCount" aria-describedby="wordCountHelp">${Array.from({length:MAX_WORD_COUNT},(_,i)=>i+1).map(n=>`<option value="${n}" ${n===state.dailyWordCount?'selected':''}>${n} 个词${n===2?'（默认）':''}</option>`).join('')}</select></label><p id="wordCountHelp">每天先完成一轮：5 关，每关 ${state.dailyWordCount} 题，共 ${state.dailyWordCount*5} 题。</p><p class="parent-note">自动保存，所有单元通用。修改后从新一轮开始，正在做的题不变。还想练，可以点“继续冒险”。</p></section><p><strong>拼对就过关。</strong>在完整拼写题中，提交正确的单词或短语就显示“已过关”，不必等隔天检验。拼错显示“未过关”，改对后可以再次过关。看词卡、听音选图和字母游戏不改变完整拼写结果。</p><p><strong>旧词统一去“回忆岛”。</strong>所有单元的旧词合在一起，先练最早到期的词。首页会显示“今日待复习”的数量，逾期的词不会消失；没有到期词时显示下次日期。</p><p><strong>参考艾宾浩斯遗忘规律，采用间隔复习。</strong>第一次拼对后，明天复习。此后每次到期独立拼对，下一次依次间隔 2、4、7、15、30 天；之后保持 30 天。日期从实际复习当天算，不是固定从初学日期累加。拼错或看过答案，就回到明天再练；同一天反复练不会跳级。这是本产品的复习安排，不是人人适用的固定遗忘曲线。</p><p>“开始冒险”按单元学习未过关的词，旧词的定期复习放在回忆岛。每天先做一轮，最多 <strong>${state.dailyWordCount} 个词</strong>；本单元待学词不足时按实际数量出题。回忆岛每批也最多 ${state.dailyWordCount} 个词，每词直接看图拼写一次，不先展示答案；还有到期词可以继续下一批。已过关与复习日期分别记录，过关后仍会提醒复习。</p><p>中途关闭后可以继续原题。设置改动从新一轮生效。“重新冒险”保留本轮相同的题目。网页关闭时不会弹出系统通知，重新打开或返回页面会更新提醒。</p><table class="stats-table"><thead><tr><th>单元</th><th>已过关</th><th>未过关</th><th>今日待复习</th></tr></thead><tbody>${summaries.map((s,i)=>`<tr><td>U${i}</td><td>${s.passed}</td><td>${s.total-s.passed}</td><td>${s.due}</td></tr>`).join('')}</tbody></table><div class="parent-word-list">${SOURCE_UNITS.map((unit,i)=>`<details><summary>U${i} · 查看每个词</summary>${unit.words.map(w=>{const r=Memory.entry(state.progress[i],w.w),s=Memory.status(r);return `<div><span>${esc(w.w)}</span><span>${s.label}${r.due>=0?' · 复习：'+Memory.dayLabel(r.due):''}</span></div>`;}).join('')}</details>`).join('')}</div><p>本单元所有词过关即可点亮徽章。过关表示当前拼写结果，不表示以后无需复习。已经记录过一次拼对的词会直接显示过关，原有星星和复习日期保留。</p><p class="parent-note">${storageOK?'进度自动保存在当前浏览器。':'当前浏览器无法保存进度，关闭网页后可能丢失。'} 复习日期按北京时间计算，提前练下一轮不会修改真实日期。不同浏览器、设备之间不会自动同步。<br>网页提供单词音频和 85 句练习朗读。下载的离线版请保留旁边的 u0-u9-assets 文件夹，供课本录音使用。</p></div>`;
}
function parents() {
  const dialog=document.getElementById('parentDialog');
  progressResetPending=false;
  dialog.innerHTML=memoryParentMarkup();
  if(!dialog.open)dialog.showModal();
}
function setDailyWordCount(value) {
  if(!validWordCount(value))return;
  const previous=state.dailyWordCount;state.dailyWordCount=value;
  if(!save()){
    state.dailyWordCount=previous;parents();toast('没有保存成功，请重试。');return;
  }
  if(screen==='home')home(false);
  parents();document.getElementById('dailyWordCount').focus();
  toast('已保存，新一轮使用这个词数。');
}
function requestProgressReset() {
  const dialog=document.getElementById('parentDialog');
  if(!dialog.open||progressResetPending)return;
  progressResetPending=true;
  dialog.innerHTML=`<div class="dialog-top"><h2 id="parentTitle">清空全部进度？</h2>${button('close-dialog','×','icon-btn','aria-label="取消清空"')}</div><div class="reset-panel"><p>将清空当前浏览器中 <strong>U0–U9 所有单元</strong>的星星、过关记录、回忆岛复习安排和冒险进度。</p><p class="reset-warning">清空后无法恢复。</p><p id="resetStatus" role="status"></p><div class="reset-actions">${button('cancel-reset','先不清空','primary','id="cancelResetProgress"')}${button('confirm-reset','确认清空','danger-button')}</div></div>`;
  dialog.scrollTop=0;
  document.getElementById('cancelResetProgress').focus();
}
function confirmProgressReset() {
  const dialog=document.getElementById('parentDialog');
  if(!progressResetPending||!dialog.open)return;
  const next={unit:state.unit,effects:state.effects,dailyWordCount:state.dailyWordCount,offlineResetId:state.offlineResetId,island:null,resetId:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),dailyByUnit:SOURCE_UNITS.map(()=>null),progress:SOURCE_UNITS.map(unit=>({...freshProgress(),memory:Memory.hydrate({},unit.words)}))};
  // Commit first. A failed browser-storage write must leave the old records intact.
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}
  catch{storageOK=false;document.getElementById('resetStatus').textContent='没有清空成功，原进度已保留。请重试。';return;}
  stopAudio();round=null;Object.assign(state,next);storageOK=true;progressResetPending=false;
  dialog.close();home();toast('进度已清空，可以重新开始啦。');
}
function syncProgressReset(event) {
  if(event.key!==STORAGE_KEY||!event.newValue)return;
  let latest;try{latest=JSON.parse(event.newValue);}catch{return;}
  if(!latest||typeof latest.resetId!=='string'||latest.resetId===state.resetId)return;
  stopAudio();round=null;Object.assign(state,readState());progressResetPending=false;
  const dialog=document.getElementById('parentDialog');if(dialog.open)dialog.close();
  home(false);toast('进度已在另一个页面清空。');
}

let recordingTab=0;
function recordings(){
  stopAudio();screen='recordings';round=null;
  const unit=currentUnit();
  mount(`<div class="book-heading"><div><h1>U${state.unit} · 听读小屋</h1><p>${currentMeta().title} · ${unit.words.length} 个词语点读 / ${unit.lessons.length} 段课本录音</p></div>${button('home','‹ 回基地','back-btn')}</div><div class="recording-tabs" role="tablist" aria-label="录音分类">${['词语点读','课本录音'].map((t,i)=>button('audio-tab',t,i===0?'active':'',`data-index="${i}" role="tab" aria-selected="${i===0}" aria-controls="audioPanel"`)).join('')}</div><section id="audioPanel" class="audio-panel" role="tabpanel"></section>`);
  recordingPanel(recordingTab);
}
function recordingPanel(tab){
  tab=tab===1?1:0;
  recordingTab=tab;
  stopAudio();const unit=currentUnit(),panel=document.getElementById('audioPanel');
  document.querySelectorAll('[data-action="audio-tab"]').forEach(el=>{const active=Number(el.dataset.index)===tab;el.classList.toggle('active',active);el.setAttribute('aria-selected',String(active));});
  if(tab===0){
    unit.words.forEach(w=>Memory.shown(state.progress[state.unit],w.w));save();
    panel.innerHTML=`<p class="audio-note">点喇叭，跟着读。</p><div class="audio-words">${unit.words.map(w=>button('word',`${picture(w)}<span><strong>${esc(w.w)}</strong><small>${esc(w.cn)}</small></span><b aria-hidden="true">◖))</b>`,'audio-word',`data-word="${esc(w.w)}" aria-label="听 ${esc(w.w)} 的发音"`)).join('')}</div>`;
  }else if(tab===1){
    panel.innerHTML=`<div class="lesson-player"><div><span class="eyebrow">LISTENING HOUSE</span><h2 id="trackTitle">选一段，听一听</h2><p id="trackStatus" role="status">选一段，点播放。</p></div><audio id="lessonAudio" hidden controls preload="none" aria-label="课本录音播放器"></audio><label class="speed-control">播放速度 <select id="lessonSpeed"><option value="0.8">慢一点 · 0.8 倍</option><option value="1" selected>正常 · 1 倍</option><option value="1.2">1.2 倍</option></select></label></div><div class="lesson-list">${unit.lessons.map((t,i)=>button('lesson',`<span class="track-number">${String(i+1).padStart(2,'0')}</span><span><strong>${esc(t.title)}</strong><small>${esc(t.file)}</small></span><b aria-hidden="true">▶</b>`,'lesson-row',`data-index="${i}" aria-label="播放${esc(t.title)}"`)).join('')}</div>`;
  }
}
async function playLesson(index){
  const track=currentUnit().lessons[index],audio=document.getElementById('lessonAudio');if(!track||!audio)return;
  stopAudio();const token=audioVersion;
  document.getElementById('trackTitle').textContent=track.title;
  const status=document.getElementById('trackStatus');status.textContent='正在打开录音…';
  document.querySelectorAll('[data-action="lesson"]').forEach(el=>el.classList.toggle('active',Number(el.dataset.index)===index));
  audio.dataset.playToken=String(token);audio.hidden=false;audio.src=track.src;audio.playbackRate=Number(document.getElementById('lessonSpeed').value);
  const failed=()=>{if(token===audioVersion)status.textContent='录音没有打开。请把网页和 u0-u9-assets 文件夹放在一起，重新打开后再试。';};
  audio.onerror=failed;audio.onplaying=()=>{if(token!==audioVersion){audio.pause();return;}status.textContent='正在播放 · '+track.title;};
  audio.onended=()=>{if(token===audioVersion)status.textContent='这一段听完啦，可以选下一段。';};
  try{await audio.play();if(token!==audioVersion&&audio.dataset.playToken===String(token))audio.pause();}catch{failed();}
}
function selectUnit(unit) {
  if(!Number.isInteger(unit)||!SOURCE_UNITS[unit])return;
  const previous=screen;
  stopAudio();save();round=null;state.unit=unit;save();
  if(previous==='recordings')recordings();else if(previous==='book')wordbook();else home();
}
document.addEventListener('click',event=>{
  const el=event.target.closest('button[data-action]');if(!el||el.disabled)return;
  const action=el.dataset.action;
  if(action==='unit')selectUnit(Number(el.dataset.value));
  else if(action==='home')home();
  else if(action==='start')startRound();
  else if(action==='continue')continueRound();
  else if(action==='restart')restartRound();
  else if(action==='sound'){state.effects=!state.effects;save();renderNav();toast(state.effects?'闯关音效已打开':'闯关音效已关闭，点读仍可用');}
  else if(action==='book')wordbook();
  else if(action==='collection')collection();
  else if(action==='recordings')recordings();
  else if(action==='audio-tab'&&screen==='recordings')recordingPanel(Number(el.dataset.index));
  else if(action==='lesson'&&screen==='recordings')playLesson(Number(el.dataset.index));
  else if(action==='parents')parents();
  else if(action==='island')openIsland();
  else if(action.startsWith('island-'))islandAction(action,el);
  else if(action==='reset-progress')requestProgressReset();
  else if(action==='cancel-reset')parents();
  else if(action==='confirm-reset')confirmProgressReset();
  else if(action==='close-dialog'){progressResetPending=false;document.getElementById('parentDialog').close();}
  else if(action==='word'){
    const w=currentUnit().words.find(w=>w.w===el.dataset.word);
    if(w){Memory.shown(state.progress[state.unit],w.w);save();if(screen==='book'){const caption=el.querySelector('.word-en');if(caption)caption.textContent=w.w;}playWord(w.w);}
  }
  else if(action==='answer')answer(Number(el.dataset.index),el);
  else if(action==='next')nextQuestion(el);
  else if(screen==='game'&&round){
    if(!ensureToday())return;
    const q=round.questions[round.index];
    if(action==='listen'||action==='slow'){if(q.word)playWord(q.word.w,action==='slow');}
    else if(action==='hint'&&!q.solved)useHint(q);
    else if(action==='recall-cover'&&q.type==='recall'){q.reveal=false;renderQuestion(false);}
    else if(action.startsWith('recall-'))recallKey(action,el.dataset.char);
    else if(action.startsWith('hide-'))hideAction(action,Number(el.dataset.index),el);
    else if(action==='read-sentence'&&q.type==='sentence'&&q.solved)say(q.data.full);
  }
});
document.addEventListener('input',event=>{if(event.target.id==='islandInput'){const q=Island.current(state);if(q&&!q.solved){q.draft=event.target.value.slice(0,60);save();}return;}if(event.target.id==='recallInput'&&screen==='game'&&round?.questions[round.index]?.type==='recall'){round.questions[round.index].draft=event.target.value;save();}});
document.addEventListener('change',event=>{if(event.target.id==='dailyWordCount'){setDailyWordCount(Number(event.target.value));return;}if(event.target.id==='lessonSpeed'){const audio=document.getElementById('lessonAudio');if(audio)audio.playbackRate=Number(event.target.value);}});
document.addEventListener('submit',event=>{if(event.target.id==='islandForm'){event.preventDefault();islandAction('island-answer');return;}if(event.target.id==='recallForm'){event.preventDefault();checkRecall(event.target);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){save();stopAudio();}else if(screen==='home')home(false);});
window.addEventListener('focus',()=>{if(screen==='home')home(false);});
window.addEventListener('pagehide',()=>{save();stopAudio();});
window.addEventListener('storage',syncProgressReset);
home(false);
