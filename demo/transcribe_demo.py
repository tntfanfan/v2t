from pathlib import Path
import os
import sys
import json
import time
import subprocess
import wave

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / '.demo_deps'))
os.environ['HF_HOME'] = str(ROOT / 'model_cache')
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'
os.environ['HF_HUB_DISABLE_XET'] = '1'

from faster_whisper import WhisperModel
import av
import numpy as np
import imageio_ffmpeg

source = ROOT / 'Window_on_the_World.webm'
with av.open(str(source)) as container:
    duration = container.duration / av.time_base
    streams = [{'type': s.type, 'codec': s.codec_context.name} for s in container.streams]
print(json.dumps({'duration': duration, 'streams': streams}), flush=True)
print('Loading base.en speech recognition model', flush=True)
model = WhisperModel('base.en', device='cpu', compute_type='int8', cpu_threads=6,
                     download_root=str(ROOT / 'model_cache'))
started = time.time()
audio_file = ROOT / 'audio.wav'
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-i', str(source),
                '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', str(audio_file)],
               check=True, capture_output=True)
with wave.open(str(audio_file), 'rb') as wav:
    audio = np.frombuffer(wav.readframes(wav.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
segments, info = model.transcribe(audio, language='en', beam_size=5,
    word_timestamps=True, vad_filter=True, condition_on_previous_text=True,
    initial_prompt='NASA. International Space Station. Scott Kelly. Cupola. Node 3. Soyuz. Progress.')
rows = []
for segment in segments:
    item = {'start': segment.start, 'end': segment.end, 'text': segment.text.strip(),
            'avg_logprob': segment.avg_logprob,
            'words': [{'start': w.start, 'end': w.end, 'word': w.word, 'probability': w.probability} for w in (segment.words or [])]}
    rows.append(item)
    print(f"{segment.start:7.2f} - {segment.end:7.2f}  {segment.text.strip()}", flush=True)
result = {'source': source.name, 'duration': duration, 'model': 'faster-whisper base.en',
          'language': info.language, 'elapsed_seconds': round(time.time() - started, 2), 'segments': rows}
(ROOT / 'transcript_raw.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print('Saved transcript_raw.json', flush=True)
