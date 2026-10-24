const {getBook,books} = require('../../data/library');
const catalog=getBook('S01E01');
const { readProgress, chapterUrl, panelPage } = require('../../lib/reading');

Page({
  data: {catalog, books, saved: {panel: 1, started: false}, progressPercent: 0, opening: false},
  onLoad(options){this.setData({catalog:getBook(options&&options.episode)});},
  chooseBook(event){getApp().player.stop();wx.redirectTo({url:'/pages/bluey/index?episode='+event.currentTarget.dataset.episode});},
  onShareAppMessage() { return {title:'Bluey 原声漫画 · '+this.data.catalog.titleZh,path:'/pages/bluey/index'+(this.data.catalog.episode==='S03E10'?'?episode=S03E10':'')}; },
  onShow() {
    this._opening = false;
    const saved = readProgress(wx,this.data.catalog);
    this.setData({saved, opening: false, progressPercent: Math.round(saved.panel / this.data.catalog.panelCount * 100)});
  },
  openPanel(panel) {
    if (this._opening) return;
    this._opening = true;
    this.setData({opening: true});
    wx.navigateTo({
      url: chapterUrl(panelPage(panel,this.data.catalog), panel,this.data.catalog),
      fail: () => { wx.showToast({title: '这一页还没打开，请再试一次', icon: 'none'}); },
      complete: () => { this._opening = false; this.setData({opening: false}); }
    });
  },
  continueReading() { this.openPanel(this.data.saved.panel); },
  startReading() { this.openPanel(1); },
  chooseChapter(event) { this.openPanel(Number(event.currentTarget.dataset.first)); },
  showGuide() {
    wx.showModal({title: '一起看，一起听', content: '先点漫画气泡听一句，再自己跟读。也可以点画面听整格。整页看时，点右上方切换“一格看”可以放大。\n\n阅读位置、模式和速度只保存在本机。声音随漫画打包；首次进入新章节需要微信下载对应分包。', showCancel: false, confirmText: '知道啦'});
  },
  showAbout() {
    wx.showModal({title: '关于这本漫画', content: this.data.catalog.titleZh+'：'+this.data.catalog.pageCount+' 页漫画，'+this.data.catalog.panelCount+' 格。点气泡听单句，点画面听整格，声音来自原视频。个别说话人待核标注保留，部分切点尚待逐句听审。\n\n家庭学习项目，非 Bluey 官方小程序。', showCancel: false, confirmText: '知道啦'});
  }
});
