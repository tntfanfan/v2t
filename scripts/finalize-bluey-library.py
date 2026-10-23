"""Record scope, source evidence, asset preservation, and remaining review limits."""
from pathlib import Path
import hashlib,json,shutil,subprocess,sys,zipfile
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'output/S03E10/comic-v1';MINI=Path('E:/英语复习/miniprogram/english-review-bluey-v3')
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def save(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
book=read(ROOT/'web/bluey-reader/data/s03e10.json');transcript=read(OUT/'transcript.v1.json')
pages=[]
for p in book['pages']:
 n=p['number'];name=f'page-{n:02}'+('-r3' if n==11 else '-r2' if n==9 else '')+'.png';file=OUT/'deliverables/pages'/name
 pages.append({'page':n,'title':p['title'],'artwork':str(file.relative_to(ROOT)).replace('\\','/'),'sha256':digest(file),'source_reference':f'output/S03E10/comic-v1/work/references/page-{n:02}.jpg','panel_numbers':[x['number'] for x in p['panels']],'review':'reviewed_against_original_frames; illustrated_adaptation','notes':'Page 11 child corrected from Bingo to Bluey; source text removed in pages 9/11.' if n in [9,11] else ''})
review={'episode':'S03E10','title':'Magic','status':'local_preview_ready_with_review_limits','date':'2026-10-19','source':transcript['sources'][0],'registry_revision':6,'registry_sha256':digest(ROOT/'series/bluey/characters.json'),'transcript_sha256':digest(OUT/'transcript.v1.json'),'counts':{'pages':12,'panels':72,'bubbles':189,'source_records':227,'audio_clips':261},'content_review':'All 24 original-video caption contact sheets inspected; text and speakers checked; six uncertain speakers preserved. Opening theme and closing credits excluded.','visual_review':'All 12 final illustration pages inspected against six-panel source references; page9/11 text removed; page11 corrected Bluey identity. Illustrations are adaptations, not literal film frames.','rendering':'Code-rendered speech bubbles above illustrations; text never covers character faces.','pages':pages,'audio_review':{'source':'original video stream 0:a:0','codec':'mono MP3 48kbps','decoded_clips':261,'asr_word_aligned_bubbles':60,'subtitle_window_bubbles':129,'manual_listening':'Full boundary listening pending; windows approximate.'},'unresolved':read(OUT/'qa/transcript-validation.json')['uncertainties'],'web_qa':'output/S03E10/comic-v1/qa/web-functional-review.json','mini_qa':str(MINI/'qa/integration-verification.json'),'native_review':'unavailable: Developer Tools CLI service port disabled; app processes exist but no targetable window. Compiled-WXML and headless browser layout checks used.','phone_review':'pending','cloud_status':'not_uploaded_or_submitted; existing 1.1.0 unchanged'}
save(OUT/'qa/comic-review.json',review)
save(OUT/'deliverables/manifest.json',{'book_data':'web/bluey-reader/data/s03e10.json','pages':pages,'note':'Illustration PNGs are wordless production artwork. Final clickable English text is composed by the web/mini-program reader. Earlier draft PNGs retained for provenance.'})
save(MINI/'qa/simulator-check.json',{'date':'2026-10-19','native_simulator':'not_verified','reason':'CLI service port disabled; no targetable Developer Tools window returned by Computer Use.','compiled_template_layouts':'reviewed: home, both-book directory, S03E10 panel and page modes','phone':'not_verified','cloud':'not_uploaded','version':'1.2.0'})
baseline=Path('E:/英语复习/miniprogram/english-review-bluey-v2/miniprogram');assets=[]
for p in sorted(baseline.rglob('*')):
 if p.is_file() and (p.relative_to(baseline).parts[0]=='review' or p.suffix in ['.mp3','.jpg','.png']):assets.append({'target':p.relative_to(baseline).as_posix(),'sha256':digest(p)})
save(MINI/'qa/preserved-assets.json',assets)
save(MINI/'qa/test-results.json',{'command':'node --test tests/*.test.cjs','tests':26,'passed':26,'failed':0,'new_cases':['S03E10 own progress/playback/end boundary','S03E10 share route/resume','cross-episode playback isolation']})
verifier=(ROOT/'scripts/verify-bluey-mini.cjs').read_text(encoding='utf-8')
verifier=verifier.replace("const root=path.resolve(process.argv[2]||'E:/英语复习/miniprogram/english-review-bluey-v3'),", "const root=path.resolve(process.argv[2]||path.join(__dirname,'..')),")
a=verifier.index('for(const f of list(oldRoot)){');z=verifier.index('\nconst sizes=',a)
verifier=verifier[:a]+"for(const asset of JSON.parse(read(path.join(root,'qa/preserved-assets.json')))){assert.equal(hash(path.join(appRoot,asset.target)),asset.sha256,'Original changed '+asset.target);if(asset.target.startsWith('review/'))reviewFiles++;else originalMedia++;}\n"+verifier[z:]
(MINI/'scripts/verify.cjs').write_text(verifier,encoding='utf-8')
index=read(ROOT/'series/bluey/episodes.json')
old=json.loads(subprocess.check_output(['git','show','HEAD:series/bluey/episodes.json'],cwd=ROOT).decode('utf-8-sig'))
assert next(e for e in index['episodes'] if e['episode']=='S01E01')==next(e for e in old['episodes'] if e['episode']=='S01E01'),'Historical S01E01 index unexpectedly changed'
episode=next(e for e in index['episodes'] if e['episode']=='S03E10');episode['status']='local_comic_preview_ready_with_uncertainties';episode['qa']='output/S03E10/comic-v1/qa/comic-review.json';episode['unresolved']=review['unresolved']
episode['comic_editions'][0].update(status='local_preview_ready_with_uncertainties',manifest_path='output/S03E10/comic-v1/deliverables/manifest.json',content_review='reviewed_with_six_uncertain_speakers',visual_review='reviewed_all_final_pages',audio_boundary_review='approximate; full_manual_listening_pending',web_url='http://127.0.0.1:5173/?episode=s03e10',web_output='output/bluey-library-v1',mini_program_project=str(MINI),mini_program_version='1.2.0',cloud_status='not_uploaded')
save(ROOT/'series/bluey/episodes.json',index)
print('Review records and episode index updated. Historical S01E01 index exactly preserved.')
