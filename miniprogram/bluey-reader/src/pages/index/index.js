const catalog = require('../../data/catalog');
const { readProgress, chapterUrl, panelPage } = require('../../lib/reading');

Page({
  data: {catalog, saved: {panel: 1, started: false}, progressPercent: 0, opening: false},
  onShow() {
    this._opening = false;
    const saved = readProgress(wx);
    this.setData({saved, opening: false, progressPercent: Math.round(saved.panel / 54 * 100)});
  },
  openPanel(panel) {
    if (this._opening) return;
    this._opening = true;
    this.setData({opening: true});
    wx.navigateTo({
      url: chapterUrl(panelPage(panel), panel),
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
    wx.showModal({title: '关于这本漫画', content: '沿用现有 S01E01 网页 v4：9 页漫画、54 格、115 个气泡和 169 段视频原声。图片为漫画改编，台词与角色沿用既有核对数据。个别原稿待核标注仍保留，音频切点尚未逐句完成听审。\n\n这是家庭学习项目，不是 Bluey 官方小程序。', showCancel: false, confirmText: '知道啦'});
  }
});
