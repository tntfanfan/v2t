from pathlib import Path
import sys,os,json,wave,subprocess
sys.path.insert(0,'E:/v2t/.demo_deps')
import numpy as np
import imageio_ffmpeg
from faster_whisper import WhisperModel
root=Path('E:/v2t');out=root/'output'/'S01E01';os.environ['HF_HUB_OFFLINE']='1'
with wave.open(str(out/'episode_audio.wav'),'rb') as f:
    audio=np.frombuffer(f.readframes(f.getnframes()),dtype=np.int16).astype(np.float32)/32768
model=WhisperModel('base.en',device='cpu',compute_type='int8',cpu_threads=6,local_files_only=True,download_root=str(root/'demo'/'model_cache'))
rows=[]
for start,end,prompt in [(362.0,368.0,None),(361.0,370.0,'Garden gnome. Hose.'),(361.8,367.8,None)]:
    result,_=model.transcribe(audio[int(start*16000):int(end*16000)],language='en',beam_size=8,word_timestamps=True,vad_filter=False,condition_on_previous_text=False,initial_prompt=prompt)
    current=[{'start':s.start+start,'end':s.end+start,'text':s.text.strip(),'words':[{'word':w.word,'probability':w.probability} for w in s.words or []]} for s in result]
    rows+=current;print(json.dumps(current),flush=True)
(out/'song_checks.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
mp3=root/'input'/'第一季52集'/'分集音频'/'1-2'/'S01E01.mp3'
decoded=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-i',str(mp3),'-f','s16le','-ac','1','-ar','16000','-t','60','-'],capture_output=True,check=True).stdout
a=np.frombuffer(decoded,dtype=np.int16).astype(np.float32)/32768
b=audio[:len(a)]
scores=[]
for lag in range(-800,801):
    x=a[160000+max(0,lag):800000+min(0,lag):4]
    y=b[160000+max(0,-lag):800000+min(0,-lag):4]
    scores.append((float(np.dot(x,y)/np.sqrt(np.dot(x,x)*np.dot(y,y))),lag))
corr,lag=max(scores)
result={'mp3_video_pcm_correlation':corr,'mp3_minus_video_lag_samples':lag,'sample_rate':16000}
(out/'audio_source_check.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(result)
