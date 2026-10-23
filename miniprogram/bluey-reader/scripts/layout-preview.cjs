// QA only: render the actual compiled WXML tree using approximate browser styles.
// This is not a WeChat runtime, and is not part of the mini-program delivery.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {wxmlToJs} = require('miniprogram-compiler');
const {readModule} = require('./verify.cjs');
const {stageFor} = require('../src/lib/reading');
const root = path.join(path.resolve(process.argv[2]), 'miniprogram');
const generate = new Function('global', 'window', wxmlToJs(root))({}, {});
const catalog = readModule(path.join(root, 'data/catalog.js'));
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const tags = {'wx-page':'main','wx-view':'div','wx-text':'span','wx-image':'img','wx-button':'button','wx-picker':'div','wx-slider':'input'};
function html(node) {
  if (typeof node === 'string' || typeof node === 'number') return escape(node);
  if (!node) return '';
  if (!node.tag || node.tag === 'virtual') return (node.children || []).map(html).join('');
  const tag = tags[node.tag] || 'div', attr = node.attr || {};
  let attributes = ['class','style','src'].filter(key => attr[key] !== undefined).map(key => ' ' + key + '="' + escape(attr[key]) + '"').join('');
  if (attr.disabled) attributes += ' disabled';
  if (tag === 'img') attributes += ' style="' + escape((attr.style || '') + ';object-fit:' + (attr.mode === 'aspectFill' ? 'cover' : 'fill')) + '"';
  if (tag === 'input') attributes += ' type="range" min="0" max="1000" value="' + (attr.value || 0) + '"';
  return '<' + tag + attributes + '>' + (node.children || []).map(html).join('') + (['img','input'].includes(tag) ? '' : '</' + tag + '>');
}
function css(file, width) {
  return fs.readFileSync(path.join(root, file), 'utf8').replace(/(-?[\d.]+)rpx/g, (_, n) => Number(n) * width / 750 + 'px').replace(/(?<![-\w])(page|view|text|image)(?![-\w])/g, name => ({page:'body',view:'div',text:'span',image:'img'}[name]));
}
function page(url) {
  const route = url.pathname, width = Math.min(1000, Math.max(320, Number(url.searchParams.get('width')) || 390));
  let tree, style;
  if (route === '/qa/home') {
    tree = generate('pages/index/index.wxml')({catalog, saved: {started: false, panel: 1}, opening: false});
    style = css('pages/index/index.wxss', width);
  } else {
    const chapter = readModule(path.join(root, 'chapters/p01/data.js')), panel = chapter.panels[1];
    const view = route === '/qa/page' ? 'page' : 'panel', selected = panel.bubbles[0];
    tree = generate('chapters/p01/index.wxml')(Object.assign({chapter, current: panel, selected, selectedId: selected.id, lines: panel.bubbles,
      view, imageVisible: true, readyImage: true, outlines: false, status: 'idle', speeds: ['0.75×','1.0×','1.25×'], speedIndex: 1,
      elapsed: '0:00', duration: '0:00', seek: 0, playSymbol: '▶', playLabel: '听这一格', playerKind:'第 2 格 · 视频原声', playerMessage:'点气泡听一句，点画面听整格', storageAvailable: true
    }, stageFor(chapter, panel, view)));
    style = css('shared/reader.wxss', width);
  }
  return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bluey 小程序布局校验 · 非微信真机</title><style>body{margin:0}button{border:0;font-family:inherit}img{display:block}input[type=range]{width:100%}' + css('app.wxss', width) + style + '</style><body>' + html(tree) + '</body></html>';
}
http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1:5180');
  if (url.pathname.startsWith('/qa/')) { response.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); response.end(page(url)); return; }
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, {'Content-Type':file.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream'});
  fs.createReadStream(file).pipe(response);
}).listen(5180, '127.0.0.1', () => console.log('QA layout preview: http://127.0.0.1:5180/qa/home (not a WeChat runtime)'));
