(() => {
  'use strict';
  const book = window.COMIC_BOOK;
  const $ = id => document.getElementById(id);
  const audio = $('voice');
  const panels = book.pages.flatMap(p => p.panels);
  const bubbleMap = new Map(panels.flatMap(p => p.bubbles.map(b => [b.id, {bubble:b, panel:p}])));
  const STORE = book.id;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch {}
  const hashNumber = Number(location.hash.match(/^#panel-(\d+)$/)?.[1]);
  const savedPanel = Number.isInteger(saved.panel) ? saved.panel : 1;
  let currentPanel = panels[Math.min(panels.length - 1, Math.max(0, (hashNumber || savedPanel) - 1))];
  let pageNumber = currentPanel.page;
  let view = ['page','panel'].includes(saved.view) ? saved.view : (innerWidth < 900 ? 'panel' : 'page');
  let selectedBubble = currentPanel.bubbles[0] || null;
  let clip = null;
  let mode = 'panel';
  let status = 'idle';
  let request = 0;
  let timeout = 0;
  let lastPointer = null;
  let imageRequest = 0;
  let readyImage = false;
  let cancelPointerClick = false;
  $('speed').value = ['0.75','1','1.25'].includes(String(saved.speed)) ? String(saved.speed) : '1';

  const time = seconds => {const n=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};
  const page = () => book.pages[pageNumber - 1];
  function persist(){try{localStorage.setItem(STORE,JSON.stringify({panel:currentPanel.number,view,speed:$('speed').value}));}catch{}}
  function setStatus(next, message){
    status = next;
    if (message) $('player-status').textContent = message;
    const labels={idle:'听这一格',loading:'取消加载',playing:'暂停',paused:'继续',ended:mode==='bubble'?'再听这句':'再听这格',error:'重试播放'};
    $('play-label').textContent=labels[next]||'听这一格';
    $('play-icon').textContent=next==='playing'?'Ⅱ':next==='loading'?'×':'▶';
    $('play-toggle').setAttribute('aria-label',labels[next]||'播放');
    $('play-toggle').setAttribute('aria-busy',String(next==='loading'));
    syncHighlights();
  }
  function stop(message='翻到这里了，点击就能听'){
    ++request;clearTimeout(timeout);audio.pause();audio.removeAttribute('src');audio.load();clip=null;
    $('seek').value=0;$('seek').disabled=true;$('elapsed').textContent='0:00';$('duration').textContent='0:00';
    $('player-kind').textContent=`第 ${currentPanel.number} 格 · 视频原声`;
    setStatus('idle',message);
  }
  function pause(reason='已暂停，点击继续'){
    if (status==='loading') {++request;clearTimeout(timeout);audio.pause();setStatus('paused',reason);return;}
    if(status==='playing'){audio.pause();setStatus('paused',reason);}
  }
  function syncHighlights(){
    for(const el of document.querySelectorAll('.panel-hotspot')){
      el.classList.toggle('is-selected',Number(el.dataset.panel)===currentPanel.number);
      el.classList.toggle('is-playing',Number(el.dataset.panel)===currentPanel.number&&mode==='panel'&&status==='playing');
    }
    for(const el of document.querySelectorAll('[data-bubble]')){
      const active=el.dataset.bubble===selectedBubble?.id;
      el.classList.toggle('is-active',active);
      if(el.classList.contains('line-button'))el.setAttribute('aria-pressed',String(active));
    }
  }
  function updateDetail(){
    $('panel-chip').textContent=`第 ${currentPanel.number} 格`;
    $('panel-progress').textContent=`${currentPanel.number} / ${panels.length} 格`;
    $('prev-panel').disabled=currentPanel.number===1;$('next-panel').disabled=currentPanel.number===panels.length;
    $('speaker-name').textContent=selectedBubble?.speaker || '画面声音 · 无对白';
    $('current-line').textContent=selectedBubble?.text || '这一刻，听听画面里的声音。';
    $('current-line').lang=selectedBubble?'en':'zh-CN';
    $('line-note').textContent=selectedBubble?.note||'';$('line-note').hidden=!selectedBubble?.note;
    $('replay-line').innerHTML='<span aria-hidden="true">↻</span> '+(selectedBubble?'再听这句话':'听画面声音');
    $('line-count').textContent=currentPanel.bubbles.length?`${currentPanel.bubbles.length} 句`:'无对白';
    const list=$('line-list');list.replaceChildren();
    for(const bubble of currentPanel.bubbles){
      const button=document.createElement('button');button.className='line-button';button.dataset.bubble=bubble.id;button.type='button';
      button.setAttribute('aria-label',`播放 ${bubble.speaker}：${bubble.text}`);
      const icon=document.createElement('span');icon.className='mini-play';icon.textContent='▶';icon.setAttribute('aria-hidden','true');
      const label=document.createElement('span');label.textContent=bubble.text;label.lang='en';button.append(icon,label);
      button.addEventListener('click',()=>playBubble(bubble.id));list.append(button);
    }
    if(!currentPanel.bubbles.length){const p=document.createElement('p');p.className='ambient-note';p.textContent='这一格没有对白，点击画面可以听到原片的音乐与环境音。';list.append(p);}
    syncHighlights();
  }
  function navigate(number,{scroll=true}={}){
    const next=panels[Math.min(panels.length-1,Math.max(0,number-1))];
    stop();currentPanel=next;pageNumber=next.page;selectedBubble=next.bubbles[0]||null;
    history.replaceState(null,'',`#panel-${next.number}`);render();persist();
    $('player-kind').textContent=`第 ${next.number} 格 · 视频原声`;
    if(scroll)$('reader').scrollIntoView({block:'start',behavior:'instant'});
  }
  function turnPage(delta){const target=book.pages[pageNumber-1+delta];if(target)navigate(target.panels[0].number);}
  function createHotspot(rect,viewport,className,label){
    const b=document.createElement('button');b.type='button';b.className=`hotspot ${className}`;b.setAttribute('aria-label',label);
    b.style.left=((rect[0]-viewport[0])/viewport[2]*100)+'%';b.style.top=((rect[1]-viewport[1])/viewport[3]*100)+'%';
    b.style.width=(rect[2]/viewport[2]*100)+'%';b.style.height=(rect[3]/viewport[3]*100)+'%';return b;
  }
  function validPointerClick(event){
    if(event.detail===0)return true;
    if(cancelPointerClick){cancelPointerClick=false;return false;}
    return !lastPointer || (!lastPointer.cancelled&&Math.hypot(event.clientX-lastPointer.x,event.clientY-lastPointer.y)<10);
  }
  function renderStage(){
    const p=page(),viewport=view==='page'?[0,0,p.width,p.height]:currentPanel.rect;
    const stage=$('art-stage'),img=$('page-image');
    img.style.opacity=book.overlayBubbles?'0':'1';
    stage.style.aspectRatio=`${viewport[2]} / ${viewport[3]}`;
    img.style.width=(p.width/viewport[2]*100)+'%';img.style.left=(-viewport[0]/viewport[2]*100)+'%';img.style.top=(-viewport[1]/viewport[3]*100)+'%';
    img.alt=view==='page'?`第 ${pageNumber} 页：${p.title}，第 ${p.panels[0].number} 至 ${p.panels.at(-1).number} 格漫画`:`第 ${currentPanel.number} 格漫画`;
    if(img.getAttribute('src')!==p.image){
      readyImage=false;stage.classList.add('is-loading');stage.classList.remove('image-error');$('image-status').hidden=false;$('image-status').textContent='正在打开漫画…';
      const token=++imageRequest;
      img.onload=()=>{if(token!==imageRequest)return;readyImage=true;stage.classList.remove('is-loading','image-error');$('image-status').hidden=true;};
      img.onerror=()=>{if(token!==imageRequest)return;readyImage=false;stage.classList.remove('is-loading');stage.classList.add('image-error');const retry=document.createElement('button');retry.textContent='重新加载图片';retry.onclick=()=>{img.removeAttribute('src');renderStage();};$('image-status').replaceChildren(document.createTextNode('漫画暂时没有打开，可以用右侧台词点读。'),retry);$('image-status').hidden=false;};
      img.src=p.image;
    }
    $('panel-hotspots').replaceChildren();$('bubble-hotspots').replaceChildren();
    $('panel-art').replaceChildren();
    for(const panel of p.panels){
      if(view==='panel'&&panel.number!==currentPanel.number)continue;
      if(book.overlayBubbles){
        const art=document.createElement('div'),r=panel.artRect,crop=panel.imageRect;
        art.className='panel-art';art.style.left=((r[0]-viewport[0])/viewport[2]*100)+'%';art.style.top=((r[1]-viewport[1])/viewport[3]*100)+'%';
        art.style.width=(r[2]/viewport[2]*100)+'%';art.style.height=(r[3]/viewport[3]*100)+'%';
        const illustration=document.createElement('img');illustration.src=p.image;illustration.alt='';illustration.draggable=false;
        illustration.style.width=(p.imageWidth/crop[2]*100)+'%';illustration.style.height=(p.imageHeight/crop[3]*100)+'%';
        illustration.style.left=(-crop[0]/crop[2]*100)+'%';illustration.style.top=(-crop[1]/crop[3]*100)+'%';
        art.append(illustration);$('panel-art').append(art);
      }
      const b=createHotspot(panel.rect,viewport,'panel-hotspot',`播放第 ${panel.number} 格${panel.ambient?'的画面声音':'完整原声'}`);b.dataset.panel=panel.number;
      b.addEventListener('click',e=>{if(readyImage&&validPointerClick(e))playPanel(panel);});$('panel-hotspots').append(b);
      for(const bubble of panel.bubbles){
        const target=createHotspot(bubble.visualRect||bubble.rect,viewport,'bubble-hotspot',`播放 ${bubble.speaker}：${bubble.text}`);target.dataset.bubble=bubble.id;
        if(book.overlayBubbles){
          target.classList.add('speech-bubble');
          if(bubble.bubbleImage){
            target.classList.add('illustrated-bubble');
            const lettering=document.createElement('img');lettering.src=bubble.bubbleImage;lettering.alt='';lettering.draggable=false;
            target.append(lettering);
          }else{target.textContent=bubble.displayText||bubble.text;}
          target.lang='en';target.style.fontSize=(bubble.fontSize/viewport[2]*100)+'cqw';
          if(!bubble.bubbleImage)target.style.borderWidth=(1.8/viewport[2]*100)+'cqw';
        }
        target.addEventListener('click',e=>{e.stopPropagation();if(readyImage&&validPointerClick(e))playBubble(bubble.id);});$('bubble-hotspots').append(target);
      }
    }
    syncHighlights();
  }
  function render(){
    $('chapter-index').textContent=`${String(pageNumber).padStart(2,'0')} / ${String(book.pages.length).padStart(2,'0')}`;$('chapter-title').textContent=page().title;
    $('page-select').value=pageNumber;$('prev-page').disabled=pageNumber===1;$('next-page').disabled=pageNumber===book.pages.length;
    $('view-page').setAttribute('aria-pressed',String(view==='page'));$('view-panel').setAttribute('aria-pressed',String(view==='panel'));
    for(const el of document.querySelectorAll('.page-item')){if(Number(el.dataset.page)===pageNumber)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');}
    renderStage();updateDetail();
  }
  async function begin(target,targetMode){
    const token=++request;clearTimeout(timeout);audio.pause();clip=target;mode=targetMode;
    audio.src=target.audio;audio.currentTime=0;audio.playbackRate=Number($('speed').value);audio.preservesPitch=true;
    $('seek').value=0;$('seek').disabled=true;$('elapsed').textContent='0:00';$('duration').textContent=time(target.duration);
    $('player-kind').textContent=`第 ${currentPanel.number} 格 · ${targetMode==='bubble'?'单句原声':currentPanel.ambient?'画面声音':'整格原声'}`;
    setStatus('loading','正在准备声音…');
    timeout=setTimeout(()=>{if(token===request&&status==='loading'){++request;audio.pause();setStatus('error','声音加载较慢，点击重试');}},8000);
    try{await audio.play();if(token!==request)return;clearTimeout(timeout);setStatus('playing',targetMode==='bubble'?target.text:`正在听第 ${currentPanel.number} 格`);}
    catch(error){if(token!==request)return;clearTimeout(timeout);setStatus('error',error.name==='NotAllowedError'?'请再点一下播放按钮':'这段声音暂时播放不了，点击重试');}
  }
  function playBubble(id){
    const found=bubbleMap.get(id);if(!found)return;
    const changed=found.panel.number!==currentPanel.number;currentPanel=found.panel;pageNumber=currentPanel.page;selectedBubble=found.bubble;
    if(changed&&view==='panel')render();else updateDetail();persist();history.replaceState(null,'',`#panel-${currentPanel.number}`);begin(found.bubble,'bubble');
  }
  function playPanel(panel=currentPanel){
    const changed=panel.number!==currentPanel.number;currentPanel=panel;pageNumber=panel.page;selectedBubble=panel.bubbles[0]||null;
    if(changed&&view==='panel')render();else updateDetail();persist();history.replaceState(null,'',`#panel-${panel.number}`);begin(panel,'panel');
  }
  async function resume(){
    if(!clip)return playPanel();
    const token=++request;setStatus('loading','正在继续…');
    timeout=setTimeout(()=>{if(token===request&&status==='loading'){++request;audio.pause();setStatus('error','声音加载较慢，点击重试');}},8000);
    try{await audio.play();if(token!==request)return;clearTimeout(timeout);setStatus('playing',mode==='bubble'?clip.text:`正在听第 ${currentPanel.number} 格`);}
    catch{if(token===request){clearTimeout(timeout);setStatus('error','这段声音暂时播放不了，点击重试');}}
  }
  $('play-toggle').onclick=()=>{
    if(status==='playing')pause();else if(status==='loading')pause('已取消加载，点击继续');else if(status==='paused')resume();else if(clip)begin(clip,mode);else playPanel();
  };
  $('replay-line').onclick=()=>selectedBubble?playBubble(selectedBubble.id):playPanel();
  $('prev-page').onclick=()=>turnPage(-1);$('next-page').onclick=()=>turnPage(1);
  $('prev-panel').onclick=()=>navigate(currentPanel.number-1);$('next-panel').onclick=()=>navigate(currentPanel.number+1);
  $('page-select').onchange=e=>navigate(book.pages[Number(e.target.value)-1].panels[0].number);
  for(const nextView of ['page','panel'])$('view-'+nextView).onclick=()=>{if(view===nextView)return;pause('阅读方式已切换，点击继续');view=nextView;render();persist();};
  $('outline-toggle').onclick=()=>{const active=$('art-stage').classList.toggle('show-outlines');$('outline-toggle').setAttribute('aria-pressed',String(active));};
  $('speed').onchange=()=>{audio.playbackRate=Number($('speed').value);persist();};
  $('seek').oninput=e=>{if(Number.isFinite(audio.duration)&&clip)audio.currentTime=audio.duration*Number(e.target.value)/1000;};
  audio.addEventListener('loadedmetadata',()=>{if(clip){$('duration').textContent=time(audio.duration);$('seek').disabled=false;}});
  audio.addEventListener('timeupdate',()=>{
    if(!clip)return;$('elapsed').textContent=time(audio.currentTime);if(audio.duration)$('seek').value=Math.round(audio.currentTime/audio.duration*1000);
    if(mode==='panel'){
      const sourceTime=clip.start+audio.currentTime;const bubble=currentPanel.bubbles.find(b=>sourceTime>=b.start&&sourceTime<b.end);
      if(bubble&&bubble.id!==selectedBubble?.id){selectedBubble=bubble;updateDetail();}
    }
  });
  audio.addEventListener('ended',()=>{clearTimeout(timeout);if(clip){setStatus('ended','听完啦，再点一下可以重听');$('seek').value=1000;}});
  audio.addEventListener('error',()=>{if(clip){clearTimeout(timeout);setStatus('error','这段声音暂时播放不了，点击重试');}});
  audio.addEventListener('pause',()=>{if(status==='playing'&&!audio.ended)setStatus('paused','已暂停，点击继续');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('已暂停，回来后点击继续');});
  window.addEventListener('orientationchange',()=>pause('屏幕已切换，点击继续'));
  window.matchMedia('(max-width: 899px)').addEventListener('change',()=>pause('布局已切换，点击继续'));
  window.addEventListener('hashchange',()=>{const n=Number(location.hash.match(/^#panel-(\d+)$/)?.[1]);if(n>=1&&n<=panels.length)navigate(n);});
  $('art-stage').addEventListener('pointerdown',e=>{if(!e.isPrimary){cancelPointerClick=true;if(lastPointer)lastPointer.cancelled=true;return;}lastPointer={x:e.clientX,y:e.clientY,cancelled:false};cancelPointerClick=false;});
  $('art-stage').addEventListener('pointermove',e=>{if(lastPointer&&Math.hypot(e.clientX-lastPointer.x,e.clientY-lastPointer.y)>10)lastPointer.cancelled=true;});
  $('art-stage').addEventListener('pointercancel',()=>{if(lastPointer)lastPointer.cancelled=true;cancelPointerClick=true;});
  $('art-stage').addEventListener('pointerleave',e=>{if(e.buttons&&lastPointer)lastPointer.cancelled=true;});
  document.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
    if(e.key==='Escape'){pause();return;}
    if(e.target.closest('.player-bar')&&e.key==='ArrowRight'){e.preventDefault();navigate(currentPanel.number+1);}
    if(e.target.closest('.player-bar')&&e.key==='ArrowLeft'){e.preventDefault();navigate(currentPanel.number-1);}
  });
  for(const p of book.pages){
    const button=document.createElement('button');button.type='button';button.className='page-item';button.dataset.page=p.number;button.setAttribute('aria-label',`第 ${p.number} 页：${p.title}`);
    const image=document.createElement('img');image.src=p.image;image.className='page-thumb';image.alt='';image.loading='lazy';
    const text=document.createElement('span');const index=document.createElement('small');index.textContent=`PAGE ${String(p.number).padStart(2,'0')}`;const title=document.createElement('strong');title.textContent=p.title;text.append(index,title);button.append(image,text);button.onclick=()=>navigate(p.panels[0].number);$('page-nav').append(button);
    const option=document.createElement('option');option.value=p.number;option.textContent=String(p.number).padStart(2,'0');$('page-select').append(option);
  }
  document.title=book.titleZh+' · Bluey 原声漫画';
  $('episode-label').textContent=book.episode==='S03E10'?'第三季 · 第 10 集':'第一季 · 第 1 集';
  $('book-title').replaceChildren(document.createTextNode(book.titleZh+' '));
  const englishTitle=document.createElement('span');englishTitle.textContent=book.title;$('book-title').append(englishTitle);
  $('total-pages').textContent=String(book.pages.length).padStart(2,'0');$('page-total').textContent=book.pages.length;
  for(const item of window.COMIC_LIBRARY||[book]){
    const link=document.createElement('a');link.href='?episode='+item.episode.toLowerCase();
    link.className='episode-card';if(item.episode===book.episode)link.setAttribute('aria-current','true');
    const badge=document.createElement('small');badge.textContent=item.episode;
    const name=document.createElement('strong');name.textContent=item.titleZh;
    const detail=document.createElement('span');detail.textContent=item.title+' · '+item.pages.length+' 页';
    link.append(badge,name,detail);link.addEventListener('click',()=>{persist();audio.pause();});$('episode-shelf').append(link);
  }
  render();persist();
})();
