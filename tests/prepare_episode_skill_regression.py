"""Migrate the already reviewed S01E01 records for a non-destructive skill regression."""
from pathlib import Path
import hashlib
import json
import sys
import wave

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'skills/episode-dialogue-docs/scripts'))
from transcript import save_json, validate

old = json.loads((ROOT / 'output/S01E01/S01E01_分角色台词.json').read_text(encoding='utf-8'))
registry_path = ROOT / 'series/bluey/characters.json'
registry = json.loads(registry_path.read_text(encoding='utf-8'))
metadata = json.loads((ROOT / 'output/S01E01/source_metadata.json').read_text(encoding='utf-8'))
by_path = {Path(item['path']).resolve(): item for item in metadata}
sources = []
for key, role in [('source_video', 'video'), ('source_audio', 'audio')]:
    source = old[key]
    sources.append({'path': source, 'role': role, 'sha256': by_path[(ROOT / source).resolve()]['sha256']})
speakers = {'爸爸 Dad': ['bandit'], '妈妈 Mum': ['chilli'], 'Bluey': ['bluey'], 'Bingo': ['bingo'],
            'Bluey 和 Bingo': ['bluey', 'bingo'], '片头合声': [], '旁白／片名报幕': []}
kinds = {'角色对白': 'dialogue', '哼唱': 'singing', '拟声': 'vocalization', '片头合声': 'chorus',
         '共同应答': 'chorus', '旁白／报幕': 'title_announcement'}


def section(t):
    for limit, title in [(29, '片头呼名'), (86.5, '钢琴与邦戈鼓游戏'), (91, '片名报幕'),
                         (204, '魔法木琴与恶作剧'), (257, '妈妈提醒轮流玩'),
                         (332.5, '争抢木琴与爸爸反击'), (370, 'Bingo 说出自己的感受')]:
        if t < limit:
            return title
    return '姐妹合作与爸爸喷泉'


rows = []
for row in old['rows']:
    text_uncertain = '待核' in row['text']
    announcing = row['kind'] == '旁白／报幕'
    delivery = kinds[row['kind']]
    if row['speaker'] == '爸爸 Dad' and 266 <= row['start'] <= 276:
        delivery = 'offscreen_dialogue'
    note = []
    if text_uncertain:
        note.append('爸爸哼唱前半句无字幕，现有证据不足以确认歌词。')
    if announcing:
        note.append('可确定为片名报幕，未确认童声对应的具体角色。')
    migrated = {'id': row['id'], 'start': row['start'], 'end': row['end'], 'text': row['text'],
                'speaker_ids': speakers[row['speaker']], 'delivery': delivery, 'section': section(row['start']),
                'text_status': 'uncertain' if text_uncertain else 'reviewed',
                'speaker_status': 'uncertain' if announcing else ('group' if row['kind'] == '片头合声' else 'reviewed'),
                'source_ids': [f'ocr:{i}' for i in row['source_caption_ids']],
                'evidence': [f"既有首集核对记录第{row['id']}条：{row['verification']}"], 'review_note': ' '.join(note)}
    if row['kind'] == '片头合声':
        migrated['group_label'] = '片头合声'
    rows.append(migrated)
data = {'schema_version': 1, 'series_id': 'bluey', 'episode': old['episode'], 'title': old['title'],
        'title_zh': old['title_zh'], 'language': 'en', 'duration': old['duration'], 'sources': sources,
        'timecode_note': old['timecode_basis'],
        'scope_note': '收录对白、片名报幕、片头合声、哼唱与明确拟声；背景音乐、一般笑声及片尾名单不逐项记录。',
        'segments': rows, 'coverage': {'source_ids': [f'ocr:{i}' for i in range(1, 135)],
            'excluded': [{'id': 'ocr:54', 'reason': '首集核对确认是 OCR 噪声，不是台词'},
                         {'id': 'ocr:124', 'reason': '首集核对确认为 ocr:123 的同一句重复，不另计条目'}],
            'review_note': '继承既有首集音画及字幕核对；已补短字幕 Y... 和无字幕哼唱。本次只规范数据格式，不重新判定原文。'}}
report = validate(data, registry)
assert report['ok'], report['errors']
assert len(rows) == 140
assert [r['text'] for r in rows] == [r['text'] for r in old['rows']]
save_json(ROOT / 'output/S01E01/transcript.v1.json', data)
run_dir = ROOT / 'tests/runs/episode-skill-v1'
run_dir.mkdir(parents=True, exist_ok=False)
save_json(run_dir / 'migration-validation.json', report)
qa = {'content_review': 'inherited_from_existing_episode_review', 'visual_review': 'passed_for_original_docx',
      'review_note': '原交付 Word 六页已在首集任务逐页检查。结构化稿仅规范角色 ID 与类型，正文140条不变。',
      'unresolved': report['uncertainties'],
      'output_files': ['output/S01E01/Bluey_S01E01_魔法木琴_分角色台词.docx',
                       'output/S01E01/Bluey_S01E01_分角色台词.txt', 'output/S01E01/Bluey_S01E01_分角色字幕.srt']}
save_json(ROOT / 'output/S01E01/qa/review.json', qa)
save_json(ROOT / 'series/bluey/episodes.json', {'schema_version': 1, 'series_id': 'bluey', 'episodes': [
    {'episode': 'S01E01', 'title': old['title'], 'status': 'reviewed_with_uncertainties', 'sources': sources,
     'transcript': 'output/S01E01/transcript.v1.json', 'legacy_transcript': 'output/S01E01/S01E01_分角色台词.json',
     'outputs': qa['output_files'], 'qa': 'output/S01E01/qa/review.json', 'unresolved': report['uncertainties'],
     'registry_revision': registry['revision'], 'registry_sha256': hashlib.sha256(registry_path.read_bytes()).hexdigest(),
     'changes': [{'date': '2026-10-13', 'reason': '初始索引与数据格式规范化，原交付文件不变。'}]}]})
with wave.open(str(ROOT / 'output/S01E01/episode_audio.wav'), 'rb') as source:
    params = source.getparams()
    source.setpos(int(29 * source.getframerate()))
    pcm = source.readframes(int(8 * source.getframerate()))
with wave.open(str(run_dir / 'asr-sample.wav'), 'wb') as target:
    target.setparams(params)
    target.writeframes(pcm)
print('Migrated 140 unchanged lines; one text uncertainty and one unidentified announcement voice.')
