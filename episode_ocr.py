from pathlib import Path
import sys, json, time, difflib
sys.path[:0]=['E:/v2t/.ocr_tools','E:/v2t/.demo_deps']
import av
import numpy as np
from PIL import Image,ImageDraw
from rapidocr_onnxruntime import RapidOCR

root=Path('E:/v2t');out=root/'output'/'S01E01';frames=out/'frames';frames.mkdir(exist_ok=True)
source=root/'input'/'第一季52集'/'分集视频'/'1-2'/'S01E01.mp4'
engine=RapidOCR(intra_op_num_threads=2,inter_op_num_threads=1,det_limit_side_len=1280,det_limit_type='max')
rows=[];target=0.25;begun=time.time()
log=(out/'ocr_frames.jsonl').open('w',encoding='utf-8')
with av.open(str(source)) as video:
    for frame in video.decode(video=0):
        ts=float(frame.time)
        if ts<target:continue
        target+=0.5
        img=frame.to_image()
        thumb=img.copy();thumb.thumbnail((640,360));thumb.save(frames/f'{ts:07.2f}.jpg',quality=85)
        crop=img.crop((0,825,1920,1080));crop.thumbnail((1280,170))
        results,_=engine(np.asarray(crop),use_cls=False)
        results=results or []
        results.sort(key=lambda x:(round(min(p[1] for p in x[0])/15),min(p[0] for p in x[0])))
        text=' '.join(r[1] for r in results if r[2]>.5)
        item={'time':ts,'text':text,'confidence':sum(float(r[2]) for r in results)/len(results) if results else 0}
        rows.append(item);log.write(json.dumps(item,ensure_ascii=False)+'\n');log.flush()
        if len(rows)%60==0:print(f'{ts:.1f}s processed in {time.time()-begun:.1f}s',flush=True)
log.close()
groups=[];current=None
for row in rows:
    text=row['text'].strip()
    if not text:
        if current:groups.append(current);current=None
        continue
    if current and difflib.SequenceMatcher(None,current['text'].lower(),text.lower()).ratio()>.88:
        current['end']=row['time']+.25
        if row['confidence']>current['confidence']:
            current['text']=text;current['confidence']=row['confidence']
    else:
        if current:groups.append(current)
        current={'start':max(0,row['time']-.25),'end':row['time']+.25,'time':row['time'],'text':text,'confidence':row['confidence']}
if current:groups.append(current)
for i,g in enumerate(groups,1):g['id']=i
(out/'ocr_subtitles.json').write_text(json.dumps(groups,ensure_ascii=False,indent=2),encoding='utf-8')
for offset in range(0,len(groups),8):
    batch=groups[offset:offset+8]
    sheet=Image.new('RGB',(1280,395*((len(batch)+1)//2)),'white')
    for i,g in enumerate(batch):
        img=Image.open(frames/f"{g['time']:07.2f}.jpg")
        tile=Image.new('RGB',(640,395),'white');tile.paste(img,(0,35))
        ImageDraw.Draw(tile).text((8,8),f"#{g['id']:03} | {g['start']:06.2f}-{g['end']:06.2f}",fill='black')
        sheet.paste(tile,((i%2)*640,(i//2)*395))
    sheet.save(out/f'captions_{offset//8+1:02}.jpg',quality=93)
print(f'Done: {len(rows)} frames; {len(groups)} subtitle groups.',flush=True)
