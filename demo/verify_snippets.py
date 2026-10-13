from pathlib import Path
import os
import sys
import json
import wave
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / '.demo_deps'))
os.environ['HF_HOME'] = str(ROOT / 'model_cache')
os.environ['HF_HUB_OFFLINE'] = '1'
from faster_whisper import WhisperModel
import numpy as np
with wave.open(str(ROOT / 'audio.wav'), 'rb') as f:
    audio = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float32) / 32768
model = WhisperModel('base.en', device='cpu', compute_type='int8', cpu_threads=6,
                     download_root=str(ROOT / 'model_cache'), local_files_only=True)
for start, end in [(58, 69), (88, 108), (127, 136), (140, 158), (164, 181)]:
    segments, _ = model.transcribe(audio[int(start*16000):int(end*16000)], language='en',
        beam_size=5, condition_on_previous_text=False, word_timestamps=True)
    print(json.dumps({'start': start, 'end': end,
          'text': ' '.join(s.text.strip() for s in segments)}), flush=True)
