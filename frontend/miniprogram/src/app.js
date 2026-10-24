const { AudioPlayer } = require('./lib/audio-player');

App({
  onLaunch() {
    this.player = new AudioPlayer(wx);
    if (wx.onAudioInterruptionBegin) {
      wx.onAudioInterruptionBegin(() => this.player.pause('声音被暂时打断，点继续即可'));
    }
  },
  onHide() {
    if (this.player) this.player.pause('已暂停，回来后点继续');
  }
});
