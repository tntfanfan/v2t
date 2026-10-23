const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const hashFile = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function listFiles(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => entry.isDirectory() ? listFiles(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}
function readModule(file) {
  const sandbox = {module: {exports: {}}};
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox);
  return JSON.parse(JSON.stringify(sandbox.module.exports));
}
function verify(output, repository) {
  const root = path.join(output, 'miniprogram');
  const config = JSON.parse(fs.readFileSync(path.join(output, 'project.config.json')));
  assert.equal(config.miniprogramRoot, 'miniprogram/');
  assert.equal(config.compileType, 'miniprogram');
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json')));
  const source = JSON.parse(fs.readFileSync(path.join(repository, 'web/bluey-reader/data/s01e01.json')));
  const manifest = JSON.parse(fs.readFileSync(path.join(output, 'qa/media-manifest.json')));
  assert.equal(manifest.sourceDataSha256, hashFile(path.join(repository, 'web/bluey-reader/data/s01e01.json')));
  assert.equal(app.subPackages.length, 9);
  const files = listFiles(root);
  const routes = [...app.pages, ...app.subPackages.flatMap(p => p.pages.map(page => p.root + '/' + page))];
  for (const route of routes) for (const extension of ['js', 'json', 'wxml', 'wxss']) assert.ok(fs.existsSync(path.join(root, route + '.' + extension)), 'Missing route: ' + route + '.' + extension);
  for (const file of files) {
    if (file.endsWith('.json')) JSON.parse(fs.readFileSync(file));
    if (file.endsWith('.js')) new vm.Script(fs.readFileSync(file, 'utf8'), {filename: file});
    if (/\.(js|wxml|json|wxss)$/.test(file)) {
      const text = fs.readFileSync(file, 'utf8');
      assert.ok(!text.includes('http://127.0.0.1') && !text.includes('http://localhost'), 'Local server reference: ' + file);
      for (const match of text.matchAll(/(?:require\(|@import\s+)["']([^"']+)["']/g)) {
        const reference = path.resolve(path.dirname(file), match[1]);
        assert.ok(fs.existsSync(reference) || fs.existsSync(reference + '.js'), 'Unresolved import: ' + file + ' -> ' + match[1]);
      }
    }
  }
  let panels = 0, bubbles = 0;
  const recordIds = new Set();
  for (const original of source.pages) {
    const label = String(original.number).padStart(2, '0');
    const chapter = readModule(path.join(root, 'chapters/p' + label + '/data.js'));
    assert.equal(chapter.number, original.number);
    assert.equal(chapter.title, original.title);
    assert.ok(fs.existsSync(path.join(root, chapter.image)));
    assert.equal(chapter.panels.length, original.panels.length);
    chapter.panels.forEach((panel, index) => {
      panels++;
      const old = original.panels[index];
      assert.deepEqual(panel.rect, old.rect);
      assert.equal(panel.number, old.number);
      assert.equal(panel.ambient, old.ambient);
      assert.equal(panel.bubbles.length, old.bubbles.length);
      for (const [clip, oldClip] of [[panel, old], ...panel.bubbles.map((b, i) => [b, old.bubbles[i]])]) {
        const copy = {...clip, audio: oldClip.audio};
        const expected = {...oldClip};
        delete copy.bubbles; delete expected.bubbles;
        assert.deepEqual(copy, expected, 'Source text, speaker, note, timing and coordinates must be preserved');
        assert.ok(clip.audio.startsWith('/chapters/p' + label + '/'), 'Audio must stay in its owning subpackage');
        assert.equal(hashFile(path.join(root, clip.audio)), oldClip.sha256);
      }
      panel.bubbles.forEach(b => { bubbles++; b.sourceIds.forEach(id => recordIds.add(id)); });
    });
  }
  assert.equal(panels, 54); assert.equal(bubbles, 115); assert.equal(recordIds.size, 140);
  assert.equal(manifest.audio.length, 169); assert.equal(manifest.images.length, 9);
  for (const image of manifest.images) {
    assert.equal(hashFile(path.join(root, image.target)), image.sha256);
    assert.equal(hashFile(path.join(repository, 'output/S01E01/comic-web-v4/dist', image.source)), image.sourceSha256);
  }
  const catalog = readModule(path.join(root, 'data/catalog.js'));
  for (const image of [catalog.cover, ...catalog.chapters.map(c => c.thumbnail)]) assert.ok(fs.existsSync(path.join(root, image)));
  const subRoots = app.subPackages.map(p => p.root.replaceAll('/', path.sep) + path.sep);
  const packageSizes = {main: 0}; subRoots.forEach(p => packageSizes[p] = 0);
  for (const file of files) {
    const relative = path.relative(root, file);
    const key = subRoots.find(p => relative.startsWith(p)) || 'main';
    packageSizes[key] += fs.statSync(file).size;
  }
  for (const [name, bytes] of Object.entries(packageSizes)) assert.ok(bytes < 2 * 1024 * 1024, name + ' exceeds 2 MiB');
  const totalBytes = Object.values(packageSizes).reduce((a, b) => a + b, 0);
  assert.ok(totalBytes < 20 * 1024 * 1024, 'Conservative project budget: 20 MiB');
  return {
    checkedAt: new Date().toISOString(), status: 'passed',
    summary: {pages: 9, panels, bubbles, sourceRecords: recordIds.size, originalAudioFiles: 169, totalMiB: +(totalBytes / 1048576).toFixed(3), largestPackageMiB: +(Math.max(...Object.values(packageSizes)) / 1048576).toFixed(3)},
    packageSizes, checks: ['routes-and-imports', 'javascript-and-json-syntax', 'source-text-speakers-notes-timings-and-hotspots', 'all-audio-sha256', 'source-PNG-preservation', 'generated-image-sha256', 'local-assets', 'package-size-budgets'],
    limitations: ['Native WeChat Developer Tools compilation and physical phone playback remain to be checked.', 'Existing source audio boundary-review limitations remain unchanged.']
  };
}
if (require.main === module) {
  const output = path.resolve(process.argv[2] || path.join(__dirname, '../../../output/S01E01/comic-miniprogram-v1'));
  const report = verify(output, path.resolve(__dirname, '../../..'));
  console.log(JSON.stringify(report, null, 2));
}
module.exports = {verify, listFiles, readModule};
