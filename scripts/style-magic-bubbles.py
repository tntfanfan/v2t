"""Build comic-native white speech balloons and lettering, matched to S01E01.

The first episode's lettering is raster art, not a named reusable font. Patrick
Hand with a small added stroke is the reviewed visual match. Render these vector
UI elements once so the web and mini-program use identical lettering on phones.
"""
from pathlib import Path
import copy,json,math,shutil,html
ROOT=Path(__file__).resolve().parents[1]
OLD=ROOT/'output/S03E10/comic-v2'
OUT=ROOT/'output/S03E10/comic-v3'
# Mouth/face centers in each illustration, normalized to that panel.
# Missing speakers are off-screen; unknown/announcer lines keep caption balloons.
ANCHORS={
1:{'chilli':(.49,.57)},2:{'chilli':(.24,.62),'bingo':(.80,.72)},3:{'chilli':(.25,.57),'bingo':(.81,.70)},4:{'chilli':(.26,.57),'bingo':(.81,.70)},
5:{'bingo':(.28,.63),'bluey':(.74,.52)},6:{'bingo':(.30,.62),'bluey':(.72,.51)},
7:{'bingo':(.29,.66),'bluey':(.74,.55)},8:{'bingo':(.30,.66),'bluey':(.73,.55)},9:{'bingo':(.33,.68),'bluey':(.73,.56)},10:{'bingo':(.30,.68),'bluey':(.73,.55)},11:{'bingo':(.31,.69),'bluey':(.74,.56)},12:{'bingo':(.70,.32),'bluey':(.35,.59)},
13:{'bingo':(.43,.71),'bluey':(.66,.66)},14:{'bingo':(.30,.73),'bluey':(.71,.61)},15:{'bingo':(.48,.65),'bluey':(.39,.52)},16:{'bingo':(.32,.70),'bluey':(.77,.57)},17:{'bingo':(.33,.68),'bluey':(.75,.57)},18:{'bingo':(.72,.67),'bluey':(.31,.48)},
19:{'bandit':(.46,.51),'pat':(.76,.53),'bingo':(.22,.79)},20:{'bandit':(.72,.48),'bingo':(.38,.76)},21:{'bandit':(.70,.45),'bingo':(.37,.78)},22:{'bandit':(.73,.46),'bingo':(.35,.78)},23:{'bluey':(.34,.55),'bingo':(.77,.67)},24:{'bingo':(.49,.54)},
25:{'bandit':(.49,.49),'pat':(.80,.49),'bingo':(.22,.70)},26:{'pat':(.53,.32)},27:{'bandit':(.69,.32),'bluey':(.43,.57),'bingo':(.25,.72)},28:{'bandit':(.35,.36),'pat':(.65,.36)},29:{'pat':(.32,.33),'bandit':(.69,.35),'bingo':(.21,.72),'bluey':(.75,.72)},30:{'bandit':(.49,.32)},
31:{'bluey':(.27,.62),'bingo':(.70,.67)},32:{'bandit':(.29,.22),'pat':(.54,.49)},33:{'bandit':(.31,.36),'pat':(.49,.77)},34:{'bluey':(.14,.51),'bingo':(.27,.54),'bandit':(.59,.66),'pat':(.45,.77)},35:{'chilli':(.24,.35),'bingo':(.70,.62),'bluey':(.85,.62)},36:{'chilli':(.56,.29),'bluey':(.30,.54),'bingo':(.84,.61)},
37:{'chilli':(.26,.38),'bingo':(.65,.65),'bluey':(.80,.59)},38:{'bandit':(.56,.58),'pat':(.45,.75)},39:{'chilli':(.22,.43),'bingo':(.51,.66),'bluey':(.65,.63),'bandit':(.84,.41),'pat':(.95,.49)},40:{'chilli':(.25,.42),'bingo':(.59,.67),'bluey':(.76,.62)},41:{'chilli':(.23,.37),'bingo':(.51,.62),'bluey':(.82,.76)},42:{'chilli':(.32,.49),'bingo':(.76,.83)},
43:{'chilli':(.31,.51),'bingo':(.88,.64)},44:{'chilli':(.48,.27),'bingo':(.83,.68)},45:{'chilli':(.47,.39),'bingo':(.23,.57),'bluey':(.84,.77)},46:{'chilli':(.49,.36),'bluey':(.83,.76)},47:{'chilli':(.37,.43),'bluey':(.25,.53)},48:{'bluey':(.54,.42)},
49:{'chilli':(.52,.33),'bingo':(.11,.51),'bluey':(.84,.63)},50:{'chilli':(.63,.43),'bingo':(.32,.60)},51:{'chilli':(.72,.43)},52:{'bluey':(.44,.33),'bingo':(.68,.64)},53:{'chilli':(.40,.30),'bluey':(.69,.48),'bingo':(.89,.55)},54:{'bluey':(.67,.33)},
55:{'chilli':(.52,.35),'bingo':(.22,.50)},56:{'bandit':(.18,.34),'chilli':(.52,.44),'bingo':(.35,.54),'bluey':(.85,.57)},57:{'bandit':(.27,.33),'bluey':(.77,.37),'bingo':(.45,.65)},58:{'bluey':(.71,.36),'bingo':(.25,.63)},59:{'bluey':(.69,.36),'bingo':(.27,.64)},60:{'bingo':(.46,.65)},
61:{'chilli':(.21,.73),'bandit':(.29,.55),'bluey':(.84,.46)},62:{'bluey':(.51,.42)},63:{'bingo':(.28,.56),'bandit':(.70,.42)},64:{'chilli':(.33,.73),'bandit':(.67,.40),'bluey':(.92,.47)},65:{'chilli':(.30,.52),'bingo':(.38,.66),'bandit':(.70,.32),'bluey':(.92,.42)},66:{'chilli':(.29,.51),'bingo':(.36,.65),'bandit':(.71,.31),'bluey':(.92,.43)},
67:{'bandit':(.17,.48),'chilli':(.37,.51),'bingo':(.56,.60),'bluey':(.70,.57)},68:{'bandit':(.19,.48),'chilli':(.36,.50),'bingo':(.63,.60),'bluey':(.76,.56)},69:{'bandit':(.32,.49),'chilli':(.68,.51)},70:{'bandit':(.31,.49),'chilli':(.68,.51)},71:{'bandit':(.27,.43),'chilli':(.68,.43)},72:{'bandit':(.30,.47),'chilli':(.64,.24)}}

def f(n):return str(round(n,2))
def balloon_path(w,body_top,body_bottom,tail):
    left,right=2,w-2;top,bottom=body_top,body_bottom
    ry=min(24,(bottom-top)*.40);rx=min(42,w*.20)
    d=[f'M {f(left+rx)} {f(top)}']
    if tail and tail['edge']=='top':
        c=tail['base'];d += [f'L {f(c-9)} {f(top)} L {f(tail["tipX"])} 2 L {f(c+9)} {f(top)}']
    d += [f'Q {f(w*.62)} {f(top-1)} {f(right-rx)} {f(top)}',f'C {f(right-5)} {f(top+1)} {f(right)} {f(top+ry*.4)} {f(right)} {f(top+ry)}',f'Q {f(right+1)} {f((top+bottom)/2)} {f(right-1)} {f(bottom-ry)}',f'C {f(right-1)} {f(bottom-ry*.35)} {f(right-8)} {f(bottom)} {f(right-rx)} {f(bottom)}']
    if tail and tail['edge']=='bottom':
        c=tail['base'];d += [f'L {f(c+9)} {f(bottom)} L {f(tail["tipX"])} {f(tail["tipY"])} L {f(c-9)} {f(bottom)}']
    d += [f'Q {f(w*.34)} {f(bottom+1)} {f(left+rx)} {f(bottom)}',f'C {f(left+5)} {f(bottom)} {f(left)} {f(bottom-ry*.4)} {f(left)} {f(bottom-ry)}',f'Q {f(left-1)} {f((top+bottom)/2)} {f(left+1)} {f(top+ry)}',f'C {f(left+1)} {f(top+ry*.3)} {f(left+9)} {f(top)} {f(left+rx)} {f(top)} Z']
    return ' '.join(d)

def build():
    book=json.loads((OLD/'work/book-data.json').read_text(encoding='utf-8'))
    if not OUT.exists():
        OUT.mkdir();shutil.copytree(OLD/'dist/assets',OUT/'dist/assets')
    for d in ['work/bubbles','qa','dist/assets/s03e10/bubbles']:(OUT/d).mkdir(parents=True,exist_ok=True)
    count=0
    for page in book['pages']:
        for panel in page['panels']:
            px,py,pw,ph=panel['imageRect']
            for b in panel['bubbles']:
                x,y,w,h=b['rect'];font=26 if len(b['displayText'].splitlines())>4 else 28;tail=None;extra=0
                points=[ANCHORS[panel['number']][s] for s in b['speakerIds'] if s in ANCHORS[panel['number']]]
                if points:
                    tx=px+sum(p[0] for p in points)/len(points)*pw;ty=py+sum(p[1] for p in points)/len(points)*ph
                    edge='bottom' if ty>=y+h/2 else 'top'
                    margin=min(42,w*.20)+12
                    base=max(margin,min(w-margin,tx-x))
                    tipx=max(12,min(w-12,base+(tx-x-base)*.20))
                    free=(py+ph-6-(y+h)) if edge=='bottom' else (y-py-6)
                    for other in panel['bubbles']:
                        if other is b:continue
                        ox,oy,ow,oh=other['rect']
                        if ox<x+base+14 and ox+ow>x+base-14:
                            if edge=='bottom' and oy>=y+h:free=min(free,oy-y-h-4)
                            if edge=='top' and oy+oh<=y:free=min(free,y-oy-oh-4)
                    extra=max(0,min(24,free))
                    tail={'edge':edge,'base':base,'tipX':tipx,'tipY':h+extra-2}
                vr=[x,y-extra if tail and tail['edge']=='top' else y,w,h+extra]
                top=4+extra if tail and tail['edge']=='top' else 2
                bottom=h-2 if not tail else (h-4 if tail['edge']=='bottom' else h+extra-2)
                d=balloon_path(w,top,bottom,tail)
                lines=b['displayText'].splitlines();step=font*1.02857
                baseline=(top+bottom)/2-(len(lines)-1)*step/2+5.5
                spans=''.join(f'<tspan x="{f(w/2)}" y="{f(baseline+i*step)}">{html.escape(line)}</tspan>' for i,line in enumerate(lines))
                svg=f'<svg xmlns="http://www.w3.org/2000/svg" data-body-top="{top}" data-body-bottom="{bottom}" width="{w}" height="{vr[3]}" viewBox="0 0 {w} {vr[3]}"><path d="{d}" fill="#fffefb" stroke="#1d164d" stroke-width="1.9" stroke-linejoin="round"/><text text-anchor="middle" font-family="ComicLettering" font-size="{font}" fill="#211267" stroke="#211267" stroke-width="0.8" stroke-linejoin="round" paint-order="stroke fill">{spans}</text></svg>'
                (OUT/f'work/bubbles/{b["id"]}.svg').write_text(svg,encoding='utf-8')
                b.update(fontSize=font,bubbleImage=f'assets/s03e10/bubbles/{b["id"]}.png',visualRect=vr,lettering=f'Patrick Hand / {font} / outline 0.8',tail=tail)
                count+=1
    book['layoutRevision']=3;book['bubbleStyle']='s01e01-reference-white-ink-handlettering'
    data=json.dumps(book,ensure_ascii=False,indent=2)
    (OUT/'work/book-data.json').write_text(data,encoding='utf-8')
    (ROOT/'web/bluey-reader/data/s03e10.json').write_text(data,encoding='utf-8')
    (OUT/'dist/book-data.js').write_text('window.COMIC_BOOK = '+data+';\n',encoding='utf-8')
    (OUT/'work/style-source.json').write_text(json.dumps({'reference':'output/S01E01/comic-web-v4/dist/assets/pages/page-01-v4.png','font':'Patrick Hand','fontSource':'https://github.com/google/fonts/tree/main/ofl/patrickhand','license':'SIL OFL 1.1','method':'Code-native SVG speech UI rendered to transparent PNG; existing illustrations unchanged.','exactOriginalFontAvailable':False,'bubbleCount':count},indent=2),encoding='utf-8')
    print('Styled',count,'bubbles; vector UI sources ready.')
if __name__=='__main__':build()
