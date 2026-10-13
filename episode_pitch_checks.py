import sys,wave,json
sys.path.insert(0,'E:/v2t/.demo_deps')
import numpy as np
with wave.open('E:/v2t/output/S01E01/episode_audio.wav','rb') as f:
    a=np.frombuffer(f.readframes(f.getnframes()),dtype=np.int16).astype(np.float64)/32768
def pitch(start,end):
    data=a[int(start*16000):int(end*16000)];p=[]
    for i in range(0,len(data)-1024,160):
        x=data[i:i+1024];x=x-x.mean()
        if np.sqrt(np.mean(x*x))<.012:continue
        d=np.array([np.sum((x[:-t]-x[t:])**2) if t else 0 for t in range(260)])
        cm=d[1:]*np.arange(1,len(d))/np.maximum(np.cumsum(d[1:]),1e-10)
        for j in range(25,250):
            if cm[j]<.16 and cm[j]<=cm[j-1] and cm[j]<cm[j+1]:
                p.append(16000/(j+1));break
    return [round(float(x),1) for x in np.percentile(p,[25,50,75])] if p else []
for label,start,end in [('Dad',31.6,35.8),('Bluey',62,64),('Bingo',59.5,62),('Mum',81,84.5),('Huh101',101.5,102.5),('BackInside',263.5,265),('Run',174.45,175.1),('Aaah',175,176),('Yeah',115,116)]:
    print(label,pitch(start,end))
