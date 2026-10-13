from pathlib import Path
import sys, os, json, subprocess, wave, argparse
sys.path.insert(0, 'E:/v2t/.demo_deps')
import numpy as np
import imageio_ffmpeg
from faster_whisper import WhisperModel
parser=argparse.ArgumentParser();parser.add_argument('--model',default='base.en');args=parser.parse_args()
root=Path('E:/v2t');out=root/'output'/'S01E01';out.mkdir(parents=True,exist_ok=True)
os.environ['HF_HOME']=str(root/'demo'/'model_cache')
os.environ['HF_HUB_DISABLE_XET']='1'
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING']='1'
source=root/'input'/'第一季52集'/'分集视频'/'1-2'/'S01E01.mp4'
wavfile=out/'episode_audio.wav'
if not wavfile.exists():
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-i',str(source),'-vn','-ac','1','-ar','16000','-c:a','pcm_s16le',str(wavfile)],capture_output=True,check=True)
with wave.open(str(wavfile),'rb') as wav:
    audio=np.frombuffer(wav.readframes(wav.getnframes()),dtype=np.int16).astype(np.float32)/32768.
model=WhisperModel(args.model,device='cpu',compute_type='int8',cpu_threads=8,download_root=str(root/'demo'/'model_cache'),local_files_only=args.model=='base.en')
segments,info=model.transcribe(audio,language='en',beam_size=5,word_timestamps=True,vad_filter=True,
    condition_on_previous_text=False,initial_prompt='Bluey, Bingo, Mum, Dad. Magic Xylophone.')
rows=[]
for s in segments:
    rows.append({'start':s.start,'end':s.end,'text':s.text.strip(),'words':[{'start':w.start,'end':w.end,'word':w.word,'probability':w.probability} for w in s.words or []]})
    print(f'{s.start:7.2f}-{s.end:7.2f} {s.text}',flush=True)
(out/f'asr_{args.model}.json').write_text(json.dumps({'model':args.model,'segments':rows},indent=2),encoding='utf-8')
