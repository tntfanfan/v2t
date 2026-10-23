const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {wxmlToJs, wxssToJs} = require('miniprogram-compiler');
const {listFiles, readModule} = require('./verify.cjs');
const {stageFor} = require('../src/lib/reading');

const output = path.resolve(process.argv[2]);
const root = path.join(output, 'miniprogram');
const compiledWxml = wxmlToJs(root);
const compiledWxss = wxssToJs(root);
const generator = new Function('global', 'window', compiledWxml)({}, {});
const catalog = readModule(path.join(root, 'data/catalog.js'));
const home = generator('pages/index/index.wxml')({catalog, saved: {started: false, panel: 1}, opening: false});
assert.ok(home);
let rendered = 0;
for (const chapterInfo of catalog.chapters) {
  const chapter = readModule(path.join(root, 'chapters/p' + chapterInfo.label + '/data.js'));
  const render = generator('chapters/p' + chapterInfo.label + '/index.wxml');
  for (const panel of chapter.panels) for (const view of ['page', 'panel']) {
    const selected = panel.bubbles[0] || null;
    const tree = render(Object.assign({chapter, current: panel, selected, selectedId: selected ? selected.id : '', lines: panel.bubbles, view, panelSpots: [], bubbleSpots: [],
      imageVisible: true, readyImage: true, status: 'idle', speeds: ['0.75×','1.0×','1.25×'], speedIndex: 1,
      pageLabels: catalog.chapters.map(c => c.title), pageIndex: chapter.number - 1, elapsed: '0:00', duration: '0:00', seek: 0, playSymbol: '▶', playLabel: '听这一格'
    }, stageFor(chapter, panel, view)));
    assert.ok(tree && tree.children && tree.children.length, 'Empty compiled reader');
    rendered++;
  }
}
const report = {compiler: 'miniprogram-compiler 0.2.3 (official wcc/wcsc wrapper)', wxmlFiles: listFiles(root).filter(f => f.endsWith('.wxml')).length, wxssFiles: listFiles(root).filter(f => f.endsWith('.wxss')).length,
  readerStatesRendered: rendered, homeRendered: true, wxssCompiled: !!compiledWxss, status: 'passed', limitation: 'Compiler and template checks do not replace Developer Tools or physical WeChat testing.'};
fs.writeFileSync(path.join(output, 'qa/template-compile.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
