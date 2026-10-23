const STORAGE_KEY = 'bluey-comic-wechat-s01e01-v1';
const SPEEDS = [0.75, 1, 1.25];

function cleanProgress(value) {
  const saved = value && typeof value === 'object' ? value : {};
  return {
    panel: Number.isInteger(saved.panel) && saved.panel >= 1 && saved.panel <= 54 ? saved.panel : 1,
    view: saved.view === 'page' ? 'page' : 'panel',
    speed: SPEEDS.includes(saved.speed) ? saved.speed : 1,
    started: saved.started === true
  };
}
function readProgress(api) {
  try { return cleanProgress(api.getStorageSync(STORAGE_KEY)); }
  catch (_) { return cleanProgress(null); }
}
function writeProgress(api, value) {
  try { api.setStorageSync(STORAGE_KEY, cleanProgress(value)); return true; }
  catch (_) { return false; }
}
function panelPage(number) {
  return Math.floor((Math.min(54, Math.max(1, Number(number) || 1)) - 1) / 6) + 1;
}
function chapterUrl(page, panel) {
  const p = Math.min(9, Math.max(1, Math.floor(Number(page) || 1)));
  const n = Math.min(p * 6, Math.max((p - 1) * 6 + 1, Math.floor(Number(panel) || (p - 1) * 6 + 1)));
  return '/chapters/p' + String(p).padStart(2, '0') + '/index?panel=' + n;
}
function time(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  return Math.floor(value / 60) + ':' + String(value % 60).padStart(2, '0');
}
function percent(value) { return Math.round(value * 100000) / 1000; }
function rectStyle(rect, viewport) {
  return 'left:' + percent((rect[0] - viewport[0]) / viewport[2]) + '%;top:' + percent((rect[1] - viewport[1]) / viewport[3]) + '%;width:' + percent(rect[2] / viewport[2]) + '%;height:' + percent(rect[3] / viewport[3]) + '%;';
}
function stageFor(chapter, panel, view) {
  const viewport = view === 'page' ? [0, 0, chapter.width, chapter.height] : panel.rect;
  const panels = view === 'page' ? chapter.panels : [panel];
  return {
    stageRatio: percent(viewport[3] / viewport[2]),
    imageStyle: rectStyle([0, 0, chapter.width, chapter.height], viewport),
    panelSpots: panels.map(p => ({number: p.number, style: rectStyle(p.rect, viewport)})),
    bubbleSpots: panels.reduce((all, p) => all.concat(p.bubbles.map(b => ({
      id: b.id, panel: p.number, label: b.speaker + '：' + b.text, style: rectStyle(b.rect, viewport)
    }))), [])
  };
}
function activeBubble(panel, elapsed) {
  const absolute = panel.start + elapsed;
  return panel.bubbles.find(b => absolute >= b.start && absolute < b.end) || null;
}
module.exports = { STORAGE_KEY, SPEEDS, cleanProgress, readProgress, writeProgress, panelPage, chapterUrl, time, rectStyle, stageFor, activeBubble };
