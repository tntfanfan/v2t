from pathlib import Path
import sys, json, hashlib
sys.path.insert(0, 'E:/v2t/.demo_deps')
import av
from PIL import Image, ImageDraw, ImageFont
root = Path('E:/v2t')
out = root / 'output' / 'S01E01'
out.mkdir(parents=True, exist_ok=True)
files = sorted((root / 'input' / '第一季52集').rglob('S01E01*'))
metadata=[]
for path in files:
    with av.open(str(path)) as c:
        info = {'path':str(path), 'bytes':path.stat().st_size,
                'duration':c.duration/av.time_base, 'metadata':dict(c.metadata),
                'sha256':hashlib.file_digest(path.open('rb'),'sha256').hexdigest(),
                'streams':[{'index':s.index,'type':s.type,'codec':s.codec_context.name,
                  'width':getattr(s.codec_context,'width',None),'height':getattr(s.codec_context,'height',None),
                  'metadata':dict(s.metadata)} for s in c.streams]}
        metadata.append(info)
    if path.suffix.lower()=='.mp4':
        with av.open(str(path)) as c:
            s=c.streams.video[0]
            tiles=[]
            for ts in [1, 10, 26, 45, 80, 150, 250, 350]:
                c.seek(int(ts / s.time_base), stream=s)
                for f in c.decode(s):
                    if float(f.time)>=ts:
                        img=f.to_image(); img.thumbnail((640,360))
                        tile=Image.new('RGB',(640,390),'white'); tile.paste(img,(0,30))
                        ImageDraw.Draw(tile).text((10,6),f'{path.name} | {ts}s',fill='black')
                        tiles.append(tile);break
            sheet=Image.new('RGB',(1280,390*((len(tiles)+1)//2)),'white')
            for i,tile in enumerate(tiles):sheet.paste(tile,((i%2)*640,(i//2)*390))
            sheet.save(out/(path.stem+'_overview.jpg'),quality=90)
(out/'source_metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(metadata,ensure_ascii=True,indent=2))
