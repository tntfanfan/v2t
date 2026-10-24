const STORAGE_KEY = 'bluey-comic-wechat-s01e01-v1';
const DEFAULT = {panelCount:54,pageCount:9,storageKey:STORAGE_KEY};
const SPEEDS = [0.75, 1, 1.25];

function cleanProgress(value, catalog = DEFAULT) {
  const saved = value && typeof value === 'object' ? value : {};
  return {
    panel: Number.isInteger(saved.panel) && saved.panel >= 1 && saved.panel <= catalog.panelCount ? saved.panel : 1,
    view: saved.view === 'page' ? 'page' : 'panel',
    speed: SPEEDS.includes(saved.speed) ? saved.speed : 1,
    started: saved.started === true
  };
}
function readProgress(api, catalog = DEFAULT) {
  try { return cleanProgress(api.getStorageSync(catalog.storageKey), catalog); }
  catch (_) { return cleanProgress(null, catalog); }
}
function writeProgress(api, value, catalog = DEFAULT) {
  try { api.setStorageSync(catalog.storageKey, cleanProgress(value, catalog)); return true; }
  catch (_) { return false; }
}
function panelPage(number, catalog = DEFAULT) {
  return Math.floor((Math.min(catalog.panelCount, Math.max(1, Number(number) || 1)) - 1) / 6) + 1;
}
function chapterUrl(page, panel, catalog = DEFAULT) {
  const p = Math.min(catalog.pageCount, Math.max(1, Math.floor(Number(page) || 1)));
  const n = Math.min(p * 6, Math.max((p - 1) * 6 + 1, Math.floor(Number(panel) || (p - 1) * 6 + 1)));
  const route = catalog.chapters && catalog.chapters[p-1].path || '/chapters/p' + String(p).padStart(2, '0') + '/index';
  return route + '?panel=' + n;
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
    imageStyle: rectStyle([0, 0, chapter.width, chapter.height], viewport) + (chapter.overlayBubbles ? 'opacity:0;' : ''),
    artSpots: chapter.overlayBubbles ? panels.map(p=>({number:p.number,style:rectStyle(p.artRect,viewport),imageStyle:rectStyle([0,0,chapter.imageWidth,chapter.imageHeight],p.imageRect)})) : [],
    panelSpots: panels.map(p => ({number: p.number, style: rectStyle(p.rect, viewport)})),
    bubbleSpots: panels.reduce((all, p) => all.concat(p.bubbles.map(b => ({
      id: b.id, panel: p.number, label: b.speaker + '：' + b.text, text:b.displayText||b.text, bubbleImage:b.bubbleImage||null, style: rectStyle(b.visualRect||b.rect, viewport)+(chapter.overlayBubbles ? 'font-size:'+ (b.fontSize/viewport[2]*93.6) +'vw;' : '')
    }))), [])
  };
}
function activeBubble(panel, elapsed) {
  const absolute = panel.start + elapsed;
  return panel.bubbles.find(b => absolute >= b.start && absolute < b.end) || null;
}
module.exports = { STORAGE_KEY, SPEEDS, cleanProgress, readProgress, writeProgress, panelPage, chapterUrl, time, rectStyle, stageFor, activeBubble };
