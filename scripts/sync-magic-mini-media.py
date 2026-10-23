"""Refresh the new 1.2.0 working project after reviewed artwork/layout corrections."""
from pathlib import Path
import copy,json,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
for d in ['.ocr_tools','.demo_deps']:sys.path.insert(0,str(ROOT/d))
from PIL import Image
APP=Path('E:/英语复习/miniprogram/english-review-bluey-v3/miniprogram')
book=json.loads((ROOT/'web/bluey-reader/data/s03e10.json').read_text(encoding='utf-8'))
for p in book['pages']:
 label=f'{p["number"]:02}';chapter=copy.deepcopy(p);chapter.update(episode='S03E10',overlayBubbles=True,label=label);folder=APP/f'magic/p{label}'
 for item in [chapter,*[c for n in chapter['panels'] for c in [n,*n['bubbles']]]]:
  key='image' if item is chapter else 'audio';source=ROOT/'output/S03E10/comic-v1/dist'/item[key];target=folder/'media'/source.name
  shutil.copy2(source,target);item[key]='/'+target.relative_to(APP).as_posix()
 (folder/'data.js').write_text('module.exports = '+json.dumps(chapter,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
 thumb=Image.open(ROOT/'output/S03E10/comic-v1/dist'/p['image']);thumb.thumbnail((72,108));thumb.save(APP/f'assets/thumbs/magic-{label}.jpg',quality=60,optimize=True)
print('Refreshed S03E10 assets; S01E01 and English review preserved.')
