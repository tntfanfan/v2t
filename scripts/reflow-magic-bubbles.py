"""Layout-only revision: keep original images/audio and place every bubble inside its panel."""
from pathlib import Path
import copy, hashlib, itertools, json, math, shutil, sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'.ocr_tools'))
sys.path.insert(0, str(ROOT/'.demo_deps'))
from PIL import ImageFont
OLD = ROOT/'output/S03E10/comic-v1'
OUT = ROOT/'output/S03E10/comic-v2'
FONT_SIZE = 22
FONT = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', FONT_SIZE)

# One-based bubble numbers, arranged in reading rows inside reviewed background areas.
# Separate top/bottom groups keep dense dialogue away from faces in close-up frames.
TOP = {
 1:[[1]],2:[[1],[2]],3:[[1],[2]],4:[[1,2,3]],5:[[1,2],[3,4]],6:[[1],[2]],
 7:[[1,2,3],[4]],8:[[1,2],[3]],9:[[1],[2,3]],10:[[1,2]],11:[[1,2],[3]],
 13:[[1],[2]],14:[[1],[2,3]],15:[[1]],16:[[1,2],[3,4]],17:[[1]],18:[[1],[2]],
 19:[[1,2],[3,4]],20:[[1],[2]],21:[[1]],22:[[1]],23:[[1,2],[3]],24:[[1],[2]],
 25:[[1,2,3]],26:[[1,2,3,4]],27:[[1]],29:[[1]],30:[[1]],31:[[1,2,3]],
 34:[[1,2],[3]],35:[[1,2]],37:[[1]],38:[[1,2]],39:[[1,2]],40:[[1]],41:[[1,2],[3]],
 43:[[1]],45:[[1]],46:[[1]],47:[[1,2]],48:[[1]],49:[[1]],50:[[1]],51:[[1]],52:[[1]],
 53:[[1,2]],54:[[1]],57:[[1]],60:[[1],[2,3]],61:[[1,2]],62:[[1]],63:[[1,2]],64:[[1]],
 65:[[1]],66:[[1,2]],67:[[1,2]],68:[[1,2]],69:[[1]],70:[[1]],71:[[1]],72:[[1]]}
BOTTOM = {
 12:[[2]],18:[[3,4]],21:[[2]],22:[[2]],23:[[4]],27:[[2]],28:[[1],[2,3]],29:[[2]],30:[[2]],
 32:[[1],[2]],33:[[2,3]],35:[[3]],36:[[1],[2]],37:[[2]],39:[[3,4,5]],40:[[2]],42:[[2]],
 43:[[2]],44:[[4]],45:[[2,3]],46:[[2,3,4]],47:[[3]],49:[[2,3]],50:[[2]],51:[[2]],52:[[2,3]],
 53:[[3,4]],56:[[2,3]],57:[[2,3]],58:[[2],[3,4]],59:[[3,4,5]],67:[[3]],68:[[3,4]],
 69:[[2]],70:[[2,3]],71:[[2,3]],72:[[2,3]]}
# Explicit narrow background areas for close-ups, (indices, local x/y, available width).
CUSTOM = {
 12:[([1],12,12,250)],33:[([1],260,12,220)],42:[([1],250,12,230)],
 44:[([1],12,12,168),([2],382,12,98),([3],12,183,181)],
 55:[([1],180,213,300),([2],12,346,100)],56:[([1],204,12,276)],58:[([1],12,12,220)],
 59:[([1],12,12,230),([2],254,12,226)]}

def wrap(text, width):
    lines=[];line=''
    for word in text.split():
        trial=(line+' '+word).strip()
        if line and FONT.getlength(trial)>width:lines.append(line);line=word
        else:line=trial
    if line:lines.append(line)
    assert all(FONT.getlength(line)<=width+0.1 for line in lines), (text,width)
    return lines

def fit_row(bubbles, width):
    natural=[max(78,math.ceil(FONT.getlength(b['text']))+40) for b in bubbles]
    minimum=[max(78,math.ceil(max(FONT.getlength(word) for word in b['text'].split()))+40) for b in bubbles]
    room=width-8*(len(bubbles)-1)
    if sum(natural)<=room: widths=natural
    elif len(bubbles)==1: widths=[room]
    else:
        # Choose widths that minimize line count, giving short interjections compact bubbles.
        options=[range(m,min(n,room-sum(minimum)+m)+1,8) for m,n in zip(minimum[:-1],natural[:-1])]
        candidates=[]
        for first in itertools.product(*options):
            last=room-sum(first)
            if last<minimum[-1]:continue
            widths=[*first,last]
            lines=[len(wrap(b['text'],w-40)) for b,w in zip(bubbles,widths)]
            candidates.append(((max(lines),sum(lines),sum((w/n-1)**2 for w,n in zip(widths,natural))),widths))
        widths=min(candidates)[1]
    rows=[wrap(b['text'],w-40) for b,w in zip(bubbles,widths)]
    heights=[math.ceil(len(lines)*FONT_SIZE*1.2+20) for lines in rows]
    return widths,rows,heights

def place(panel, row_indices, anchor='top', x=12, y=None, width=468):
    plans=[]
    for indices in row_indices:
        bubbles=[panel['bubbles'][i-1] for i in indices]
        widths,lines,heights=fit_row(bubbles,width)
        plans.append((bubbles,widths,lines,heights))
    total=sum(max(p[3]) for p in plans)+8*(len(plans)-1)
    yy=y if y is not None else (12 if anchor=='top' else panel['rect'][3]-12-total)
    px,py,_,_=panel['rect']
    for ri,(bubbles,widths,lines,heights) in enumerate(plans):
        occupied=sum(widths)+8*(len(widths)-1)
        xx=x+(width-occupied)*(0 if ri%2==0 else 1)
        for b,w,ls,h in zip(bubbles,widths,lines,heights):
            b.update(rect=[px+xx,py+yy,w,h],displayText='\n'.join(ls),fontSize=FONT_SIZE)
            xx+=w+8
        yy+=max(heights)+8

def reflow(book):
    for page in book['pages']:
        page['width']=page['imageWidth'];page['height']=page['imageHeight']
        for panel in page['panels']:
            panel['rect']=panel['imageRect'][:];panel['artRect']=panel['imageRect'][:]
            n=panel['number'];assigned=[]
            for anchor,table in [('top',TOP),('bottom',BOTTOM)]:
                if n in table:
                    place(panel,table[n],anchor);assigned.extend(i for row in table[n] for i in row)
            for indices,x,y,w in CUSTOM.get(n,[]):
                place(panel,[indices],x=x,y=y,width=w);assigned.extend(indices)
            assert sorted(assigned)==list(range(1,len(panel['bubbles'])+1)), n
            x,y,w,h=panel['imageRect']
            for b in panel['bubbles']:
                bx,by,bw,bh=b['rect'];assert x+8<=bx and y+8<=by and bx+bw<=x+w-8 and by+bh<=y+h-8,(n,b['rect'])
            for a,b in itertools.combinations(panel['bubbles'],2):
                ax,ay,aw,ah=a['rect'];bx,by,bw,bh=b['rect']
                assert ax+aw<=bx or bx+bw<=ax or ay+ah<=by or by+bh<=ay, ('overlap',n)
    book['layoutRevision']=2
    return book

if __name__=='__main__':
    source=json.loads((OLD/'work/book-data.json').read_text(encoding='utf-8'))
    book=reflow(copy.deepcopy(source))
    OUT.mkdir(exist_ok=True)
    for name in ['work','qa']: (OUT/name).mkdir(exist_ok=True)
    if not (OUT/'dist').exists():shutil.copytree(OLD/'dist',OUT/'dist')
    data=json.dumps(book,ensure_ascii=False,indent=2)
    (OUT/'work/book-data.json').write_text(data,encoding='utf-8')
    (ROOT/'web/bluey-reader/data/s03e10.json').write_text(data,encoding='utf-8')
    (OUT/'dist/book-data.js').write_text('window.COMIC_BOOK = '+data+';\n',encoding='utf-8')
    report={'revision':2,'basedOn':'comic-v1','scope':'Speech bubbles inside original image rectangles; no media or dialogue changes.','pages':12,'panels':72,'bubbles':189,'fontSize':FONT_SIZE,'status':'geometry_passed_visual_review_pending'}
    (OUT/'qa/layout-review.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('Reflowed all 189 speech bubbles inside 72 original panels.')
