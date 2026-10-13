from pathlib import Path
import os,sys,json,wave
sys.path.insert(0,'E:/v2t/.demo_deps')
import numpy as np
from faster_whisper import WhisperModel
root=Path('E:/v2t');out=root/'output'/'S01E01'
os.environ['HF_HUB_OFFLINE']='1'
with wave.open(str(out/'episode_audio.wav'),'rb') as f:
    audio=np.frombuffer(f.readframes(f.getnframes()),dtype=np.int16).astype(np.float32)/32768
model=WhisperModel('base.en',device='cpu',compute_type='int8',cpu_threads=4,local_files_only=True,download_root=str(root/'demo'/'model_cache'))
allrows=[]
for start,end in [(0,31),(83,97),(103,139),(165,186),(258,284),(331,345),(367,405)]:
    result,_=model.transcribe(audio[int(start*16000):int(end*16000)],language='en',beam_size=5,vad_filter=False,condition_on_previous_text=False)
    rows=[{'start':s.start+start,'end':s.end+start,'text':s.text.strip()} for s in result]
    allrows+=rows
    print(json.dumps(rows),flush=True)
(out/'asr_gap_checks.json').write_text(json.dumps(allrows,indent=2),encoding='utf-8')
