"""Build the reviewed S03E10 storyboard into original-audio reader assets.

Only writes the new comic-v1 working edition, never S01E01 media.
"""
from pathlib import Path
import argparse, concurrent.futures, difflib, hashlib, importlib.util, json, math, re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/S03E10/comic-v1'
for d in ['.ocr_tools','.demo_deps']:sys.path.insert(0,str(ROOT/d))
from PIL import Image,ImageFont
spec=importlib.util.spec_from_file_location('old_builder',ROOT/'web/bluey-reader/build.py')
old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
FFMPEG=old.find_ffmpeg(ROOT)
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def save(p,v):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def norm(s):return re.findall(r"[a-z0-9]+",s.lower().replace('’',"'"))
def aligned(b,words):
 target=norm(b['text']);local=[w for w in words if w['end']>=b['start']-1.5 and w['start']<=b['end']+1.5]
 candidates=[]
 for i in range(len(local)):
  for j in range(i+1,min(len(local),i+len(target)+4)+1):
   chunk=local[i:j];tokens=[t for w in chunk for t in norm(w['word'])]
   if not tokens or tokens[0]!=target[0] or tokens[-1]!=target[-1]:continue
   ratio=difflib.SequenceMatcher(None,target,tokens,autojunk=False).ratio()
   if ratio < .9 or (len(target)<4 and ratio<1):continue
   a,z=chunk[0]['start'],chunk[-1]['end']
   if z-a<.08 or a<b['start']-1.1 or z>b['end']+1.1:continue
   score=ratio-.025*(abs(a-b['start'])+abs(z-b['end']))
   candidates.append((score,a,z,ratio))
 if candidates:
  _,a,z,ratio=max(candidates)
  return round(max(0,a-.1),3),round(z+.14,3),'nearby_asr_word_match',ratio
 return round(max(0,b['start']-.15),3),round(b['end']+.15,3),'subtitle_window_approximate',None
def lines(text,font,width):
 rows=['']
 for word in text.split():
  trial=(rows[-1]+' '+word).strip()
  if rows[-1] and font.getlength(trial)>width:rows.append(word)
  else:rows[-1]=trial
 return rows
def layout(bubbles,rect):
 x,y,w,h=rect
 for size in [23,22,21,20,19]:
  f=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',size)
  specs=[]
  for b in bubbles:
   bw=min(w-28,max(110,math.ceil(f.getlength(b['text']))+26))
   rows=lines(b['text'],f,bw-26)
   bh=math.ceil(len(rows)*size*1.2+22)
   specs.append((bw,bh,rows))
  if sum(t[1]+7 for t in specs)<=h*.47:break
 assert sum(t[1]+7 for t in specs)<h*.59,(rect,bubbles)
 yy=y+12
 for i,(b,(bw,bh,rows)) in enumerate(zip(bubbles,specs)):
  bx=x+14 if i%2==0 else x+w-bw-14
  b.update(rect=[bx,yy,bw,bh],fontSize=size,displayText='\n'.join(rows))
  yy+=bh+7
def geometry(path):
 im=Image.open(path).convert('RGB');width,height=im.size
 # Read only: locate long blue border lines in generated artwork.
 ys=[]
 for y in range(1,height-1):
  n=sum(1 for r,g,b in (im.getpixel((x,y)) for x in range(10,width-10,3)) if b>150 and b>g+35 and 45<g<160 and r<60)
  if n>190:ys.append(y)
 groups=[]
 for y in ys:
  if not groups or y>groups[-1][-1]+2:groups.append([y])
  else:groups[-1].append(y)
 centers=[round(sum(g)/len(g)) for g in groups]
 if len(centers)==6:bounds=centers
 else:
  # Match the three wide frame rows without assuming an identical margin.
  first=min(centers,key=lambda y:abs(y-45));last=min(centers,key=lambda y:abs(y-1500))
  splits=[min(centers,key=lambda y:abs(y-t)) for t in [520,995]]
  bounds=[first,splits[0]-5,splits[0]+5,splits[1]-5,splits[1]+5,last]
 return width,height,[[16 if i%2==0 else 516,bounds[(i//2)*2],492,bounds[(i//2)*2+1]-bounds[(i//2)*2]] for i in range(6)]
def main():
 args=argparse.ArgumentParser();args.add_argument('--audio-only',action='store_true');args=args.parse_args()
 story=read(OUT/'work/storyboard.json');transcript=read(OUT/'transcript.v1.json')
 registry=read(ROOT/'series/bluey/characters.json');names={c['id']:c['display_name'] for c in registry['characters']}
 words=[w for s in read(OUT/'work/asr.json')['segments'] for w in s.get('words',[])]
 source=ROOT/transcript['sources'][0]['path'];assert old.sha256(source)==transcript['sources'][0]['sha256']
 book={'id':'bluey-s03e10-comic-web-v1','episode':'S03E10','title':'Magic','titleZh':'魔法','overlayBubbles':True,'pages':[]}
 timing=[]
 for page in story['pages']:
  pn=page['number'];art=OUT/f'deliverables/pages/page-{pn:02}.png'
  revised=OUT/f'deliverables/pages/page-{pn:02}-r2.png'
  if revised.exists():art=revised
  revised=OUT/f'deliverables/pages/page-{pn:02}-r3.png'
  if revised.exists():art=revised
  if args.audio_only:w,h,rects=1024,1536,[[16 if i%2==0 else 516,[88,520,986][i//2],492,[422,455,500][i//2]] for i in range(6)]
  else:
   w,h,rects=geometry(art)
   assert (w,h)==(1024,1536),f'Review page size before composing: {art} {(w,h)}'
   imageout=OUT/f'dist/assets/s03e10/pages/page-{pn:02}.jpg';imageout.parent.mkdir(parents=True,exist_ok=True)
   Image.open(art).convert('RGB').save(imageout,quality=82,optimize=True)
  target={'number':pn,'title':page['title'],'image':f'assets/s03e10/pages/page-{pn:02}.jpg','width':w,'height':h,'imageWidth':w,'imageHeight':h,'panels':[]}
  for idx,p in enumerate(page['panels']):
   n=p['number'];panel={'id':f'magic-panel-{n:03}','number':n,'page':pn,'rect':rects[idx],'bubbles':[],'ambient':False}
   for bi,b in enumerate(p['bubbles'],1):
    start,end,method,score=aligned(b,words);bid=f'magic-p{pn:02}-n{n:03}-b{bi:02}'
    bubble={'id':bid,'text':b['text'],'speaker':' / '.join(names[s] for s in b['speaker_ids']) or '画面声音 · 说话人待核','speakerIds':b['speaker_ids'],'sourceIds':b['sourceIds'],'kind':'dialogue','start':start,'end':end,'duration':round(end-start,3),'audio':f'assets/s03e10/audio/{bid}.mp3','note':b['note']}
    panel['bubbles'].append(bubble);timing.append({'id':bid,'text':b['text'],'ocr_ids':b['ocr_ids'],'sourceIds':b['sourceIds'],'start':start,'end':end,'method':method,'asr_score':score})
   layout(panel['bubbles'],rects[idx])
   panel.update(start=min(p['start']-.15,*[b['start'] for b in panel['bubbles']]),end=max(p['end']+.15,*[b['end'] for b in panel['bubbles']]),audio=f'assets/s03e10/audio/{panel["id"]}.mp3')
   panel['start']=round(panel['start'],3);panel['end']=round(panel['end'],3);panel['duration']=round(panel['end']-panel['start'],3)
   target['panels'].append(panel)
  # Compose text + original illustration in code. No speech covers character faces.
  row_y=16
  for row in range(3):
   pair=target['panels'][row*2:row*2+2]
   text_h=max(max(b['rect'][1]+b['rect'][3]-p['rect'][1] for b in p['bubbles']) for p in pair)+14
   art_h=max(p['rect'][3] for p in pair)
   for p in pair:
    original=p['rect'];p['imageRect']=original[:]
    for b in p['bubbles']:b['rect'][1]+=row_y-original[1]
    p['artRect']=[original[0],row_y+text_h,original[2],original[3]]
    p['rect']=[original[0],row_y,original[2],text_h+art_h]
   row_y+=text_h+art_h+16
  target['height']=row_y
  book['pages'].append(target)
 clips=[c for p in book['pages'] for n in p['panels'] for c in [n,*n['bubbles']]]
 assert len(clips)==261
 assert [i for p in book['pages'] for n in p['panels'] for b in n['bubbles'] for i in b['sourceIds']]==list(range(1,228))
 def cut(c):
  out=OUT/'dist'/c['audio'];out.parent.mkdir(parents=True,exist_ok=True)
  if not out.exists():
   subprocess.run([FFMPEG,'-nostdin','-v','error','-i',str(source),'-ss',str(c['start']),'-t',str(c['duration']),'-map','0:a:0','-vn','-ac','1','-ar','44100','-codec:a','libmp3lame','-b:a','48k','-map_metadata','-1',str(out)],check=True,capture_output=True)
  subprocess.run([FFMPEG,'-nostdin','-v','error','-i',str(out),'-f','null','-'],check=True,capture_output=True)
  c['sha256']=old.sha256(out)
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(cut,clips))
 save(OUT/'work/book-data.json',book)
 save(OUT/'qa/source-audio.json',{'source':transcript['sources'][0],'audio_stream':'0:a:0','encoding':'original audio, mono MP3 48kbps; no TTS','clips':len(clips),'all_clips_decoded':True,'manual_listening':'pending; ASR matches and subtitle windows are approximate','timing':timing})
 if not args.audio_only:save(ROOT/'web/bluey-reader/data/s03e10.json',book)
 print(json.dumps({'pages':12,'panels':72,'bubbles':189,'audio_clips':len(clips),'asr_aligned':sum(t['method']=='nearby_asr_word_match' for t in timing),'approximate':sum(t['method']!='nearby_asr_word_match' for t in timing)},ensure_ascii=False))
if __name__=='__main__':main()
