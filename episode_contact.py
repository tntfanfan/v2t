from pathlib import Path
import sys,argparse
sys.path.insert(0,'E:/v2t/.demo_deps')
import av
from PIL import Image,ImageDraw
arg=argparse.ArgumentParser();arg.add_argument('--times',type=float,nargs='+',required=True);arg.add_argument('--name',default='details');args=arg.parse_args()
root=Path('E:/v2t');out=root/'output'/'S01E01'
source=root/'input'/'第一季52集'/'分集视频'/'1-2'/'S01E01.mp4'
sheet=Image.new('RGB',(1280,395*((len(args.times)+1)//2)),'white')
with av.open(str(source)) as c:
    stream=c.streams.video[0]
    for i,ts in enumerate(args.times):
        c.seek(int(ts/stream.time_base),stream=stream)
        for frame in c.decode(stream):
            if float(frame.time)>=ts:
                image=frame.to_image();image.thumbnail((640,360))
                tile=Image.new('RGB',(640,395),'white');tile.paste(image,(0,35));ImageDraw.Draw(tile).text((10,8),f'{ts:.2f}s',fill='black')
                sheet.paste(tile,((i%2)*640,(i//2)*395));break
sheet.save(out/f'{args.name}.jpg',quality=95)
print(out/f'{args.name}.jpg')
