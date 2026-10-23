"""Create the 1.2.1 local layout revision without changing the 1.2.0 delivery."""
from pathlib import Path
import copy,json,shutil
ROOT=Path(__file__).resolve().parents[1]
OLD=Path('E:/英语复习/miniprogram/english-review-bluey-v3')
OUT=OLD.with_name('english-review-bluey-v4')
if not OUT.exists():
    shutil.copytree(OLD,OUT,ignore=shutil.ignore_patterns('qa','project.private.config.json'))
    (OUT/'qa').mkdir()
    shutil.copy2(OLD/'qa/preserved-assets.json',OUT/'qa/preserved-assets.json')
book=json.loads((ROOT/'web/bluey-reader/data/s03e10.json').read_text(encoding='utf-8'))
for page in book['pages']:
    label=f'{page["number"]:02}'
    chapter=copy.deepcopy(page);chapter.update(episode='S03E10',overlayBubbles=True,label=label)
    folder=OUT/f'miniprogram/magic/p{label}'
    for item in [chapter,*[c for p in chapter['panels'] for c in [p,*p['bubbles']]]]:
        key='image' if item is chapter else 'audio'
        item[key]=f'/magic/p{label}/media/{Path(item[key]).name}'
    (folder/'data.js').write_text('module.exports = '+json.dumps(chapter,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    css=folder/'index.wxss';css.write_text(css.read_text(encoding='utf-8').replace('border-radius:40% / 45%','border-radius:1.15em'),encoding='utf-8')
for name in ['project.config.json','package.json']:
    p=OUT/name;s=p.read_text(encoding='utf-8').replace('1.2.0','1.2.1');p.write_text(s,encoding='utf-8')
p=OUT/'导入说明.txt'
p.write_text('1.2.1 气泡排版修订：Magic 的 189 个气泡全部放回画格内，按画面分布在顶部、底部或侧面。第一集、英语复习与所有原声音频保持不变。\n\n'+(OLD/'导入说明.txt').read_text(encoding='utf-8-sig').replace('1.2.0','1.2.1').replace('english-review-bluey-v3','english-review-bluey-v4'),encoding='utf-8-sig')
for p in [ROOT/'scripts/verify-bluey-mini.cjs',OUT/'scripts/verify.cjs']:
    s=p.read_text(encoding='utf-8').replace('english-review-bluey-v3','english-review-bluey-v4').replace("version:'1.2.0'","version:'1.2.1'")
    s=s.replace('b.rect[1]+b.rect[3]<=panel.artRect[1]','b.rect[1]+b.rect[3]<=y+h')
    s=s.replace('const [x,y,w,h]=panel.rect;','assert.deepEqual(panel.rect,panel.imageRect);assert.deepEqual(panel.artRect,panel.imageRect);\n    const [x,y,w,h]=panel.imageRect;')
    p.write_text(s,encoding='utf-8')
print(OUT)
