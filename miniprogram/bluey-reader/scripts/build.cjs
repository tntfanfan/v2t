const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const {verify} = require('./verify.cjs');

const sourceRoot = path.resolve(__dirname, '..');
const repository = path.resolve(sourceRoot, '../..');
const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
const output = path.resolve(option('--output') || path.join(repository, 'output/S01E01/comic-miniprogram-v1'));
if (fs.existsSync(output)) throw new Error('Output already exists. Choose a new version with --output; existing deliveries are never overwritten.');
const mediaRoot = path.join(repository, 'output/S01E01/comic-web-v4/dist');
const bookPath = path.join(repository, 'web/bluey-reader/data/s01e01.json');
const book = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const hashFile = filename => hash(fs.readFileSync(filename));
const pythonCandidates = [option('--python'), process.env.BLUEY_PYTHON,
  path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe')].filter(Boolean);
const python = pythonCandidates.find(file => fs.existsSync(file)) || 'python';
// A fresh staging directory keeps source and historical deliveries untouched.
const imageRoot = path.join(repository, '.cache/bluey-miniprogram/images-' + Date.now());
const imageRun = spawnSync(python, [path.join(__dirname, 'prepare-images.py'), repository, imageRoot], {encoding: 'utf8', windowsHide: true});
if (imageRun.status !== 0) throw new Error(imageRun.stderr || imageRun.error || 'Pillow image conversion failed');
console.log(imageRun.stdout.trim());

const appRoot = path.join(output, 'miniprogram');
fs.mkdirSync(appRoot, {recursive: true});
fs.cpSync(path.join(sourceRoot, 'src'), appRoot, {recursive: true, errorOnExist: true});
const write = (relative, contents) => {
  const target = path.join(output, relative); fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, contents);
};
const json = (relative, value) => write(relative, JSON.stringify(value, null, 2) + '\n');
const audit = {sourceBook: book.id, sourceDataSha256: hashFile(bookPath), sourceData: 'web/bluey-reader/data/s01e01.json', images: [], audio: []};
const catalog = {episode: book.episode, title: book.title, titleZh: book.titleZh, cover: '/assets/cover.jpg', chapters: []};
const copy = (from, relative) => { const target = path.join(appRoot, relative); fs.mkdirSync(path.dirname(target), {recursive: true}); fs.copyFileSync(from, target, fs.constants.COPYFILE_EXCL); };
copy(path.join(imageRoot, 'cover.jpg'), 'assets/cover.jpg');
const packages = [];

for (const sourcePage of book.pages) {
  const chapter = JSON.parse(JSON.stringify(sourcePage));
  const label = String(chapter.number).padStart(2, '0');
  const root = 'chapters/p' + label;
  const clips = chapter.panels.flatMap(p => [p, ...p.bubbles]);
  const audioBytes = clips.reduce((sum, clip) => sum + fs.statSync(path.join(mediaRoot, clip.audio)).size, 0);
  const jpeg = path.join(imageRoot, 'page-' + label + '.jpg');
  // Shared images belong to the main package, which all chapters may reference.
  // Keep a 96 KiB allowance for code/data/compiler overhead in each subpackage.
  const useShared = audioBytes + fs.statSync(jpeg).size > 2 * 1024 * 1024 - 96 * 1024;
  const imagePath = useShared ? 'assets/pages/page-' + label + '.jpg' : root + '/media/page.jpg';
  copy(jpeg, imagePath);
  copy(path.join(imageRoot, 'thumb-' + label + '.jpg'), 'assets/thumbs/page-' + label + '.jpg');
  audit.images.push({page: chapter.number, source: sourcePage.image, sourceSha256: hashFile(path.join(mediaRoot, sourcePage.image)), target: imagePath, sha256: hashFile(jpeg), width: chapter.width, height: chapter.height, quality: 85, colorSubsampling: '4:4:4'});
  chapter.image = '/' + imagePath;
  chapter.label = label;
  for (const clip of clips) {
    const original = path.join(mediaRoot, clip.audio);
    const actualHash = hashFile(original);
    if (actualHash !== clip.sha256) throw new Error('Audio hash mismatch: ' + clip.audio);
    const target = root + '/media/' + path.basename(clip.audio);
    copy(original, target);
    audit.audio.push({id: clip.id, source: clip.audio, target, sha256: actualHash, duration: clip.duration});
    clip.audio = '/' + target;
  }
  write('miniprogram/' + root + '/data.js', 'module.exports = ' + JSON.stringify(chapter) + ';\n');
  write('miniprogram/' + root + '/index.js', "const {readerPage} = require('../../lib/reader-page');\nPage(readerPage(require('./data')));\n");
  json('miniprogram/' + root + '/index.json', {navigationBarTitleText: chapter.title + ' · 魔法木琴', pageOrientation: 'auto'});
  write('miniprogram/' + root + '/index.wxml', fs.readFileSync(path.join(sourceRoot, 'src/shared/reader.wxml')));
  // Keep page styles inside each subpackage so DevTools incremental compilation
  // can resolve them without a cross-package WXSS import.
  write('miniprogram/' + root + '/index.wxss', fs.readFileSync(path.join(sourceRoot, 'src/shared/reader.wxss')));
  packages.push({root, name: 'chapter' + label, pages: ['index']});
  catalog.chapters.push({number: chapter.number, label, title: chapter.title, first: chapter.panels[0].number, last: chapter.panels.at(-1).number, thumbnail: '/assets/thumbs/page-' + label + '.jpg'});
}
write('miniprogram/data/catalog.js', 'module.exports = ' + JSON.stringify(catalog) + ';\n');
json('miniprogram/app.json', {
  pages: ['pages/index/index'], subPackages: packages,
  window: {navigationBarTitleText: 'Bluey 原声漫画', navigationBarTextStyle: 'black', navigationBarBackgroundColor: '#f8f7f0', backgroundColor: '#f8f7f0', backgroundTextStyle: 'light', pageOrientation: 'auto'},
  style: 'v2', lazyCodeLoading: 'requiredComponents', sitemapLocation: 'sitemap.json'
});
json('project.config.json', {
  description: '魔法木琴 · Bluey 原声漫画（家庭学习）', appid: 'touristappid', projectname: 'bluey-comic-reader',
  compileType: 'miniprogram', miniprogramRoot: 'miniprogram/', libVersion: '3.7.6',
  setting: {es6: true, enhance: true, postcss: true, minified: true, minifyWXSS: true, minifyWXML: true, urlCheck: true, ignoreUploadUnusedFiles: false},
  packOptions: {ignore: [], include: []},
  condition: {miniprogram: {list: [{name: '第一页：钢琴游戏', pathName: 'chapters/p01/index', query: 'panel=1'}, {name: '无对白格：环境声音', pathName: 'chapters/p04/index', query: 'panel=22'}, {name: '最后一格', pathName: 'chapters/p09/index', query: 'panel=54'}]}}
});
json('qa/media-manifest.json', audit);
if (fs.existsSync(path.join(sourceRoot, 'IMPORT.md'))) write('导入说明.md', fs.readFileSync(path.join(sourceRoot, 'IMPORT.md')));
const report = verify(output, repository);
json('qa/validation.json', report);
console.log(JSON.stringify({output, ...report.summary}, null, 2));
