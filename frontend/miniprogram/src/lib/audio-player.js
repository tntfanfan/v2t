// At most one live audio context. A new clip destroys the previous context;
// identity checks prevent delayed native events from changing the new clip.
class AudioPlayer {
  constructor(api, timers) {
    this.api = api;
    this.timers = timers || { setTimeout, clearTimeout };
    this.context = null;
    this.listener = null;
    this.timer = null;
    this.wantsPlay = false;
    this.state = this.emptyState();
  }
  emptyState() {
    return {status: 'idle', message: '点气泡听一句，点画面听整格', clip: null, mode: 'panel', panel: 1, currentTime: 0, duration: 0};
  }
  attach(listener) {
    this.stop();
    this.listener = listener;
    this.emit();
    return () => {
      if (this.listener === listener) { this.listener = null; this.stop(); }
    };
  }
  emit(change) {
    if (change) Object.assign(this.state, change);
    if (this.listener) this.listener(Object.assign({}, this.state));
  }
  clearTimer() {
    if (this.timer !== null) this.timers.clearTimeout(this.timer);
    this.timer = null;
  }
  release() {
    this.clearTimer();
    this.wantsPlay = false;
    const previous = this.context;
    this.context = null;
    if (previous) { try { previous.stop(); } catch (_) {} try { previous.destroy(); } catch (_) {} }
  }
  stop(message) {
    this.release();
    this.state = this.emptyState();
    if (message) this.state.message = message;
    this.emit();
  }
  fail(message) {
    this.release();
    this.emit({ status: 'error', message: message || '这段声音暂时没播出来，点重试再听一次' });
  }
  armTimeout(context) {
    this.clearTimer();
    this.timer = this.timers.setTimeout(() => {
      if (this.context === context && this.wantsPlay) this.fail('声音准备得有点久，点重试再听一次');
    }, 10000);
  }
  play(clip, mode, panel, speed) {
    this.release();
    this.state = {status: 'loading', message: '正在准备声音…', clip, mode, panel, currentTime: 0, duration: clip.duration || 0};
    this.emit();
    try {
      const context = this.api.createInnerAudioContext({useWebAudioImplement: false});
      this.context = context;
      this.wantsPlay = true;
      const active = () => this.context === context;
      context.autoplay = false;
      context.loop = false;
      context.playbackRate = speed;
      context.onPlay(() => {
        if (!active()) return;
        if (!this.wantsPlay) { context.pause(); return; }
        this.clearTimer();
        this.emit({status: 'playing', message: mode === 'bubble' ? clip.text : '正在听第 ' + panel + ' 格'});
      });
      context.onCanplay(() => {
        if (active() && Number.isFinite(context.duration) && context.duration > 0) this.emit({duration: context.duration});
      });
      context.onTimeUpdate(() => {
        if (!active()) return;
        if (this.wantsPlay && this.state.status === 'loading') {
          this.clearTimer();
          this.state.status = 'playing';
          this.state.message = mode === 'bubble' ? clip.text : '正在听第 ' + panel + ' 格';
        }
        this.emit({currentTime: context.currentTime || 0, duration: context.duration || clip.duration});
      });
      context.onPause(() => {
        if (active() && this.state.status !== 'error' && this.state.status !== 'ended') {
          this.wantsPlay = false;
          this.clearTimer();
          this.emit({status: 'paused'});
        }
      });
      context.onWaiting(() => {
        if (active() && this.wantsPlay) { this.emit({status: 'loading', message: '正在准备声音…'}); this.armTimeout(context); }
      });
      context.onEnded(() => {
        if (!active()) return;
        this.clearTimer();
        this.wantsPlay = false;
        this.emit({status: 'ended', message: '听完啦，再点一下可以重听', currentTime: context.duration || clip.duration});
      });
      context.onError(() => { if (active()) this.fail(); });
      context.src = clip.audio;
      this.armTimeout(context);
      context.play();
    } catch (_) { this.fail(); }
  }
  pause(message) {
    if (!['playing', 'loading'].includes(this.state.status)) return;
    this.wantsPlay = false;
    this.clearTimer();
    this.emit({status: 'paused', message: message || '已暂停，点继续接着听'});
    if (this.context) { try { this.context.pause(); } catch (_) { this.fail(); } }
  }
  resume(speed) {
    if (!this.state.clip) return;
    if (!this.context || ['error', 'ended'].includes(this.state.status)) {
      this.play(this.state.clip, this.state.mode, this.state.panel, speed); return;
    }
    this.wantsPlay = true;
    this.emit({status: 'loading', message: '正在继续…'});
    this.armTimeout(this.context);
    try { this.context.playbackRate = speed; this.context.play(); } catch (_) { this.fail(); }
  }
  setSpeed(speed) {
    if (this.context) { try { this.context.playbackRate = speed; } catch (_) {} }
  }
  seek(fraction) {
    if (!this.context || !this.state.clip) return;
    const seconds = Math.max(0, Math.min(1, fraction)) * this.state.duration;
    try {
      this.context.seek(seconds);
      this.emit(Object.assign({currentTime: seconds}, this.state.status === 'ended' ? {status: 'paused', message: '已选好位置，点继续接着听'} : {}));
    } catch (_) { this.fail(); }
  }
}
module.exports = { AudioPlayer };
