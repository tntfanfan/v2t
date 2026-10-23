"""Record the inspected style revision without changing historical deliveries."""
from pathlib import Path
import copy
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT / 'output/S03E10/comic-v2'
OUT = ROOT / 'output/S03E10/comic-v3'
MINI = Path('E:/英语复习/miniprogram/english-review-bluey-v5')

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def digest(path):
    return hashlib.sha256(path.read_bytes()).digest()

style_keys = {'fontSize', 'visualRect', 'bubbleImage', 'lettering', 'tail', 'layoutRevision', 'bubbleStyle'}
def content(value):
    if isinstance(value, dict):
        return {k: content(v) for k, v in value.items() if k not in style_keys}
    if isinstance(value, list):
        return [content(v) for v in value]
    return value

before = read(OLD / 'work/book-data.json')
after = read(OUT / 'work/book-data.json')
assert content(before) == content(after), 'Dialogue, timing, geometry or episode metadata changed'
assert after == read(ROOT / 'web/bluey-reader/data/s03e10.json')
media_count = 0
for original in (OLD / 'dist/assets').rglob('*'):
    if original.is_file():
        current = OUT / 'dist/assets' / original.relative_to(OLD / 'dist/assets')
        assert digest(original) == digest(current), original
        media_count += 1

library = (ROOT / 'output/bluey-library-v2/dist/book-data.js').read_text(encoding='utf-8')
first = json.loads(library.split('window.COMIC_LIBRARY = ', 1)[1].split(';\nwindow.COMIC_BOOK', 1)[0])[0]
assert first == read(ROOT / 'web/bluey-reader/data/s01e01.json')
bubble_count = 0
for page in after['pages']:
    for panel in page['panels']:
        for bubble in panel['bubbles']:
            image = OUT / 'dist' / bubble['bubbleImage']
            mini_image = MINI / f'miniprogram/magic/p{page["number"]:02}/media' / image.name
            assert digest(image) == digest(mini_image), image
            bubble_count += 1
assert bubble_count == 189
web = read(OUT / 'qa/web-functional-review.json')
mini = read(MINI / 'qa/integration-verification.json')
assert web['status'] == mini['status'] == 'passed'
assert mini['version'] == '1.2.2'

report = {
    'status': 'passed',
    'revision': 3,
    'date': '2026-10-19',
    'styleReference': 'S01E01 comic-web-v4: white balloons, indigo outline/text, pointed tails, rounded hand lettering',
    'font': 'Patrick Hand with 0.8px outline; visual match, not the unavailable original image lettering font',
    'visualReview': 'All 12 final rendered pages and compiled mini page/panel previews inspected.',
    'letteringReview': 'All 189 SVG text ink bounds within balloon outlines.',
    'mobileReview': 'All 72 panels at 390px checked: bubble images loaded, no overflow, text size at least 14 CSS pixels.',
    'dialogueTimingAndOriginalRectsUnchanged': True,
    'originalMagicMediaFilesUnchanged': media_count,
    'firstEpisodeDataUnchanged': True,
    'identicalWebAndMiniBubbleImages': bubble_count,
    'webFunctional': web,
    'miniProgram': {
        'version': '1.2.2',
        'templateStatesRendered': mini['templateStatesRendered'],
        'automatedTestsPassed': 26,
        'originalAudioFilesVerified': mini['originalAudioFilesVerified'],
        'englishReviewFilesUnchanged': mini['englishReviewFilesUnchanged'],
        'totalMiB': mini['totalMiB'],
    },
    'limitations': [
        'Native WeChat simulator and physical phone not verified for 1.2.2.',
        'Existing uncertain speaker and audio boundary review items unchanged.'
    ],
    'cloudUploaded': False,
}
for directory in [OUT, MINI]:
    (directory / 'qa/style-review.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

index_path = ROOT / 'series/bluey/episodes.json'
index = read(index_path)
episode = next(e for e in index['episodes'] if e['episode'] == 'S03E10')
if not any(e['edition_id'] == 'bluey-s03e10-comic-v3' for e in episode['comic_editions']):
    entry = copy.deepcopy(next(e for e in episode['comic_editions'] if e['edition_id'] == 'bluey-s03e10-comic-v2'))
    entry.update(
        edition_id='bluey-s03e10-comic-v3',
        created_date='2026-10-19',
        output_directory='output/S03E10/comic-v3',
        based_on_edition='bluey-s03e10-comic-v2',
        revision_scope='对照第一集统一 189 个气泡的白底、深蓝轮廓、尖尾巴和圆润手写字样；台词、音频及插图不变。',
        visual_review='all_12_rendered_pages_and_compiled_mini_views_checked',
        review_path='output/S03E10/comic-v3/qa/style-review.json',
        web_output='output/bluey-library-v3',
        mini_program_project=str(MINI),
        mini_program_version='1.2.2',
    )
    episode['comic_editions'].append(entry)
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Style review saved: {media_count} original assets unchanged; {bubble_count} identical web/mini bubbles.')
