const Memory = (() => {
  const DAY=86400000;
  const today=()=>Math.floor((Date.now()+8*3600000)/DAY);
  const integer=(v,fallback=0)=>Number.isSafeInteger(v)&&v>=0?v:fallback;
  function fresh(){return {practice:0,order:0,attempts:0,passes:0,lastPass:-1,due:-1,shown:-1};}
  function hydrate(raw,words){
    const out={};
    for(const word of words){const v=raw?.[word.w]||{},r=fresh();for(const k of ['practice','order','attempts','passes'])r[k]=integer(v[k]);for(const k of ['lastPass','due','shown'])r[k]=integer(v[k],-1);r.passes=Math.min(r.passes,5);if(r.passes&&r.lastPass<0){r.passes=0;r.due=-1;}out[word.w]=r;}
    return out;
  }
  function entry(progress,word){return progress.memory[word]||(progress.memory[word]=fresh());}
  function dueWords(progress,words,day=today()){return words.filter(w=>{const r=entry(progress,w.w);return r.passes>0&&r.due>=0&&r.due<=day;}).sort((a,b)=>entry(progress,a.w).due-entry(progress,b.w).due);}
  function studyWords(progress,words,n){
    const pending=words.filter(w=>entry(progress,w.w).passes===0),freshWords=pending.filter(w=>!entry(progress,w.w).practice),weak=pending.filter(w=>entry(progress,w.w).practice).sort((a,b)=>entry(progress,a.w).order-entry(progress,b.w).order);
    const chosen=[];
    // Alternate new and struggling words so errors cannot starve unseen vocabulary.
    const newFirst=(progress.studyTurn||0)%2===0;
    while(chosen.length<n&&(freshWords.length||weak.length)){
      const preferNew=(chosen.length%2===0)===newFirst;
      chosen.push((preferNew&&freshWords.length||!weak.length?freshWords:weak).shift());
    }
    progress.studyTurn=(progress.studyTurn||0)+1;
    for(const w of chosen){const r=entry(progress,w.w);r.practice++;r.order=++progress.studyClock;}
    return chosen;
  }
  function shown(progress,word,day=today()){entry(progress,word).shown=day;}
  function fail(progress,word){const r=entry(progress,word);r.attempts++;r.passes=0;r.lastPass=-1;r.due=-1;}
  function pass(progress,word,{mode='study',primed=false,day=today()}={}){
    const r=entry(progress,word);r.attempts++;
    if(r.passes===0){r.passes=1;r.lastPass=day;r.due=day+1;return 'first';}
    if(mode==='review'&&!primed&&r.lastPass<day&&r.due<=day){r.passes=Math.min(r.passes+1,5);r.lastPass=day;r.due=day+(r.passes===2?3:7);return 'retained';}
    if(mode==='review')r.due=Math.max(r.due,day+1);
    return 'practice';
  }
  function status(r){
    return r.passes>=1?{key:'passed',label:'已过关',passed:true}:{key:'learning',label:'未过关',passed:false};
  }
  function summary(progress,words,day=today()){
    const records=words.map(w=>entry(progress,w.w));
    return {total:words.length,passed:records.filter(r=>r.passes>=1).length,first:records.filter(r=>r.passes>=1).length,learning:records.filter(r=>r.passes===0&&r.practice>0).length,new:records.filter(r=>r.passes===0&&!r.practice).length,due:dueWords(progress,words,day).length,waiting:records.filter(r=>r.passes===1&&r.due>day).length};
  }
  function nextDay(progress,words){const dates=words.map(w=>entry(progress,w.w).due).filter(d=>d>=0);return dates.length?Math.min(...dates):-1;}
  const dayLabel=(day,now=today())=>day<=now?'今天':day===now+1?'明天':new Date(day*DAY).toISOString().slice(5,10).replace('-','月')+'日';
  const normalize=text=>String(text).trim().toLowerCase().replace(/\s+/g,' ');
  return {today,fresh,hydrate,entry,dueWords,studyWords,shown,fail,pass,status,summary,nextDay,dayLabel,normalize};
})();