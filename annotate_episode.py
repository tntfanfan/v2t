from pathlib import Path
import json,re

ROOT=Path('E:/v2t/output/S01E01')
captions=json.loads((ROOT/'ocr_subtitles.json').read_text(encoding='utf-8'))
by_id={x['id']:x for x in captions}
roles={}
def assign(role,ids):
    for i in ids:
        assert i not in roles,i
        roles[i]=role
assign('片头合声',range(1,5))
assign('爸爸 Dad',[5,6,7,8,9,10,13,15,16,17,19,23,24,26,34,35,37,44,45,47,48,70,80,81,84,85,86,87,88,95,96,97,98,100,101,102,103,104,105,106,107,120,122,123,124,130])
assign('妈妈 Mum',[18,31,32,55,57,61,62,66,67,68,71,72,73])
assign('Bluey',[12,25,30,33,36,39,40,43,50,52,56,58,63,64,75,76,77,78,83,89,90,91,94,108,109,111,112,113,121,125,126,127,128,129,131])
assign('Bingo',[11,14,21,22,28,41,42,51,53,59,60,65,79,92,93,99,110,114,115,116,117,118,119,132,133,134])
assign('旁白／片名报幕',[20])
assign('Bluey 和 Bingo',[69,74])

fixes={
    6:'I will now play for you the rondo "Alla Turca."',
    17:'Bum, bumda, bum...',
    20:'This episode of Bluey is called "The Magic Xylophone"!',
    51:"Bluey, you're taking all the turns freezing.",
    69:'No! No!',74:'Okay. Okay.',79:'Okay. Unfreeze!',
    89:"I can't hear him.",113:"Let's go and hi...",
    114:'Bluey, you always never take turns with me.',
    119:'Blink two times if "yes."',123:'Huh?',125:'Freeze!',
    134:'I like the daddy water fountain.'
}
def tidy(t):
    t=re.sub(r'\s+',' ',t).strip()
    for old,new in [('bluey','Bluey'),('bingo','Bingo'),('mr mustache','Mr Mustache')]:
        t=re.sub(r'\b'+re.escape(old)+r'\b',new,t)
    return t

rows=[]
def add(s,e,role,text,source_ids=None,kind='角色对白',note='',verification='字幕与画面核对'):
    rows.append({'start':round(s,3),'end':round(e,3),'speaker':role,'text':tidy(text),
        'kind':kind,'note':note,'source_caption_ids':source_ids or [],'verification':verification})

skipped={27,29,38,46,49,54,82,124,135,136,137}
for c in captions:
    i=c['id']
    if i in skipped:continue
    role=roles[i];kind='角色对白';note=''
    if i<=4:kind='片头合声';note='片头呼名'
    if i==20:kind='旁白／报幕';note='片名报幕，童声'
    if i in [7,16,17,19]:kind='哼唱';note='哼唱'
    if i in [70,108,121]:kind='拟声';note='闷哼'
    if i==99:kind='拟声';note='惊叫'
    if i==130:kind='拟声';note='喷水拟声'
    if i in [84,85,86,87,88]:note='画外对白，仍属爸爸'
    if i in [69,74]:kind='共同应答';note='两人应答'
    end=by_id[124]['end'] if i==123 else c['end']
    if i==28:end=111.967
    add(c['start'],end,role,fixes.get(i,c['text']),[i],kind,note)

# A subtitle card can contain multiple speakers. Split using the video turn changes.
add(109.017,109.52,'Bingo','Got it!',[27])
add(109.52,110.517,'Bluey','Do a ding!',[27])
add(115.017,116.02,'Bluey 和 Bingo','Yeah!',[29],'共同应答','欢呼')
add(116.02,118.517,'Bingo','The magic xylophone!',[29])
add(147.017,147.45,'Bluey','Freeze!',[38])
add(147.45,148.017,'爸爸 Dad','Give me that...',[38])
add(174.517,175.02,'Bluey','Run!',[46])
add(175.02,176.017,'Bingo','Aaah!',[46],'拟声','惊叫')
add(179.517,179.98,'爸爸 Dad','Gotcha!',[49])
add(179.98,180.517,'Bluey','Aaaah!',[49],'拟声','惊叫')
add(262.517,263.02,'爸爸 Dad','Grrr!',[82],'拟声','游戏中的吼声')
add(263.02,263.517,'Bluey','Run, Bingo!',[82])

# Brief caption and uncaptained singing checked separately against the local video/audio.
add(111.967,112.3,'Bingo','Y...',[], '拟声','欢呼中断','原视频 112.00 秒画面字幕')
add(362.6,367.6,'爸爸 Dad',"Gonna hose my [歌词待核]... I'm gonna hose it good.",[],
    '哼唱','前半句含听不清的歌词；本行需听音复核','无画面字幕；多次本地音轨识别，保留不确定标记')

rows.sort(key=lambda r:(r['start'],r['end']))
for i,r in enumerate(rows,1):r['id']=i
data={'series':'Bluey','episode':'S01E01','title':'Magic Xylophone','title_zh':'魔法木琴',
      'duration':437.983991,
      'source_video':'input/第一季52集/分集视频/1-2/S01E01.mp4',
      'source_audio':'input/第一季52集/分集音频/1-2/S01E01.mp3',
      'timecode_basis':'以用户视频起点为零点；主要按画面字幕显示区间定位，约有半秒级误差。',
      'narrator_note':'本集片名报幕独立列为旁白／报幕。爸爸等角色在画外说话，仍按原角色标注。',
      'uncertainties':[{'start':362.6,'end':367.6,'reason':'爸爸哼唱前半句歌词待核'}],
      'rows':rows}
(ROOT/'S01E01_分角色台词.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(rows)} labeled transcript entries; {len(data["uncertainties"])} review item.')
