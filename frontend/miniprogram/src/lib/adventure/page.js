const {Engine,Memory,catalog,LEVELS,roundWordCount,MAX_WORD_COUNT,Island}=require('./engine');
const media=require('./media-config');
const route=(unit,view)=>`/english/u${unit}/${view}/index`;
function questionView(engine){
 const q=engine.current();if(!q)return null;
 const n=roundWordCount(engine.round),word=engine.word(q),sentence=engine.sentence(q),answer=sentence?sentence.full:word.w;
 const options=(q.options||[]).map((v,i)=>{const w=q.type==='listen'?engine.unit.words.find(w=>w.w===v):null;return {index:i,value:v,label:w?(q.solved?w.w:w.cn):v,image:w?w.image:'',wrong:q.wrong.includes(v),correct:q.solved&&v===q.answer,disabled:q.solved||q.wrong.includes(v)};});
 let hint='';if(q.type==='sentence')hint=sentence.hint;else if(q.type==='letter')hint=`完整单词是 ${word.w}，这里少了 ${q.answer}。`;else if(q.type==='hide')hint=`下一个字母是 ${q.target[q.picked.length]||''}。`;else hint=`要找的是“${word.cn}”，英文叫 ${word.w}。`;
 const sentenceWord=sentence&&engine.unit.words.find(w=>w.w===sentence.wordKey);
 return {...q,word,sentence,answer,options,hintText:hint,number:engine.round.index+1,level:Math.floor(engine.round.index/n)+1,levelName:LEVELS[Math.floor(engine.round.index/n)].name,part:engine.round.index%n+1,partTotal:n,
  title:({listen:'听听 Bobo 在找谁？',letter:'修好一个小字母！',hide:q.phase==='look'?'先看一看，记住它！':'找回藏起来的字母！',recall:'现在，自己拼出来！',sentence:'说出最后的密码！'})[q.type],
  letters:q.type==='letter'?[...word.w].map((c,i)=>({value:i===q.index&&!q.solved?'?':c,space:c===' ',blank:i===q.index&&!q.solved})):[],
  hidePrefix:q.type==='hide'?word.w.slice(0,q.offset):'',hideSuffix:q.type==='hide'?word.w.slice(q.offset+q.target.length):'',
  hideLetters:q.type==='hide'?[...q.target].map((c,i)=>({value:q.phase==='look'||i<q.picked.length||q.hint&&i===q.picked.length?c:'🌿',found:i<q.picked.length})):[],
  hideKeys:q.type==='hide'?q.keys.map((c,i)=>({value:c,index:i,disabled:q.solved||q.picked.includes(i)})):[],
  sentenceText:sentence?sentence.q.replace('___',q.solved?q.answer:'?'):'',sentenceImage:sentenceWord?sentenceWord.image:'',nextText:engine.round.index===engine.round.questions.length-1?'收好努力星 ✦':(engine.round.index+1)%n!==0?'下一题 →':'下一关 →'};
}
module.exports=function createPage(view,unit,api){return {
 data:{pageData:{}},
 onLoad(){this.tab=0;this.speed=1;this.revealed={};this.audioState={status:'idle'};},
 onShow(){
  this.engine=new Engine(api,unit);if(view==='game'&&!this.engine.start()){api.redirectTo({url:'/pages/island/index'});}
  this.player=getApp().player;
  this.detach=this.player.attach(s=>{this.audioState=s;if(this.engine)this.refresh();});
  this.refresh();if(view==='home')this.reminderTimer=setInterval(()=>this.refresh(),60000);this.reminderTimer?.unref?.();
 },
 onHide(){clearInterval(this.reminderTimer);if(this.detach){this.detach();this.detach=null;}},
 onUnload(){clearInterval(this.reminderTimer);if(this.detach){this.detach();this.detach=null;}},
 onShareAppMessage(){return {title:`英语星球冒险 · U${unit.id} ${unit.title}`,path:route(unit.id,'home')};},
 refresh(){
  const e=this.engine;if(!e)return;const round=e.todayRound(),summary=e.summary();
  const n=round?roundWordCount(round):e.state.dailyWordCount;
  const levels=LEVELS.map((l,i)=>({...l,done:!!round&&round.questions.slice(i*n,i*n+n).every(q=>q.solved),solved:round?round.questions.slice(i*n,i*n+n).filter(q=>q.solved).length:0}));
  const allProgress=catalog.map((u,i)=>{const s=Memory.summary(e.state.progress[i],u.words);return {...u,...s,earned:s.passed===s.total,details:u.words.map(w=>{const r=Memory.entry(e.state.progress[i],w.w);return {...w,status:Memory.status(r).label,due:r.due>=0?Memory.dayLabel(r.due):'尚未安排'};})};});
  const words=unit.words.map(w=>{const r=Memory.entry(e.progress,w.w);return {...w,revealed:!!this.revealed[w.w],passed:r.passes>0,status:Memory.status(r).label,due:r.due>=0?Memory.dayLabel(r.due):'先练习，再自己拼一遍'};});
  const a=this.audioState||{},playing=a.status==='playing',loading=a.status==='loading';
  const data={view,islandSummary:Island.summary(e.state,catalog),wordCount:n,dailyWordCount:e.state.dailyWordCount,wordCountOptions:Array.from({length:MAX_WORD_COUNT},(_,i)=>`${i+1} 个词${i===1?'（默认）':''}`),totalQuestions:round?round.questions.length:n*5,unit:{id:unit.id,title:unit.title,en:unit.en,icon:unit.icon,badge:unit.badge,badgeName:unit.badgeName},units:catalog.map(u=>({id:u.id,title:u.title,icon:u.icon,selected:u.id===unit.id})),stars:e.state.progress.reduce((n,p)=>n+p.stars,0),effects:e.state.effects,summary,words,levels,allProgress,roundDone:!!round?.committed,hasRound:!!round,q:questionView(e),recordingTab:this.tab,lessons:unit.lessons,keyboard:[...'abcdefghijklmnopqrstuvwxyz'],storageOK:e.storageOK,lessonAvailable:!!media.lessonBaseUrl,speedIndex:[.8,1,1.2].indexOf(this.speed),audio:{status:a.status||'idle',playing,loading,message:a.message||'',label:a.clip?.text||'',currentTime:a.currentTime||0,duration:a.duration||0,seek:a.duration?Math.round(a.currentTime/a.duration*1000):0}};
  this.setData({pageData:JSON.parse(JSON.stringify(data))});
 },
 island(){this.player.stop();api.navigateTo({url:'/pages/island/index'});},
 navigate(event){const dest=event.currentTarget.dataset.view;this.player.stop();api.redirectTo({url:route(unit.id,dest)});},
 selectUnit(event){const id=Number(event.currentTarget.dataset.unit);if(!catalog[id])return;this.player.stop();api.redirectTo({url:route(id,['words','recordings'].includes(view)?view:'home')});},
 start(){api.redirectTo({url:route(unit.id,'game')});},
 continueRound(){this.player.stop();this.engine.continue();if(!this.engine.round)api.redirectTo({url:'/pages/island/index'});else if(view==='game')this.refresh();else api.redirectTo({url:route(unit.id,'game')});},
 restartRound(){this.player.stop();this.engine.restart();if(!this.engine.round)api.redirectTo({url:'/pages/island/index'});else if(view==='game')this.refresh();else api.redirectTo({url:route(unit.id,'game')});},
 answer(event){this.player.stop();const q=this.engine.current();if(!q)return;this.engine.answer(q.options[Number(event.currentTarget.dataset.index)]);this.refresh();},
 hide(event){this.engine.hide(event.currentTarget.dataset.action,Number(event.currentTarget.dataset.index));this.refresh();},
 onInput(event){this.engine.draft(event.detail.value);},
 key(event){const q=this.engine.current();if(!q||q.type!=='recall')return;const key=event.currentTarget.dataset.key;this.engine.draft(key==='delete'?q.draft.slice(0,-1):q.draft+(key==='space'?' ':key));this.refresh();},
 recall(){this.player.stop();this.engine.recall();this.refresh();},
 hint(){this.engine.hint();this.refresh();},
 next(){this.player.stop();this.engine.next();this.refresh();api.pageScrollTo({scrollTop:0,duration:0});},
 listen(event){const q=this.engine.current(),w=this.engine.word(q);if(!w)return;const slow=String(event.currentTarget.dataset.slow)==='true';this.play({audio:w.audio,text:w.w},slow?0.78:1);},
 readSentence(){const q=this.engine.current();if(!q||!q.solved||q.type!=='sentence')return;const s=this.engine.sentence(q);this.play({audio:s.audio,text:s.full},1);},
 word(event){const w=unit.words[Number(event.currentTarget.dataset.index)];if(!w)return;this.revealed[w.w]=true;this.engine.shown(w.w);this.play({audio:w.audio,text:w.w},1);this.refresh();},
 play(clip,speed){this.player.play(clip,'bubble',1,speed||1);},
 audioTab(event){this.player.stop();this.tab=Number(event.currentTarget.dataset.tab)||0;this.refresh();},
 lesson(event){const lesson=unit.lessons[Number(event.currentTarget.dataset.index)];if(!lesson)return;if(!/^https:\/\//.test(media.lessonBaseUrl)){api.showModal({title:'课本录音暂未接通',content:'单词点读、句子朗读和 Bluey 原声均可正常使用。课本录音接通后可在这里播放。',showCancel:false});return;}this.play({audio:media.lessonBaseUrl.replace(/\/$/,'')+'/'+lesson.src,text:lesson.title},this.speed);},
 toggleAudio(){if(this.audioState?.status==='playing')this.player.pause();else this.player.resume(this.speed);},
 seek(event){if(this.audioState?.duration)this.player.seek(Number(event.detail.value)/1000);},
 speedChange(event){this.speed=[.8,1,1.2][Number(event.detail.value)]||1;this.player.setSpeed(this.speed);this.refresh();},
 wordCountChange(event){const ok=this.engine.setDailyWordCount(Number(event.detail.value)+1);this.refresh();api.showToast({title:ok?'已保存，新一轮生效':'没有保存成功，请重试',icon:'none'});},
 resetProgress(){api.showModal({title:'清空全部学习进度？',content:'将清空当前微信中 U0–U9 的星星、过关记录和冒险进度。Bluey 阅读位置不受影响。此操作无法撤销。',confirmText:'确认清空',confirmColor:'#a64435',success:result=>{if(!result.confirm)return;const ok=this.engine.reset();this.refresh();api.showToast({title:ok?'学习进度已清空':'没有清空成功，请重试',icon:'none'});}});}
};};
