const {catalog,Memory,read,Island}=require('../../lib/adventure/engine');
Page({
 data:{units:[],stars:0},
 onShow(){getApp().player.stop();this.refresh();this.timer=setInterval(()=>this.refresh(),60000);},
 onHide(){clearInterval(this.timer);},
 onUnload(){clearInterval(this.timer);},
 refresh(){const {state}=read(wx);this.setData({islandSummary:Island.summary(state,catalog),stars:state.progress.reduce((n,p)=>n+p.stars,0),units:catalog.map((u,i)=>({...u,...Memory.summary(state.progress[i],u.words)}))});},
 choose(event){const id=Number(event.currentTarget.dataset.unit);if(catalog[id])wx.navigateTo({url:`/english/u${id}/home/index`});},
 onShareAppMessage(){return {title:'英语星球冒险 · U0–U9',path:'/pages/english/index'};}
});
