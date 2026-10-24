const createPage=require('../src/lib/adventure/page');
function makePage(unit=0,view='home',store=new Map()){
 const api={getStorageSync:k=>store.get(k),setStorageSync:(k,v)=>store.set(k,JSON.parse(JSON.stringify(v))),navigateTo(o){this.lastRoute=o.url;},redirectTo(o){this.lastRoute=o.url;},pageScrollTo(){},showToast(){},showModal(o){this.modal=o;}};
 const player={state:{status:'idle'},attach(fn){this.listener=fn;fn(this.state);return ()=>{this.listener=null;};},stop(){this.state={status:'idle'};this.listener?.(this.state);},play(clip,mode,panel,speed){this.state={status:'playing',clip,currentTime:0,duration:10};this.lastSpeed=speed;this.listener?.(this.state);},pause(){this.state.status='paused';this.listener?.(this.state);},resume(speed){this.lastSpeed=speed;this.state.status='playing';this.listener?.(this.state);},seek(fraction){this.lastSeek=fraction;},setSpeed(speed){this.lastSpeed=speed;}};
 global.getApp=()=>({player});
 const definition=createPage(view,require('../src/english/u'+unit+'/data'),api),page={...definition,data:JSON.parse(JSON.stringify(definition.data)),setData(data){Object.assign(this.data,data);}};
 page.onLoad();page.onShow();return {page,api,player,store};
}
module.exports={makePage};
