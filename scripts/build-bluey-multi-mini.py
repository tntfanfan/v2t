"""Create a separate 1.2.0 mini-program from the preserved 1.1.0 project."""
from pathlib import Path
import copy, json, shutil, sys
ROOT=Path(__file__).resolve().parents[1]
for d in ['.ocr_tools','.demo_deps']:sys.path.insert(0,str(ROOT/d))
from PIL import Image
SRC=Path('E:/英语复习/miniprogram/english-review-bluey-v2')
OUT=Path('E:/英语复习/miniprogram/english-review-bluey-v3')
if OUT.exists():raise FileExistsError(f'Preserve existing edition: {OUT}')
shutil.copytree(SRC,OUT,ignore=shutil.ignore_patterns('qa','project.private.config.json'))
(OUT/'qa').mkdir()
APP=OUT/'miniprogram'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def put(p,s):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s,encoding='utf-8')
def js(p,v):put(p,'module.exports = '+json.dumps(v,ensure_ascii=False,separators=(',',':'))+';\n')
def edit(p,changes):
 s=p.read_text(encoding='utf-8-sig')
 for a,b in changes:
  if a not in s:raise ValueError(f'Missing pattern {p}: {a}')
  s=s.replace(a,b)
 put(p,s)
config=read(OUT/'project.config.json');config['projectname']='english-review-bluey-1.2.0';config['description']='英语复习 + 魔法木琴 + 第三季第十集 Magic';config['condition']['miniprogram']['list'].append({'name':'第三季第十集 魔法','pathName':'magic/p01/index','query':'panel=1'})
put(OUT/'project.config.json',json.dumps(config,ensure_ascii=False,indent=2))
pkg=read(OUT/'package.json');pkg['version']='1.2.0';put(OUT/'package.json',json.dumps(pkg,ensure_ascii=False,indent=2))
book=read(ROOT/'web/bluey-reader/data/s03e10.json')
app=read(APP/'app.json')
catalog={'episode':'S03E10','title':'Magic','titleZh':'魔法','pageCount':12,'panelCount':72,'bubbleCount':189,'storageKey':'bluey-comic-wechat-s03e10-v1','cover':'/assets/magic-cover.jpg','chapters':[]}
cover=Image.open(ROOT/'output/S03E10/comic-v1/deliverables/pages/page-01.png');cover.thumbnail((220,330));cover.convert('RGB').save(APP/'assets/magic-cover.jpg',quality=65,optimize=True)
template=(APP/'chapters/p01/index.wxml').read_text(encoding='utf-8')
css=(APP/'chapters/p01/index.wxss').read_text(encoding='utf-8')
for page in book['pages']:
 n=page['number'];label=f'{n:02}';folder=APP/f'magic/p{label}';folder.mkdir(parents=True)
 chapter=copy.deepcopy(page);chapter.update(episode='S03E10',overlayBubbles=True,label=label)
 for item in [chapter,*[clip for panel in chapter['panels'] for clip in [panel,*panel['bubbles']]]]:
  key='image' if item is chapter else 'audio';source=ROOT/'output/S03E10/comic-v1/dist'/item[key];target=folder/'media'/source.name;target.parent.mkdir(exist_ok=True);shutil.copy2(source,target);item[key]='/'+target.relative_to(APP).as_posix()
 js(folder/'data.js',chapter)
 put(folder/'index.js',"const {readerPage}=require('../../lib/reader-page');\nPage(readerPage(require('./data')));\n")
 put(folder/'index.json',json.dumps({'navigationBarTitleText':f'Magic · {page["title"]}'},ensure_ascii=False))
 put(folder/'index.wxml',template);put(folder/'index.wxss',css)
 thumb=Image.open(ROOT/'output/S03E10/comic-v1/dist'/page['image']);thumb.thumbnail((72,108));dest=APP/f'assets/thumbs/magic-{label}.jpg';thumb.save(dest,quality=60,optimize=True)
 catalog['chapters'].append({'number':n,'label':label,'title':page['title'],'first':page['panels'][0]['number'],'last':page['panels'][-1]['number'],'thumbnail':'/'+dest.relative_to(APP).as_posix(),'path':f'/magic/p{label}/index'})
 app['subPackages'].append({'root':f'magic/p{label}','name':f'magic{label}','pages':['index']})
put(APP/'app.json',json.dumps(app,ensure_ascii=False,indent=2));js(APP/'data/magic.js',catalog)
put(APP/'data/library.js',"const first=require('./catalog');\nObject.assign(first,{pageCount:9,panelCount:54,bubbleCount:115,storageKey:'bluey-comic-wechat-s01e01-v1'});\nconst magic=require('./magic');\nconst books=[first,magic];\nmodule.exports={books,getBook:episode=>String(episode).toUpperCase()==='S03E10'?magic:first};\n")
reading=APP/'lib/reading.js'
edit(reading,[
 ("const SPEEDS =", "const DEFAULT = {panelCount:54,pageCount:9,storageKey:STORAGE_KEY};\nconst SPEEDS ="),
 ('function cleanProgress(value)', 'function cleanProgress(value, catalog = DEFAULT)'),
 ('saved.panel <= 54','saved.panel <= catalog.panelCount'),
 ('function readProgress(api)', 'function readProgress(api, catalog = DEFAULT)'),
 ('cleanProgress(api.getStorageSync(STORAGE_KEY))','cleanProgress(api.getStorageSync(catalog.storageKey), catalog)'),
 ('cleanProgress(null)','cleanProgress(null, catalog)'),
 ('function writeProgress(api, value)', 'function writeProgress(api, value, catalog = DEFAULT)'),
 ('api.setStorageSync(STORAGE_KEY, cleanProgress(value))','api.setStorageSync(catalog.storageKey, cleanProgress(value, catalog))'),
 ('function panelPage(number)', 'function panelPage(number, catalog = DEFAULT)'),
 ('Math.min(54,','Math.min(catalog.panelCount,'),
 ('function chapterUrl(page, panel)', 'function chapterUrl(page, panel, catalog = DEFAULT)'),
 ('Math.min(9,','Math.min(catalog.pageCount,'),
 ("return '/chapters/p' + String(p).padStart(2, '0') + '/index?panel=' + n;", "const route = catalog.chapters && catalog.chapters[p-1].path || '/chapters/p' + String(p).padStart(2, '0') + '/index';\n  return route + '?panel=' + n;"),
 ("imageStyle: rectStyle([0, 0, chapter.width, chapter.height], viewport),", "imageStyle: rectStyle([0, 0, chapter.width, chapter.height], viewport) + (chapter.overlayBubbles ? 'opacity:0;' : ''),\n    artSpots: chapter.overlayBubbles ? panels.map(p=>({number:p.number,style:rectStyle(p.artRect,viewport),imageStyle:rectStyle([0,0,chapter.imageWidth,chapter.imageHeight],p.imageRect)})) : [],"),
 ("id: b.id, panel: p.number, label: b.speaker + '：' + b.text, style: rectStyle(b.rect, viewport)", "id: b.id, panel: p.number, label: b.speaker + '：' + b.text, text:b.displayText||b.text, style: rectStyle(b.rect, viewport)+(chapter.overlayBubbles ? 'font-size:'+ (b.fontSize/viewport[2]*93.6) +'vw;' : '')")
])
reader=APP/'lib/reader-page.js'
edit(reader,[
 ("const catalog = require('../data/catalog');", "const {getBook} = require('../data/library');"),
 ('function readerPage(chapter) {','function readerPage(chapter) {\n  const catalog = getBook(chapter.episode);'),
 ('readProgress(wx)','readProgress(wx, catalog)'),
 ('started: true});','started: true}, catalog);'),
 ('number > 54','number > catalog.panelCount'),
 ('panelPage(number)','panelPage(number, catalog)'),
 ('chapterUrl(panelPage(number, catalog), number)','chapterUrl(panelPage(number, catalog), number, catalog)'),
 ("url: '/pages/bluey/index'", "url: '/pages/bluey/index' + (chapter.episode === 'S03E10' ? '?episode=S03E10' : '')"),
 ('previewImage() {', "previewImage() {\n      if(chapter.overlayBubbles){this.switchView({currentTarget:{dataset:{view:'page'}}});wx.pageScrollTo({scrollTop:0,duration:0});return;}")
])
for folder in [*sorted((APP/'chapters').iterdir()),*sorted((APP/'magic').iterdir())]:
 edit(folder/'index.wxml',[
  (' / 09',' / {{catalog.pageCount}}'),(' / 54 格',' / {{catalog.panelCount}} 格'),(' / 9 页',' / {{catalog.pageCount}} 页'),('chapter.number === 9','chapter.number === catalog.pageCount'),('current.number === 54','current.number === catalog.panelCount'),(' · 魔法木琴',' · {{catalog.titleZh}}'),
  ('查看整页大图 ↗',"{{chapter.overlayBubbles ? '查看整页漫画 ↗' : '查看整页大图 ↗'}}"),
  ('    <view wx:for="{{panelSpots}}"', '    <view wx:for="{{artSpots}}" wx:key="number" class="panel-art" style="{{item.style}}"><image src="{{chapter.image}}" mode="scaleToFill" style="{{item.imageStyle}}" /></view>\n    <view wx:for="{{panelSpots}}"'),
  ('class="hotspot bubble-hotspot ', 'class="hotspot bubble-hotspot {{chapter.overlayBubbles ? \'speech-bubble\' : \'\'}} '),
  ('aria-label="播放 {{item.label}}" />','aria-label="播放 {{item.label}}"><text wx:if="{{chapter.overlayBubbles}}">{{item.text}}</text></view>')
 ])
 with (folder/'index.wxss').open('a',encoding='utf-8') as f:f.write('\n.art-stage{background:#fffef8}.panel-art{position:absolute;overflow:hidden;border-radius:8rpx;pointer-events:none}.panel-art image{position:absolute;max-width:none}.speech-bubble{display:flex;align-items:center;justify-content:center;white-space:pre;line-height:1.2;font-family:Arial,sans-serif;font-weight:700;background:#fffef3;color:#193b56;border:1px solid #304f69;border-radius:40% / 45%;text-align:center;overflow:hidden}.speech-bubble.active-bubble{background:#fff0b9}.reader-body{max-width:none}\n')
home=APP/'pages/bluey/index.js'
edit(home,[
 ("const catalog = require('../../data/catalog');", "const {getBook,books} = require('../../data/library');\nconst catalog=getBook('S01E01');"),
 ('data: {catalog,','data: {catalog, books,'),
 ('  onShareAppMessage()', "  onLoad(options){this.setData({catalog:getBook(options&&options.episode)});},\n  chooseBook(event){getApp().player.stop();wx.redirectTo({url:'/pages/bluey/index?episode='+event.currentTarget.dataset.episode});},\n  onShareAppMessage()"),
 ("return {title:'Bluey 原声漫画 · 魔法木琴',path:'/pages/bluey/index'}", "return {title:'Bluey 原声漫画 · '+this.data.catalog.titleZh,path:'/pages/bluey/index'+(this.data.catalog.episode==='S03E10'?'?episode=S03E10':'')}"),
 ('readProgress(wx)','readProgress(wx,this.data.catalog)'),('saved.panel / 54','saved.panel / this.data.catalog.panelCount'),
 ('chapterUrl(panelPage(panel), panel)','chapterUrl(panelPage(panel,this.data.catalog), panel,this.data.catalog)'),
 ("'沿用现有 S01E01 网页 v4：9 页漫画、54 格、115 个气泡和 169 段视频原声。图片为漫画改编，台词与角色沿用既有核对数据。个别原稿待核标注仍保留，音频切点尚未逐句完成听审。\\n\\n这是家庭学习项目，不是 Bluey 官方小程序。'", "this.data.catalog.titleZh+'：'+this.data.catalog.pageCount+' 页漫画，'+this.data.catalog.panelCount+' 格。点气泡听单句，点画面听整格，声音来自原视频。个别说话人待核标注保留，部分切点尚待逐句听审。\\n\\n家庭学习项目，非 Bluey 官方小程序。'")
])
edit(APP/'pages/bluey/index.wxml',[
 ('  <view class="book-card">','  <view class="book-shelf"><button wx:for="{{books}}" wx:key="episode" class="{{catalog.episode === item.episode ? \'chosen\' : \'\'}}" data-episode="{{item.episode}}" bindtap="chooseBook"><text>{{item.episode}}</text><view>{{item.titleZh}}</view></button></view>\n  <view class="book-card">'),
 ('SEASON 01 · EPISODE 01','{{catalog.episode}}'),('>魔法木琴<','>{{catalog.titleZh}}<'),('>Magic Xylophone<','>{{catalog.title}}<'),('把好玩的游戏，也分一半给你。','跟着熟悉的声音，一起读故事。'),('9 页漫画 · 54 个画格','{{catalog.pageCount}} 页漫画 · {{catalog.panelCount}} 个画格')
])
with (APP/'pages/bluey/index.wxss').open('a',encoding='utf-8') as f:f.write('\n.book-shelf{display:flex;gap:16rpx;margin:20rpx 0}.book-shelf button{flex:1;width:auto;background:#fffef8;border:1rpx solid #dce5df;border-radius:18rpx;padding:18rpx;font-size:28rpx;text-align:left}.book-shelf button text{font-size:20rpx;color:#708c7d}.book-shelf .chosen{background:#e3eeeb;border-color:#315e61}\n')
edit(APP/'pages/index/index.wxml',[('Magic Xylophone · 魔法木琴','魔法木琴 · Magic 魔法'),('9 页漫画 · 54 个画格','2 集漫画 · 21 页 · 126 格')])
put(OUT/'导入说明.txt','版本 1.2.0：英语复习 + Bluey S01E01 魔法木琴 + S03E10 Magic 魔法\n\n微信开发者工具导入此文件夹。AppID：wxeffdeea9ba92682b。\n新增 12 页、72 格、189 个单句点读及72段整格原声。\n三部分进度独立保存；第一集媒体和进度键沿用1.1.0。\n本地新版本，未上传、未替换审核中的版本。\n部分原声切点仍需逐句听审，6处说话人待核，数据内保留说明。\n')
print(OUT)
