from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
raw = json.loads((ROOT / 'transcript_raw.json').read_text(encoding='utf-8'))
words = [dict(w) for row in raw['segments'] for w in row['words']]

def cleaned(text):
    text = re.sub(r'\bearth\b', 'Earth', text)
    text = re.sub(r'\bprogress resupply\b', 'Progress resupply', text)
    text = text.replace("As you can see they're off in the distance we're approaching", 'As you can see there, off in the distance, we\'re approaching')
    return text.strip()

def row(chunk):
    return {'start': chunk[0]['start'], 'end': chunk[-1]['end'],
            'text': cleaned(''.join(w['word'] for w in chunk))}

subtitles, current = [], []
for w in words:
    proposed = current + [w]
    if current and (len(''.join(x['word'] for x in proposed)) > 86 or w['end'] - current[0]['start'] > 6):
        subtitles.append(row(current)); current = []
    current.append(w)
    if re.search(r'[.!?]$', w['word'].strip()) and len(current) >= 4:
        subtitles.append(row(current)); current = []
if current:
    subtitles.append(row(current))

paragraphs, current = [], []
for w in words:
    current.append(w)
    if re.search(r'[.!?]$', w['word'].strip()) and len(current) >= 28:
        paragraphs.append(row(current)); current = []
if current:
    paragraphs.append(row(current))
result = {'source': raw['source'], 'duration': raw['duration'], 'model': raw['model'],
          'segments': subtitles, 'paragraphs': paragraphs,
          'editorial_changes': ['Earth and Progress capitalization', 'Punctuation and homophone there in the land observation sentence']}
(ROOT / 'transcript_final.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'{len(words)} words; {len(subtitles)} subtitle entries; {len(paragraphs)} paragraphs')
for p in paragraphs:
    print(f"{p['start']:.2f}-{p['end']:.2f} {p['text']}")
