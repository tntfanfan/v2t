const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {AudioPlayer} = require('../src/lib/audio-player');
const reading = require('../src/lib/reading');
const book = {pages: Array.from({length:9}, (_,i)=>require('../src/chapters/p'+String(i+1).padStart(2,'0')+'/data'))};
const clip = book.pages[0].panels[0].bubbles[0];

function fakeRuntime() {
  const contexts = [], timers = new Map(), storage = new Map(), redirects = [], toasts = [];
  let sequence = 0;
  const api = {
    getStorageSync: key => storage.get(key), setStorageSync: (key, value) => storage.set(key, JSON.parse(JSON.stringify(value))),
    pageScrollTo() {}, showToast(value) { toasts.push(value); },
    redirectTo(options) { redirects.push(options); }, reLaunch(options) { redirects.push(options); },
    createInnerAudioContext() {
      const handlers = {};
      const context = {
        handlers, duration: 10, currentTime: 0, paused: true, destroyed: false, calls: [],
        emit(event, value) { if (handlers[event]) handlers[event](value); },
        play() { this.calls.push('play'); }, pause() { this.calls.push('pause'); this.paused = true; this.emit('Pause'); },
        stop() { this.calls.push('stop'); }, destroy() { this.calls.push('destroy'); this.destroyed = true; },
        seek(value) { this.calls.push(['seek', value]); this.currentTime = value; }
      };
      for (const event of ['Play','Canplay','Pause','Waiting','Ended','TimeUpdate','Error']) context['on' + event] = fn => { handlers[event] = fn; };
      contexts.push(context); return context;
    }
  };
  const player = new AudioPlayer(api, {setTimeout: fn => { timers.set(++sequence, fn); return sequence; }, clearTimeout: id => timers.delete(id)});
  return {api, player, contexts, timers, storage, redirects, toasts};
}
function pageInstance(pageNumber, runtime, saved) {
  const catalog = {chapters: book.pages.map(p => ({number: p.number, label: String(p.number).padStart(2, '0'), title: p.title}))};
  const filename = path.resolve(__dirname, '../src/lib/reader-page.js');
  const sandbox = {module: {exports: {}}, require: name => name === '../data/library' ? require('../src/data/library') : reading, wx: runtime.api, getApp: () => ({player: runtime.player})};
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox);
  const definition = sandbox.module.exports.readerPage(book.pages[pageNumber - 1]);
  const page = Object.assign({}, definition, {data: JSON.parse(JSON.stringify(definition.data))});
  page.setData = (change, done) => { Object.assign(page.data, JSON.parse(JSON.stringify(change))); if (done) done(); };
  if (saved) reading.writeProgress(runtime.api, saved);
  page.onLoad({panel: String((pageNumber - 1) * 6 + 1)});
  return page;
}

test('all chapter routes stay within 1–54 and page boundaries', () => {
  for (let n = 1; n <= 54; n++) {
    const p = reading.panelPage(n);
    assert.equal(reading.chapterUrl(p, n), '/chapters/p' + String(p).padStart(2, '0') + '/index?panel=' + n);
  }
  assert.equal(reading.chapterUrl(99, 999), '/chapters/p09/index?panel=54');
  assert.equal(reading.chapterUrl(-2, -30), '/chapters/p01/index?panel=1');
});
test('malformed saved data is sanitized and storage failures are recoverable', () => {
  assert.deepEqual(reading.cleanProgress({panel: '4', speed: 100, view: 'garbage', started: 'yes'}), {panel: 1, speed: 1, view: 'panel', started: false});
  const bad = {getStorageSync() { throw Error(); }, setStorageSync() { throw Error(); }};
  assert.equal(reading.readProgress(bad).panel, 1);
  assert.equal(reading.writeProgress(bad, {panel: 3}), false);
});
test('all 54 crops keep original bubble geometry inside the frame', () => {
  for (const chapter of book.pages) for (const panel of chapter.panels) {
    const stage = reading.stageFor(chapter, panel, 'panel');
    assert.equal(stage.panelSpots.length, 1);
    assert.equal(stage.panelSpots[0].style, 'left:0%;top:0%;width:100%;height:100%;');
    assert.equal(stage.bubbleSpots.length, panel.bubbles.length);
    for (const b of panel.bubbles) {
      assert.ok(b.rect[0] >= panel.rect[0] && b.rect[1] >= panel.rect[1]);
      assert.ok(b.rect[0] + b.rect[2] <= panel.rect[0] + panel.rect[2] + 2);
      assert.ok(b.rect[1] + b.rect[3] <= panel.rect[1] + panel.rect[3] + 2);
    }
  }
});
test('playing a new clip destroys the old context and ignores late events', () => {
  const r = fakeRuntime();
  r.player.play(clip, 'bubble', 1, 1); const a = r.contexts[0];
  a.emit('Play'); assert.equal(r.player.state.status, 'playing');
  const next = book.pages[0].panels[0].bubbles[1];
  r.player.play(next, 'bubble', 1, 0.75); const b = r.contexts[1];
  assert.equal(a.destroyed, true); assert.equal(b.playbackRate, 0.75);
  a.emit('Error'); a.emit('Ended'); a.emit('Play'); a.emit('TimeUpdate');
  assert.equal(r.player.state.clip.id, next.id); assert.equal(r.player.state.status, 'loading');
  b.emit('Play'); assert.equal(r.player.state.status, 'playing'); assert.equal(r.timers.size, 0);
  assert.equal(r.contexts.filter(c => !c.destroyed).length, 1);
});
test('pausing during loading rejects a delayed native play event', () => {
  const r = fakeRuntime(); r.player.play(clip, 'bubble', 1, 1); const c = r.contexts[0];
  r.player.pause('后台暂停'); c.emit('Play');
  assert.equal(r.player.state.status, 'paused'); assert.equal(r.player.wantsPlay, false);
  assert.equal(c.calls.at(-1), 'pause'); assert.equal(r.timers.size, 0);
  r.player.resume(1.25); c.emit('Play'); assert.equal(r.player.state.status, 'playing'); assert.equal(c.playbackRate, 1.25);
});
test('loading timeout releases audio and retry creates a fresh context', () => {
  const r = fakeRuntime(); r.player.play(clip, 'bubble', 1, 1);
  [...r.timers.values()][0]();
  assert.equal(r.player.state.status, 'error'); assert.equal(r.contexts[0].destroyed, true);
  r.player.resume(1); assert.equal(r.contexts.length, 2); assert.equal(r.player.state.status, 'loading');
});
test('seeking is clamped and seeking after the end allows resume at that point', () => {
  const r = fakeRuntime(); r.player.play(clip, 'bubble', 1, 1); const c = r.contexts[0]; c.emit('Canplay'); c.emit('Play');
  r.player.seek(1.2); assert.equal(c.currentTime, 10);
  c.emit('Ended'); r.player.seek(.4); assert.equal(c.currentTime, 4); assert.equal(r.player.state.status, 'paused');
  r.player.resume(1); assert.equal(r.contexts.length, 1); assert.equal(c.currentTime, 4);
});
test('old page disposal cannot stop a newly attached page', () => {
  const r = fakeRuntime(); const detachOld = r.player.attach(() => {});
  const newer = () => {}; r.player.attach(newer); r.player.play(clip, 'bubble', 1, 1);
  detachOld(); assert.equal(r.player.listener, newer); assert.equal(r.contexts[0].destroyed, false);
});
test('reader restores mode and speed, changes position, and preserves original notes', () => {
  const r = fakeRuntime(); const p = pageInstance(1, r, {panel: 4, view: 'page', speed: .75, started: true});
  assert.equal(p.data.view, 'page'); assert.equal(p.data.speedIndex, 0);
  p.nextPanel(); assert.equal(p.data.current.number, 2); assert.equal(reading.readProgress(r.api).panel, 2);
  for (const chapter of book.pages) for (const panel of chapter.panels) for (const bubble of panel.bubbles.filter(b => b.note)) {
    const page = pageInstance(chapter.number, r); page.playBubble(bubble.id); assert.equal(page.data.selected.note, bubble.note); page.onUnload();
  }
});
test('cross-chapter navigation is bounded, debounced and retryable after failure', () => {
  const r = fakeRuntime(); const p = pageInstance(1, r);
  p.previousPanel(); assert.equal(r.redirects.length, 0);
  p.goToPanel(6); p.nextPanel(); p.nextPanel();
  assert.equal(r.redirects.length, 1); assert.equal(r.redirects[0].url, '/chapters/p02/index?panel=7');
  r.redirects[0].fail(); p.nextPanel(); assert.equal(r.redirects.length, 2);
  const last = pageInstance(9, r); last.goToPanel(54); last.nextPanel(); assert.equal(r.redirects.length, 2);
});
test('mode switch and hiding pause; panel navigation stops audio', () => {
  const r = fakeRuntime(); const p = pageInstance(1, r); p.playPanel(); r.contexts[0].emit('Play');
  p.switchView({currentTarget: {dataset: {view: 'page'}}}); assert.equal(r.player.state.status, 'paused');
  p.togglePlay(); r.contexts[0].emit('Play'); p.onHide(); assert.equal(r.player.state.status, 'paused');
  p.nextPanel(); assert.equal(r.player.state.clip, null); assert.equal(r.contexts[0].destroyed, true);
});
test('ambient panels still play full original audio with no invented dialogue', () => {
  const r = fakeRuntime();
  for (const number of [22, 45]) {
    const p = pageInstance(reading.panelPage(number), r); p.goToPanel(number);
    assert.equal(p.data.lines.length, 0); assert.equal(p.data.selected, null);
    p.replayLine(); assert.equal(r.player.state.clip.number, number); assert.equal(r.player.state.mode, 'panel');
    p.onUnload();
  }
});
test('scrolling over artwork cannot accidentally start audio', () => {
  const r = fakeRuntime(); const p = pageInstance(1, r); p.imageLoaded();
  p.touchStart({touches: [{clientX: 20, clientY: 20}]}); p.touchMove({touches: [{clientX: 20, clientY: 90}]});
  p.tapPanel({currentTarget: {dataset: {panel: 1}}}); assert.equal(r.contexts.length, 0);
  p.touchStart({touches: [{clientX: 20, clientY: 20}]}); p.tapPanel({currentTarget: {dataset: {panel: 1}}}); assert.equal(r.contexts.length, 1);
});
test('time synchronization highlights the matching bubble during whole-panel playback', () => {
  const r = fakeRuntime(); const p = pageInstance(1, r); p.playPanel(); const c = r.contexts[0]; c.emit('Play');
  c.currentTime = book.pages[0].panels[0].bubbles[1].start - book.pages[0].panels[0].start + .1; c.emit('TimeUpdate');
  assert.equal(p.data.selectedId, book.pages[0].panels[0].bubbles[1].id);
});

