Page({
  onShow() { const app=getApp(); if(app.player) app.player.stop(); },
  onShareAppMessage() { return {title:'英语复习小花园 · 复习英语，点读 Bluey',path:'/pages/index/index'}; }
});
