const Memory=require('./memory');
// Shared, DOM-free review session. Unit IDs remain internal; the child sees one island.
const Island=(()=>{
  function queue(state,units,day=Memory.today()){
    return units.flatMap((u,unit)=>u.words.flatMap(w=>{
      const r=Memory.entry(state.progress[unit],w.w);
      return (r.learned||r.passes>0)&&r.due>=0?[{unit,wordKey:w.w,cn:w.cn,due:r.due}]:[];
    })).sort((a,b)=>a.due-b.due||a.unit-b.unit||a.wordKey.localeCompare(b.wordKey));
  }
  function summary(state,units,day=Memory.today()){
    const all=queue(state,units),due=all.filter(w=>w.due<=day),future=all.filter(w=>w.due>day);
    return {total:all.length,due:due.length,overdue:due.filter(w=>w.due<day).length,next:future[0]?.due??null,remaining:state.island&&!state.island.committed?state.island.items.length-state.island.index:0};
  }
  function hydrate(raw,units){
    if(!raw||raw.version!==1||!Array.isArray(raw.items)||raw.items.length<1||raw.items.length>6||!Number.isInteger(raw.index)||raw.index<0||raw.index>raw.items.length||typeof raw.committed!=='boolean'||raw.committed!==(raw.index===raw.items.length))return null;
    const seen=new Set();
    for(const [i,q] of raw.items.entries()){
      const key=q?.unit+':'+q?.wordKey;
      if(!Number.isInteger(q?.unit)||!units[q.unit]?.words.some(w=>w.w===q.wordKey)||seen.has(key)||typeof q.solved!=='boolean'||typeof q.draft!=='string'||q.draft.length>60||i<raw.index&&!q.solved)return null;
      seen.add(key);
    }
    return JSON.parse(JSON.stringify(raw));
  }
  function start(state,units,day=Memory.today()){
    if(state.island&&!state.island.committed)return state.island;
    const n=Number.isInteger(state.dailyWordCount)?Math.max(1,Math.min(6,state.dailyWordCount)):2;
    const items=queue(state,units,day).filter(q=>q.due<=day).slice(0,n);
    if(!items.length)return null;
    state.island={version:1,day,index:0,committed:false,items:items.map(q=>({...q,draft:'',solved:false,helped:false,reveal:false,failed:false,notice:''}))};
    return state.island;
  }
  const current=state=>state.island?.items[state.island.index];
  function hint(state){const q=current(state);if(!q||q.solved)return;q.helped=true;q.reveal=true;q.notice='看一眼，再自己拼。';}
  function answer(state,units,day=Memory.today()){
    const q=current(state);if(!q||q.solved)return false;
    const word=units[q.unit].words.find(w=>w.w===q.wordKey),p=state.progress[q.unit];
    if(!Memory.normalize(q.draft)){q.notice='先拼一拼吧。';return false;}
    if(![word.w,...(word.aliases||[])].some(w=>Memory.normalize(w)===Memory.normalize(q.draft))){
      q.helped=true;q.reveal=true;q.notice='看一眼，重新拼一遍。';
      if(!q.failed){Memory.fail(p,word.w,{day});q.failed=true;}return false;
    }
    q.result=Memory.pass(p,word.w,{mode:'review',primed:q.helped,day});q.solved=true;q.reveal=false;q.notice=q.helped?'拼对啦，明天再见！':'记住啦，老朋友！';
    q.nextDue=Memory.entry(p,word.w).due;return true;
  }
  function next(state){
    const session=state.island,q=current(state);if(!session||session.committed||!q?.solved)return false;
    session.index++;
    if(session.index===session.items.length){
      session.committed=true;
      for(const item of session.items){const p=state.progress[item.unit];p.stars++;if(item.helped)p.assisted++;else p.independent++;}
    }
    return true;
  }
  return {queue,summary,hydrate,start,current,hint,answer,next};
})();

module.exports = Island;
