"""Local-only source inspection, contact sheets, subtitle OCR and ASR candidates."""
import argparse
import difflib
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import wave
from transcript import available, save_json


def probe(args):
    import av
    result = []
    available(args.output)
    for name in args.source:
        path = Path(name).resolve(strict=True)
        with path.open('rb') as handle:
            digest = hashlib.file_digest(handle, 'sha256').hexdigest()
        with av.open(str(path)) as container:
            result.append({'path': str(path), 'bytes': path.stat().st_size, 'sha256': digest,
                           'duration': container.duration / av.time_base if container.duration else None,
                           'streams': [{'index': s.index, 'type': s.type, 'codec': s.codec_context.name,
                                        'width': getattr(s.codec_context, 'width', None),
                                        'height': getattr(s.codec_context, 'height', None),
                                        'metadata': dict(s.metadata)} for s in container.streams]})
    save_json(args.output, result)
    print(json.dumps(result, ensure_ascii=True, indent=2))


def contact_sheet(items, output):
    from PIL import Image, ImageDraw
    sheet = Image.new('RGB', (1280, 395 * ((len(items) + 1) // 2)), 'white')
    for i, (caption, img) in enumerate(items):
        thumb = img.copy()
        thumb.thumbnail((640, 360))
        tile = Image.new('RGB', (640, 395), 'white')
        tile.paste(thumb, (0, 35))
        ImageDraw.Draw(tile).text((8, 8), caption, fill='black')
        sheet.paste(tile, ((i % 2) * 640, (i // 2) * 395))
    sheet.save(available(output), quality=93)


def frames(args):
    import av
    available(args.output)
    if not 1 <= len(args.times) <= 12 or any(ts < 0 for ts in args.times):
        raise ValueError('Use 1 to 12 nonnegative times per contact sheet')
    items = []
    with av.open(args.source) as container:
        stream = container.streams.video[0]
        for ts in args.times:
            container.seek(int(ts / stream.time_base), stream=stream)
            for frame in container.decode(stream):
                if frame.time is not None and float(frame.time) >= ts:
                    items.append((f'{float(frame.time):.3f}s', frame.to_image()))
                    break
            else:
                raise ValueError(f'No video frame at {ts}')
    contact_sheet(items, args.output)
    print(args.output)


def ocr(args):
    import av
    import numpy as np
    from rapidocr_onnxruntime import RapidOCR
    from PIL import Image
    left, top, right, bottom = args.crop
    if not (0 <= left < right <= 1 and 0 <= top < bottom <= 1):
        raise ValueError('crop must be normalized left top right bottom within 0..1')
    if args.sample_every <= 0 or args.start < 0 or (args.end is not None and args.end <= args.start):
        raise ValueError('Invalid sampling interval')
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=False)
    frame_dir = out / 'frames'
    frame_dir.mkdir()
    engine = RapidOCR(intra_op_num_threads=2, inter_op_num_threads=1,
                      det_limit_side_len=1280, det_limit_type='max')
    rows = []
    target, begun = args.start, time.monotonic()
    with (out / 'frames.jsonl').open('x', encoding='utf-8') as log, av.open(args.source) as container:
        stream = container.streams.video[0]
        if args.start:
            container.seek(int(args.start / stream.time_base), stream=stream)
        duration = container.duration / av.time_base if container.duration else None
        upper = args.end if args.end is not None else duration
        for frame in container.decode(stream):
            if frame.time is None:
                continue
            ts = float(frame.time)
            if upper is not None and ts >= upper:
                break
            if ts < target:
                continue
            while target <= ts:
                target += args.sample_every
            image = frame.to_image()
            width, height = image.size
            crop = image.crop((int(left * width), int(top * height), int(right * width), int(bottom * height)))
            crop.thumbnail((1280, 720))
            raw, _ = engine(np.asarray(crop), use_cls=False)
            raw = [r for r in (raw or []) if float(r[2]) >= .5]
            raw.sort(key=lambda r: (round(min(p[1] for p in r[0]) / 15), min(p[0] for p in r[0])))
            row = {'time': ts, 'text': ' '.join(r[1] for r in raw),
                   'confidence': sum(float(r[2]) for r in raw) / len(raw) if raw else 0.0}
            rows.append(row)
            log.write(json.dumps(row, ensure_ascii=False) + '\n')
            log.flush()
            thumb = image.copy()
            thumb.thumbnail((640, 360))
            thumb.save(frame_dir / f'{ts:010.3f}.jpg', quality=86)
            if len(rows) % 60 == 0:
                print(f'OCR {ts:.1f}s; {time.monotonic()-begun:.1f}s elapsed', flush=True)
    groups, current = [], None
    for row in rows:
        text = row['text'].strip()
        if not text:
            if current:
                groups.append(current)
                current = None
            continue
        end = row['time'] + args.sample_every / 2
        if upper is not None:
            end = min(upper, end)
        if current and difflib.SequenceMatcher(None, current['text'].lower(), text.lower()).ratio() > .88:
            current['end'] = end
            if row['confidence'] > current['confidence']:
                current.update(text=text, confidence=row['confidence'], time=row['time'])
        else:
            if current:
                groups.append(current)
            current = {'start': max(args.start, row['time'] - args.sample_every/2), 'end': end,
                       'time': row['time'], 'text': text, 'confidence': row['confidence']}
    if current:
        groups.append(current)
    for i, group in enumerate(groups, 1):
        group['id'] = f'ocr:{i}'
    save_json(out / 'groups.json', groups)
    for offset in range(0, len(groups), 8):
        items = []
        for group in groups[offset:offset+8]:
            with Image.open(frame_dir / f"{group['time']:010.3f}.jpg") as image:
                items.append((f"{group['id']} | {group['start']:.3f}-{group['end']:.3f}s", image.copy()))
        contact_sheet(items, out / f'captions-{offset//8+1:03}.jpg')
    print(f'{len(rows)} sampled frames; {len(groups)} subtitle candidates; output {out}', flush=True)


def asr(args):
    import numpy as np
    import imageio_ffmpeg
    from faster_whisper import WhisperModel
    model_path = Path(args.model).resolve(strict=True)
    if not model_path.is_dir():
        raise ValueError('model must be a local converted model directory')
    available(args.output)
    with tempfile.TemporaryDirectory(prefix='episode-audio-', dir=Path(args.output).resolve().parent) as temporary:
        wavfile = Path(temporary) / 'audio.wav'
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-nostdin', '-i', args.source, '-vn', '-ac', '1',
                        '-ar', '16000', '-c:a', 'pcm_s16le', str(wavfile)], capture_output=True, check=True)
        with wave.open(str(wavfile), 'rb') as handle:
            audio = np.frombuffer(handle.readframes(handle.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        model = WhisperModel(str(model_path), device='cpu', compute_type='int8', cpu_threads=args.threads,
                             local_files_only=True)
        segments, info = model.transcribe(audio, language=args.language, beam_size=5, word_timestamps=True,
                                          vad_filter=True, condition_on_previous_text=False,
                                          initial_prompt=args.prompt or None)
        rows = []
        for i, segment in enumerate(segments, 1):
            rows.append({'id': f'asr:{i}', 'start': segment.start, 'end': segment.end, 'text': segment.text.strip(),
                         'words': [{'start': w.start, 'end': w.end, 'word': w.word, 'probability': w.probability}
                                   for w in segment.words or []]})
            print(f'{segment.start:.2f}-{segment.end:.2f} {segment.text}', flush=True)
    save_json(args.output, {'model': str(model_path), 'language': info.language, 'segments': rows,
                            'warning': 'ASR candidates only; no speaker attribution or source synchronization.'})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--deps', action='append', default=[])
    subs = parser.add_subparsers(dest='command', required=True)
    sub = subs.add_parser('probe')
    sub.add_argument('--source', action='append', required=True)
    sub.add_argument('--output', required=True)
    sub = subs.add_parser('frames')
    sub.add_argument('--source', required=True)
    sub.add_argument('--times', type=float, nargs='+', required=True)
    sub.add_argument('--output', required=True)
    sub = subs.add_parser('ocr')
    sub.add_argument('--source', required=True)
    sub.add_argument('--out-dir', required=True)
    sub.add_argument('--sample-every', type=float, default=.5)
    sub.add_argument('--crop', type=float, nargs=4, required=True)
    sub.add_argument('--start', type=float, default=0)
    sub.add_argument('--end', type=float)
    sub = subs.add_parser('asr')
    sub.add_argument('--source', required=True)
    sub.add_argument('--model', required=True)
    sub.add_argument('--language', required=True)
    sub.add_argument('--output', required=True)
    sub.add_argument('--threads', type=int, default=8)
    sub.add_argument('--prompt', default='')
    args = parser.parse_args()
    sys.path[:0] = [str(Path(p).resolve(strict=True)) for p in args.deps]
    globals()[args.command](args)


if __name__ == '__main__':
    main()
