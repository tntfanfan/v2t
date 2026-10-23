"""Save the style-matched 1.2.2 local project, preserving earlier deliveries."""
from pathlib import Path
import copy,json,shutil
ROOT=Path(__file__).resolve().parents[1]
OLD=Path('E:/英语复习/miniprogram/english-review-bluey-v4')
OUT=OLD.with_name('english-review-bluey-v5')
if not OUT.exists():
    shutil.copytree(OLD,OUT,ignore=shutil.ignore_patterns('qa','project.private.config.json'))
    (OUT/'qa').mkdir();shutil.copy2(OLD/'qa/preserved-assets.json',OUT/'qa/preserved-assets.json')
book=json.loads((ROOT/'web/bluey-reader/data/s03e10.json').read_text(encoding='utf-8'))
for page in book['pages']:
    label=f'{page["number"]:02}';chapter=copy.deepcopy(page)
    chapter.update(episode='S03E10',overlayBubbles=True,label=label)
    folder=OUT/f'miniprogram/magic/p{label}'
    for item in [chapter,*[c for p in chapter['panels'] for c in [p,*p['bubbles']]]]:
        key='image' if item is chapter else 'audio'
        item[key]=f'/magic/p{label}/media/{Path(item[key]).name}'
        if 'bubbleImage' in item:
            src=ROOT/'output/S03E10/comic-v3/dist'/item['bubbleImage']
            shutil.copy2(src,folder/'media'/src.name)
            item['bubbleImage']=f'/magic/p{label}/media/{src.name}'
    (folder/'data.js').write_text('module.exports = '+json.dumps(chapter,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    wxml=folder/'index.wxml';s=(OLD/f'miniprogram/magic/p{label}/index.wxml').read_text(encoding='utf-8')
    s=s.replace("{{chapter.overlayBubbles ? 'speech-bubble' : ''}}", "{{chapter.overlayBubbles ? 'speech-bubble' : ''}} {{item.bubbleImage ? 'illustrated-bubble' : ''}}")
    s=s.replace('<text wx:if="{{chapter.overlayBubbles}}">{{item.text}}</text>', '<image wx:if="{{item.bubbleImage}}" class="bubble-lettering" src="{{item.bubbleImage}}" mode="scaleToFill" /><text wx:elif="{{chapter.overlayBubbles}}">{{item.text}}</text>')
    wxml.write_text(s,encoding='utf-8')
    css=folder/'index.wxss';s=(OLD/f'miniprogram/magic/p{label}/index.wxss').read_text(encoding='utf-8')
    if '.speech-bubble.illustrated-bubble{' not in s:
        s+='\n.speech-bubble.illustrated-bubble{display:block;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;overflow:visible}.bubble-lettering{display:block;width:100%;height:100%;pointer-events:none}.illustrated-bubble.active-bubble .bubble-lettering{filter:drop-shadow(0 0 2rpx #d8a335)}\n'
    css.write_text(s,encoding='utf-8')
p=OUT/'miniprogram/lib/reading.js';s=(OLD/'miniprogram/lib/reading.js').read_text(encoding='utf-8')
s=s.replace('text:b.displayText||b.text, style: rectStyle(b.rect, viewport)','text:b.displayText||b.text, bubbleImage:b.bubbleImage||null, style: rectStyle(b.visualRect||b.rect, viewport)')
p.write_text(s,encoding='utf-8')
for name in ['project.config.json','package.json']:
    p=OUT/name;p.write_text(p.read_text(encoding='utf-8').replace('1.2.1','1.2.2'),encoding='utf-8')
(OUT/'导入说明.txt').write_text('版本 1.2.2：英语复习 + Bluey 魔法木琴 + Magic 魔法\n\nMagic 气泡改成白底、深蓝手绘轮廓、尖尾巴和圆润手写字样，对照第一集制作。\n第一集字形属于插画，没有可提取的字体文件；本版以 Patrick Hand 加描边作视觉匹配，气泡字形统一输出，手机无需安装字体。\n微信开发者工具导入此目录。AppID：wxeffdeea9ba92682b。\n本地版本，未上传微信。原台词、原声和各模块阅读进度保留；既有说话人、原声切点待核项保持不变。\n',encoding='utf-8-sig')
shutil.copy2(ROOT/'web/bluey-reader/design/fonts/patrickhand-OFL.txt',OUT/'Patrick-Hand-LICENSE.txt')
for p in [ROOT/'scripts/verify-bluey-mini.cjs',OUT/'scripts/verify.cjs']:
    s=p.read_text(encoding='utf-8').replace('english-review-bluey-v4','english-review-bluey-v5').replace("version:'1.2.1'","version:'1.2.2'")
    s=s.replace('for(const b of panel.bubbles){assert.ok(b.rect[0]>=x&&b.rect[0]+b.rect[2]<=x+w);assert.ok(b.rect[1]>=y&&b.rect[1]+b.rect[3]<=y+h);}', 'for(const b of panel.bubbles){const r=b.visualRect||b.rect;assert.ok(r[0]>=x&&r[0]+r[2]<=x+w);assert.ok(r[1]>=y&&r[1]+r[3]<=y+h);if(b.bubbleImage)assert.ok(fs.statSync(path.join(appRoot,b.bubbleImage)).size>0);}')
    p.write_text(s,encoding='utf-8')
print(OUT)
