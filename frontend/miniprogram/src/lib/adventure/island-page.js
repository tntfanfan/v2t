const {read,KEY,catalog,Memory,Island}=require('./engine');
module.exports=api=>({
 data:{view:'home',keyboard:[...'abcdefghijklmnopqrstuvwxyz']},
 onLoad(){this.view='home';this.readyUnits=new Set();this.mediaToken=0;},
 onShow(){this.active=true;this.state=read(api).state;this.player=getApp().player;this.refresh();if(this.view==='game')this.prepareWord();clearInterval(this.timer);this.timer=setInterval(()=>{if(this.view==='home')this.refresh();},60000);},
 onHide(){this.active=false;this.mediaToken++;clearInterval(this.timer);this.player?.stop();},
 onUnload(){this.onHide();},
 onShareAppMessage(){return {title:'回忆岛 · 和单词老朋友见面',path:'/pages/island/index'};},
 save(){try{const latest=api.getStorageSync(KEY);if(latest&&latest.resetId!==this.state.resetId){this.state=read(api).state;this.view='home';this.refresh();return false;}api.setStorageSync(KEY,JSON.parse(JSON.stringify(this.state)));return true;}catch{api.showToast({title:'进度没有保存，请稍后重试',icon:'none'});return false;}},
 refresh(){
  const s=Island.summary(this.state,catalog),session=this.state.island,q=Island.current(this.state);
  const nextLabel=s.next!==null?Memory.dayLabel(s.next):'';
  const word=q?catalog[q.unit].words.find(w=>w.w===q.wordKey):null;
  this.setData({view:this.view,summary:s,nextLabel,wordCount:this.state.dailyWordCount,hasRound:!!session&&!session.committed,intervals:Memory.INTERVALS,q:q?{...q,word,ready:this.readyUnits.has(q.unit),nextLabel:q.nextDue!==undefined?Memory.dayLabel(q.nextDue):'',number:session.index+1,total:session.items.length}:null,reward:session?.items.length||0,mediaError:this.mediaError||''});
 },
 home(){this.player.stop();this.view='home';this.refresh();},
 base(){this.player.stop();api.reLaunch({url:'/pages/english/index'});},
 start(){this.player.stop();if(!Island.start(this.state,catalog)){this.view='home';this.refresh();return;}this.view='game';this.save();this.refresh();this.prepareWord();},
 prepareWord(){
  const q=Island.current(this.state);if(!q||this.readyUnits.has(q.unit))return;
  const token=++this.mediaToken;this.mediaError='';
  const done=()=>{if(!this.active||token!==this.mediaToken)return;this.readyUnits.add(q.unit);this.mediaError='';this.refresh();};
  if(!api.loadSubpackage){done();return;}
  api.loadSubpackage({name:'englishUnit'+q.unit,success:done,fail:()=>{if(!this.active||token!==this.mediaToken)return;this.mediaError='图片没准备好，点一下重试。';this.refresh();}});
 },
 input(e){const q=Island.current(this.state);if(q&&!q.solved){q.draft=e.detail.value.slice(0,60);this.save();}},
 key(e){const q=Island.current(this.state);if(!q||q.solved)return;const key=e.currentTarget.dataset.key;q.draft=key==='delete'?q.draft.slice(0,-1):(q.draft+(key==='space'?' ':key)).slice(0,60);this.save();this.refresh();},
 answer(){if(this.view!=='game')return;this.player.stop();Island.answer(this.state,catalog);this.save();this.refresh();},
 hint(){Island.hint(this.state);this.save();this.refresh();},
 cover(){const q=Island.current(this.state);if(q)q.reveal=false;this.save();this.refresh();},
 listen(){const q=Island.current(this.state);if(!q||q.solved||!this.readyUnits.has(q.unit))return;q.helped=true;this.save();const word=catalog[q.unit].words.find(w=>w.w===q.wordKey);this.player.play({audio:word.audio,text:word.w},'bubble',1,1);},
 next(){if(!Island.next(this.state))return;this.player.stop();this.view=this.state.island.committed?'result':'game';this.save();this.refresh();if(this.view==='game')this.prepareWord();api.pageScrollTo({scrollTop:0,duration:0});}
});
