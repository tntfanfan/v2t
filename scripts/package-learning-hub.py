"""Verify unchanged learning media, then save the new local UI delivery."""
from pathlib import Path
import json, hashlib, zipfile

ROOT=Path('E:/英语复习')
WEB=ROOT/'learning-hub-v1'
MINI=ROOT/'miniprogram/english-review-bluey-v6'
OLD=ROOT/'miniprogram/english-review-bluey-v5'
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def dump(p,obj): p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
count=0
for p in (OLD/'miniprogram').rglob('*'):
    if p.is_file() and p.suffix in ['.png','.jpg','.mp3']:
        assert digest(p)==digest(MINI/'miniprogram'/p.relative_to(OLD/'miniprogram')),p
        count+=1
for name in ['content','learning']:
    assert digest(OLD/f'miniprogram/review/lib/{name}.js')==digest(MINI/f'miniprogram/lib/english/{name}.js')
for name in ['s01e01','s03e10']:
    # The web catalog/player uses the original source book data from the previous delivery.
    assert (WEB/'bluey/book-data.js').read_bytes()==Path('E:/v2t/output/bluey-library-v3/dist/book-data.js').read_bytes()
report={
    'version':'1.3.0','date':'2026-10-22','status':'local_preview_ready',
    'welcomePage':'Two product introductions with separate entrances',
    'englishPages':['overview','words','build','quiz','chant','story','progress'],
    'blueyPages':['catalog','reader'],
    'preservedMiniMediaFiles':count,'learningRulesAndContentUnchanged':True,
    'originalMiniStorageKeysPreserved':True,'webPreviewOrigin':'http://127.0.0.1:5175/',
    'webProgressNote':'New local preview origin stores its own progress; previous web origins remain unchanged.',
    'webChecks':'Navigation, back, direct routes, English/Bluey audio, persistence and widths 390/768/1380 passed.',
    'miniChecks':'29 tests passed; 31 routes checked; 262 WXML states compiled; original audio hashes verified.',
    'visualReview':'Welcome, product overview, activity and reader previews inspected at mobile sizes; desktop welcome inspected.',
    'limitations':['Mini previews are compiled-WXML browser renders, not the native WeChat runtime.','No physical phone check or cloud upload for 1.3.0.'],
    'uploaded':False,'published':False,
}
for folder in [WEB,MINI]:dump(folder/'qa/navigation-review.json',report)
dump(WEB/'project.json',{'title':'英语小花园 · 迎宾首页版','version':'1.3.0','preview':'http://127.0.0.1:5175/','products':['Unit 2 英语复习','Bluey 原声漫画（S01E01、S03E10）'],'cloudStatus':'not_uploaded','miniProject':str(MINI)})

for source,target in [(MINI,ROOT/'miniprogram/英语小花园_迎宾首页_1.3.0_小程序.zip'),(WEB,ROOT/'output/英语小花园_迎宾首页_1.3.0_网页版.zip')]:
    with zipfile.ZipFile(target,'x',zipfile.ZIP_DEFLATED) as z:
        for p in sorted(source.rglob('*')):
            if p.is_file() and p.name not in ['project.private.config.json','package-delivery.json'] and ('qa' not in p.relative_to(source).parts or p.suffix=='.json'):
                z.write(p,Path(source.name)/p.relative_to(source))
    with zipfile.ZipFile(target) as z:assert z.testzip() is None
    dump(source/'qa/package-delivery.json',{'archive':str(target),'bytes':target.stat().st_size,'sha256':digest(target),'version':'1.3.0','uploaded':False})
    print(target.name,target.stat().st_size,'bytes')
print('All',count,'existing mini media files preserved.')
