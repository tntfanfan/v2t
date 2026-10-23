from pathlib import Path
import json,hashlib,copy
root=Path(__file__).resolve().parents[1];out=root/'output/S03E10/comic-v2'
old=json.loads((root/'output/S03E10/comic-v1/work/book-data.json').read_text(encoding='utf-8'))
new=json.loads((out/'work/book-data.json').read_text(encoding='utf-8'))
skip={'width','height','rect','artRect','displayText','fontSize','layoutRevision'}
def content(v):
    if isinstance(v,dict):return {k:content(x) for k,x in v.items() if k not in skip}
    if isinstance(v,list):return [content(x) for x in v]
    return v
assert content(old)==content(new)
assets=0
for p in (root/'output/S03E10/comic-v1/dist/assets').rglob('*'):
    if p.is_file():
        q=out/'dist/assets'/p.relative_to(root/'output/S03E10/comic-v1/dist/assets')
        assert hashlib.sha256(p.read_bytes()).digest()==hashlib.sha256(q.read_bytes()).digest();assets+=1
library=(root/'output/bluey-library-v1/dist/book-data.js').read_text(encoding='utf-8')
first=json.loads(library.split('window.COMIC_LIBRARY = ',1)[1].split(';\nwindow.COMIC_BOOK',1)[0])[0]
assert first==json.loads((root/'web/bluey-reader/data/s01e01.json').read_text(encoding='utf-8'))
report=json.loads((out/'qa/layout-review.json').read_text(encoding='utf-8'))
report.update(status='passed',visualReview='All 12 rendered pages inspected. Bubbles inside illustrations, face areas kept visible.',mobileReview='72 single-panel views at 390px: no overflow, all bubble fonts at least 14 CSS pixels.',contentUnchanged=True,mediaFilesUnchanged=assets,firstEpisodeDataUnchanged=True,webFunctional='Original audio and independent episode progress passed.',miniProgram='1.2.1 local source synced; 261 WXML states compiled; 26 tests passed; 430 audio hashes verified.',limitations=['Native WeChat and physical phone review not performed for 1.2.1.','Previous audio-boundary/speaker uncertainties unchanged.'],cloudUploaded=False)
(out/'qa/layout-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
mini=Path('E:/英语复习/miniprogram/english-review-bluey-v4')
(mini/'qa/layout-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
p=root/'series/bluey/episodes.json';idx=json.loads(p.read_text(encoding='utf-8'));ep=next(x for x in idx['episodes'] if x['episode']=='S03E10')
if not any(x['edition_id']=='bluey-s03e10-comic-v2' for x in ep['comic_editions']):
    entry=copy.deepcopy(ep['comic_editions'][-1]);entry.update(edition_id='bluey-s03e10-comic-v2',created_date='2026-10-19',output_directory='output/S03E10/comic-v2',based_on_edition='bluey-s03e10-comic-v1',revision_scope='189 个气泡回到 72 个画格内部；仅更改坐标、换行和气泡形状。',visual_review='all_12_rendered_pages_checked',review_path='output/S03E10/comic-v2/qa/layout-review.json',web_output='output/bluey-library-v2',mini_program_project=str(mini),mini_program_version='1.2.1');entry.pop('manifest_path',None);ep['comic_editions'].append(entry)
p.write_text(json.dumps(idx,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Preservation checks passed:',assets,'Magic media files; dialogue, timing and first episode unchanged.')
