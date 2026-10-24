const {getBook} = require('../data/library');
const {SPEEDS, readProgress, writeProgress, chapterUrl, panelPage, time, stageFor, activeBubble} = require('./reading');

function readerPage(chapter) {
  const catalog = getBook(chapter.episode);
  return {
    data: {
      chapter, catalog, pageIndex: chapter.number - 1, pageLabels: catalog.chapters.map(p => p.label + ' · ' + p.title),
      current: chapter.panels[0], selectedId: '', selected: null, lines: [], view: 'panel', outlines: false,
      readyImage: false, imageError: false, imageVisible: true, stageRatio: 100, imageStyle: '', panelSpots: [], bubbleSpots: [],
      speedIndex: 1, speeds: ['0.75×', '1.0×', '1.25×'], status: 'idle', playLabel: '听这一格', playSymbol: '▶',
      playerMessage: '点气泡听一句，点画面听整格', playerKind: '视频原声', elapsed: '0:00', duration: '0:00', seek: 0,
      canSeek: false, hasClip: false, audioMode: 'panel', storageAvailable: true, navigating: false
    },
    onLoad(options) {
      this._saved = readProgress(wx, catalog);
      this._speed = this._saved.speed;
      const requested = Math.floor(Number(options && options.panel));
      const panel = chapter.panels.find(p => p.number === requested) || chapter.panels[0];
      this._player = getApp().player;
      this._listener = state => this.onAudioState(state);
      this.setData({view: this._saved.view, speedIndex: SPEEDS.indexOf(this._speed)});
      this._detachPlayer = this._player.attach(this._listener);
      this.selectPanel(panel, false);
    },
    onHide() {
      if (this.ownsPlayer()) this._player.pause('已暂停，回来后点继续');
      this.persist();
    },
    onUnload() {
      if (this._detachPlayer) this._detachPlayer();
      this._unloaded = true;
    },
    onResize() { if (this.ownsPlayer()) this._player.pause('屏幕已切换，点继续接着听'); },
    ownsPlayer() { return this._player && this._player.listener === this._listener; },
    persist() {
      if (!this._current) return;
      const ok = writeProgress(wx, {panel: this._current.number, view: this.data.view, speed: this._speed, started: true}, catalog);
      if (!this._unloaded && this.data.storageAvailable !== ok) this.setData({storageAvailable: ok});
    },
    selectPanel(panel, stop) {
      if (!panel) return;
      if (stop !== false && this.ownsPlayer()) this._player.stop();
      this._current = panel;
      this._selected = panel.bubbles[0] || null;
      this.renderPanel();
      this.persist();
    },
    renderPanel() {
      const selected = this._selected;
      this.setData(Object.assign({
        current: this._current, selectedId: selected ? selected.id : '', selected,
        lines: this._current.bubbles, playerKind: '第 ' + this._current.number + ' 格 · 视频原声'
      }, stageFor(chapter, this._current, this.data.view)));
    },
    imageLoaded() { this.setData({readyImage: true, imageError: false}); },
    imageFailed() { this.setData({readyImage: false, imageError: true}); },
    retryImage() {
      this.setData({imageVisible: false, imageError: false, readyImage: false}, () => {
        if (!this._unloaded) this.setData({imageVisible: true});
      });
    },
    touchStart(event) {
      const point = event.touches && event.touches[0];
      this._touch = point ? {x: point.clientX, y: point.clientY, moved: event.touches.length !== 1} : null;
    },
    touchMove(event) {
      const point = event.touches && event.touches[0];
      if (this._touch && point && (event.touches.length !== 1 || Math.hypot(point.clientX - this._touch.x, point.clientY - this._touch.y) > 12)) this._touch.moved = true;
    },
    touchCancel() { if (this._touch) this._touch.moved = true; },
    validTap() { return !this._touch || !this._touch.moved; },
    tapPanel(event) {
      if (!this.data.readyImage || !this.validTap()) return;
      this.playPanel(chapter.panels.find(p => p.number === Number(event.currentTarget.dataset.panel)));
    },
    tapBubble(event) {
      if (!this.data.readyImage || !this.validTap()) return;
      this.playBubble(event.currentTarget.dataset.id);
    },
    tapLine(event) { this.playBubble(event.currentTarget.dataset.id); },
    playBubble(id) {
      const panel = chapter.panels.find(p => p.bubbles.some(b => b.id === id));
      if (!panel) return;
      this._current = panel;
      this._selected = panel.bubbles.find(b => b.id === id);
      this.renderPanel(); this.persist();
      this._player.play(this._selected, 'bubble', panel.number, this._speed);
    },
    playPanel(panel) {
      panel = panel || this._current;
      if (!panel) return;
      this.selectPanel(panel, false);
      this._player.play(panel, 'panel', panel.number, this._speed);
    },
    replayLine() { if (this._selected) this.playBubble(this._selected.id); else this.playPanel(); },
    togglePlay() {
      const state = this._player.state;
      if (['playing', 'loading'].includes(state.status)) this._player.pause();
      else if (state.clip) this._player.resume(this._speed);
      else this.playPanel();
    },
    onAudioState(state) {
      if (this._unloaded) return;
      const labels = {idle: '听这一格', loading: '取消加载', playing: '暂停', paused: '继续', ended: '再听一次', error: '重试播放'};
      const change = {
        status: state.status, playLabel: labels[state.status], playSymbol: state.status === 'playing' ? 'Ⅱ' : state.status === 'loading' ? '×' : '▶',
        playerMessage: state.message, elapsed: time(state.currentTime), duration: time(state.duration), hasClip: !!state.clip,
        canSeek: !!state.clip && !!this._player.context && ['playing','paused','ended'].includes(state.status), audioMode: state.mode
      };
      if (!this._seeking) change.seek = state.duration ? Math.round(Math.max(0, Math.min(1, state.currentTime / state.duration)) * 1000) : 0;
      if (state.clip) change.playerKind = '第 ' + state.panel + ' 格 · ' + (state.mode === 'bubble' ? '单句原声' : this._current && this._current.ambient ? '画面声音' : '整格原声');
      if (state.clip && state.mode === 'panel' && this._current && state.panel === this._current.number) {
        const bubble = activeBubble(this._current, state.currentTime);
        if (bubble && (!this._selected || bubble.id !== this._selected.id)) {
          this._selected = bubble; change.selected = bubble; change.selectedId = bubble.id;
        }
      }
      this.setData(change);
    },
    seekChanging(event) { this._seeking = true; this.setData({elapsed: time(this._player.state.duration * event.detail.value / 1000)}); },
    seekChanged(event) { this._seeking = false; this._player.seek(Number(event.detail.value) / 1000); },
    speedChanged(event) {
      const index = Number(event.detail.value);
      this._speed = SPEEDS[index] || 1;
      this.setData({speedIndex: SPEEDS.indexOf(this._speed)});
      this._player.setSpeed(this._speed); this.persist();
    },
    switchView(event) {
      const view = event.currentTarget.dataset.view;
      if (!['page', 'panel'].includes(view) || view === this.data.view) return;
      this._player.pause('阅读方式已切换，点继续接着听');
      this.setData({view}); this.renderPanel(); this.persist();
    },
    toggleOutlines() { this.setData({outlines: !this.data.outlines}); },
    goToPanel(number) {
      if (number < 1 || number > catalog.panelCount || this._navigating) return;
      if (panelPage(number, catalog) === chapter.number) {
        this.selectPanel(chapter.panels.find(p => p.number === number));
        wx.pageScrollTo({scrollTop: 0, duration: 0});
        return;
      }
      this._navigating = true;
      this.setData({navigating: true});
      this._player.stop();
      wx.redirectTo({url: chapterUrl(panelPage(number, catalog), number, catalog), fail: () => {
        this._navigating = false; this.setData({navigating: false});
        wx.showToast({title: '下一页没有打开，请再试一次', icon: 'none'});
      }});
    },
    previousPanel() { this.goToPanel(this._current.number - 1); },
    nextPanel() { this.goToPanel(this._current.number + 1); },
    previousPage() { this.goToPanel((chapter.number - 2) * 6 + 1); },
    nextPage() { this.goToPanel(chapter.number * 6 + 1); },
    choosePage(event) { this.goToPanel(Number(event.detail.value) * 6 + 1); },
    openCatalog() {
      if (this._navigating) return;
      this._player.stop();
      wx.reLaunch({url: '/pages/bluey/index' + (chapter.episode === 'S03E10' ? '?episode=S03E10' : ''), fail: () => wx.showToast({title: '请用左上角返回目录', icon: 'none'})});
    },
    previewImage() {
      if(chapter.overlayBubbles){this.switchView({currentTarget:{dataset:{view:'page'}}});wx.pageScrollTo({scrollTop:0,duration:0});return;}
      this._player.pause('看完大图后，点继续接着听');
      wx.getImageInfo({src: chapter.image, success: result => {
        if (!this._unloaded) wx.previewImage({current: result.path, urls: [result.path], showmenu: false});
      }, fail: () => wx.showToast({title: '大图暂时没打开，可以继续一格看', icon: 'none'})});
    }
  };
}
module.exports = {readerPage};
