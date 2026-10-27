function islandEntryMarkup(){
  const s=Island.summary(state,SOURCE_UNITS);
  const line=s.due?`今天有 ${s.due} 个词待复习`:s.remaining?'还有一小段回忆没完成':s.next!==null?`${Memory.dayLabel(s.next)}，老朋友等你来`:'学会的单词，会在这里等你';
  return `<section class="island-entry ${s.due?'due':''}"><span class="island-symbol" aria-hidden="true">🏝️</span><div><h3>回忆岛</h3><p>${line}</p></div>${button('island',s.remaining?'接着回忆 →':s.due?'去复习 →':'去看看 →','secondary')}</section>`;
}
function openIsland(){stopAudio();save();round=null;screen='island';renderIsland();}
function renderIsland(focus=true){
  const s=Island.summary(state,SOURCE_UNITS),session=state.island,active=session&&!session.committed;
  const headline=s.due?`今天有 ${s.due} 个老朋友等你！`:active?'接着上次的小回忆吧！':s.total?'今天的回忆完成啦！':'小岛等着你的第一个老朋友！';
  mount(`<div class="book-heading"><div><h1>🏝️ 回忆岛</h1><p>所有单元的老朋友，都在这里。</p></div>${button('home','‹ 回基地','back-btn')}</div><section class="island-hero"><div class="island-art" aria-hidden="true">🏝️</div><div><span class="island-pill">${s.due?'到时间，来回忆':'每天一点，记得更牢'}</span><h2>${headline}</h2><p>${s.overdue?`其中 ${s.overdue} 个是之前没练完的，先帮它们回家。`:s.due?'先看图，试着自己拼出来。':s.next!==null?`下次复习：${Memory.dayLabel(s.next)}。`:'先去冒险，学会一个新单词吧。'}</p>${active||s.due?button('island-start',active?'继续回忆 →':'开始回忆 →','primary'):button('home','去冒险 →','primary')}<small>每次最多 ${state.dailyWordCount} 个词 · 进度自动保存</small></div></section><details class="island-plan"><summary>给家长：复习是怎么安排的？</summary><p>首次拼对后，明天复习。每次到期独立拼对，下一次间隔逐渐拉长；看答案或拼错后，明天再练。</p><div class="island-intervals">${Memory.INTERVALS.map(d=>`<span>${d} 天</span>`).join('<b>→</b>')}</div><p>从每次实际完成的日期计算；同一天重复练不会跳级。到期词统一排队，之前没练完的优先。网页关闭时不弹系统通知，打开后会更新提醒。</p></details>`,focus);
}
function startIsland(){
  stopAudio();save();round=null;
  if(!Island.start(state,SOURCE_UNITS)){screen='island';renderIsland();return;}
  screen='island-game';save();renderIslandQuestion();
}
function renderIslandQuestion(focus=true){
  const session=state.island,q=Island.current(state);
  if(!session||session.committed){renderIslandResult();return;}
  const word=SOURCE_UNITS[q.unit].words.find(w=>w.w===q.wordKey);
  mount(`<div class="game-header">${button('island','‹ 回忆岛','back-btn')}<span class="island-pill">🏝️ 老朋友回家</span><span class="step-count">${session.index+1} / ${session.items.length} 个词</span></div><section class="game-card island-game"><h1>还记得怎么拼吗？</h1><div class="recall-picture">${picture(word,word.cn,SOURCE_UNITS[q.unit])}<h2>${esc(word.cn)}</h2></div>${q.reveal&&!q.solved?`<div class="recall-answer"><span>看一眼，再自己拼</span><strong>${esc(word.w)}</strong>${button('island-cover','藏起答案','text-btn')}</div>`:''}<form id="islandForm"><label class="sr-only" for="islandInput">输入完整单词或短语</label><input id="islandInput" class="island-input" value="${esc(q.draft)}" maxlength="60" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="拼出老朋友的名字" ${q.solved?'disabled':''}><button class="primary" type="submit" ${q.solved?'disabled':''}>拼好了 ✓</button></form>${!q.solved?`<div class="recall-keyboard">${[...'abcdefghijklmnopqrstuvwxyz'].map(c=>button('island-key',c,'recall-key',`data-char="${c}"`)).join('')}${button('island-space','空格','recall-key wide')}${button('island-delete','⌫ 删除','recall-key wide')}</div><div class="sub-actions">${button('island-listen','听听发音','text-btn')}${button('island-hint','想不起来，看一下','text-btn')}</div>`:''}${q.solved?`<div class="feedback" role="status"><div><strong>${esc(q.notice)}</strong><span>${esc(word.w)} · 下次：${Memory.dayLabel(q.nextDue)}</span></div>${button('island-next',session.index===session.items.length-1?'收好回忆星 ✦':'下一个朋友 →','primary')}</div>`:q.notice?`<div class="hint-panel" role="status">${esc(q.notice)}</div>`:''}</section>`,focus);
}
function renderIslandResult(){
  screen='island-result';const session=state.island;if(!session?.committed){screen='island';renderIsland();return;}
  const s=Island.summary(state,SOURCE_UNITS);
  mount(`<section class="result"><div class="reward-badge" aria-hidden="true">🏝️</div><h1>${session.items.length} 个老朋友，回家啦！</h1><div class="reward-line">★ +${session.items.length} 颗回忆星</div><p>${s.due?`还有 ${s.due} 个词等你复习。`:s.next!==null?`下次回忆：${Memory.dayLabel(s.next)}。`:'今天先到这里！'}</p><div class="result-actions">${s.due?button('island-start','继续回忆 →','primary'):''}${button('island','回到小岛','secondary')}${button('home','回基地','secondary')}</div></section>`);
}
function islandAction(action,el){
  if(action==='island-start'){startIsland();return;}
  const q=Island.current(state);if(screen!=='island-game'||!q)return;
  if(action==='island-next'){if(Island.next(state)){stopAudio();save();if(state.island.committed)renderIslandResult();else renderIslandQuestion();}return;}
  if(q.solved)return;
  if(action==='island-key'||action==='island-space'||action==='island-delete'){
    const input=document.getElementById('islandInput'),start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
    if(action==='island-delete')input.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');
    else if(input.value.length<60){const text=action==='island-space'?' ':el.dataset.char;if(!/^[a-z ]$/.test(text))return;input.setRangeText(text,start,end,'end');}
    q.draft=input.value;save();input.focus({preventScroll:true});return;
  }
  if(action==='island-answer'){if(Island.answer(state,SOURCE_UNITS))chime();}
  else if(action==='island-hint')Island.hint(state);
  else if(action==='island-cover')q.reveal=false;
  else if(action==='island-listen'){q.helped=true;save();playWord(q.wordKey,false,q.unit);return;}
  else return;
  save();renderIslandQuestion(false);
}
let islandReminderDay=-1,islandReminderCount=0;
function refreshIslandReminder(){
  if(document.hidden)return;
  if(screen==='island')renderIsland(false);else if(screen==='home')home(false);else renderNav();
  const s=Island.summary(state,SOURCE_UNITS),day=Memory.today();
  if(s.due&&(day!==islandReminderDay||s.due>islandReminderCount))toast(`🏝️ 回忆岛：今天有 ${s.due} 个词待复习。`);
  islandReminderDay=day;islandReminderCount=s.due;
}
window.addEventListener('focus',refreshIslandReminder);
document.addEventListener('visibilitychange',refreshIslandReminder);
document.addEventListener('DOMContentLoaded',refreshIslandReminder);
setInterval(refreshIslandReminder,60000);
