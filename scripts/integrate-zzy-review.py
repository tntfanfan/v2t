"""Import the current ZZY web build into the local welcome hub, preserving history."""
from pathlib import Path
from datetime import datetime
import hashlib
import json
import re
import shutil

root = Path('E:/英语复习').resolve()
hub = root / 'learning-hub-v1'
source = root / 'sites/bobo-english-cloudflare/dist'
stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
backup = root / 'history/learning-hub' / (stamp + '-before-zzy-review')
staging = hub / ('english-zzy-' + stamp)
target = hub / 'english'
for location in (backup, staging, target):
    assert location.resolve().is_relative_to(root), location
assert source.joinpath('index.html').is_file()
assert target.is_dir()
html = source.joinpath('index.html').read_bytes().decode('utf-8')
assert '<title>英语星球冒险 · U0–U9</title>' in html
nav = '<nav class="product-nav" aria-label="学习导航"><a href="/">✿ 迎宾首页</a><a href="/english/index.html" aria-current="page">英语复习</a><a href="/bluey/index.html">Bluey 漫画</a></nav>'
html = html.replace('</head>', '<link rel="stylesheet" href="/navigation.css">\n<link rel="stylesheet" href="hub-adapter.css">\n</head>', 1)
html = html.replace('<body>', '<body>\n' + nav, 1)

# Stage a self-contained copy; the upstream build and original recordings are untouched.
shutil.copytree(source, staging, ignore=shutil.ignore_patterns('_headers'))
staging.joinpath('index.html').write_bytes(html.encode('utf-8'))
staging.joinpath('hub-adapter.css').write_text(
    '@media(max-width:600px){.adventure-hub .hero-companion{position:static;margin:8px 0 -4px auto}}\n', encoding='utf-8')
# Old bookmarks now lead to the replacement product instead of mixing two curricula.
for name in ('words', 'build', 'quiz', 'chant', 'story', 'progress', 'review'):
    staging.joinpath(name + '.html').write_text(
        '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta http-equiv="refresh" content="0;url=index.html">'
        '<title>英语星球冒险</title></head><body>'
        '<p>英语复习已更新为英语星球冒险。<a href="index.html">进入 U0–U9 复习</a></p>'
        '</body></html>', encoding='utf-8')

backup.mkdir(parents=True, exist_ok=False)
for name in ('index.html', 'hub.css', 'project.json', '使用说明.txt'):
    shutil.copy2(hub / name, backup / name)
shutil.copy2(root / 'README.md', backup / 'root-README.md')
# Both directory targets were resolved and checked within the intended project above.
target.rename(backup / 'english')
staging.rename(target)

# Reuse ZZY's own vector mascot to make the landing card match its destination.
app = root.joinpath('unit-adventure/app.js').read_text(encoding='utf-8')
robot = re.search(r"function robot\(extra=''\) \{\s*return `(.+?)`;", app, re.S).group(1)
robot = robot.replace('${extra}', 'xmlns="http://www.w3.org/2000/svg"')
hub.joinpath('images/bobo.svg').write_text(robot, encoding='utf-8')
home = hub.joinpath('index.html').read_text(encoding='utf-8')
home = home.replace('<span class="small-pill">练一练</span>', '<span class="small-pill">U0–U9 · 10 个单元</span>')
home = re.sub(r'<div class="product-visual zoo-visual">.*?</div>',
    '<div class="product-visual adventure-visual"><span class="planet-mark">✦</span>'
    '<span class="planet-label">BOBO’S ADVENTURE<small>10 个星球，等你探索</small></span>'
    '<img src="/images/bobo.svg" alt="英语星球冒险里的小机器人 Bobo">'
    '<span class="floating-note">Let’s explore!</span></div>', home, count=1)
home = home.replace('把课堂里的知识，变成自己的本领。', '英语星球冒险 · 跟着 Bobo 一起闯关。')
home = home.replace('从动物词卡到拼句问答，再到跟读和故事。一次选一个小练习，开口说，也动手做。',
    '10 个单元，90 个单词和短语。每轮学两个词，听一听、拼一拼，再用句子闯关摘星。')
home = home.replace('<span>词卡点读</span><span>句型练习</span><span>跟读故事</span>',
    '<span>五关小冒险</span><span>单词星图</span><span>课本录音</span>')
hub.joinpath('index.html').write_text(home, encoding='utf-8')
with hub.joinpath('hub.css').open('a', encoding='utf-8') as f:
    f.write('\n/* ZZY English adventure welcome card. */\n'
        '.adventure-visual{background:#e1e9d3}.adventure-visual:before{content:"";position:absolute;'
        'width:220px;height:220px;border-radius:50%;background:#eef0d9;right:-10px;top:5px}'
        '.adventure-visual img{position:absolute;right:23px;top:2px;width:165px;height:185px}'
        '.planet-label{position:absolute;left:22px;top:48px;font-size:10px;letter-spacing:1px;'
        'font-weight:700;color:#577249}.planet-label small{display:block;font-size:12px;'
        'letter-spacing:0;margin-top:9px}.planet-mark{position:absolute;left:22px;top:13px;'
        'color:#b48c40;font-size:26px}.adventure-visual .floating-note{left:20px;bottom:22px;'
        'font-size:17px}@media(max-width:420px){.adventure-visual img{right:4px;width:140px;'
        'height:173px}.planet-label{left:16px;font-size:9px}.planet-label small{font-size:11px}'
        '.adventure-visual .floating-note{left:14px;bottom:15px;font-size:15px;padding:10px 12px}}\n')

metadata = json.loads(hub.joinpath('project.json').read_text(encoding='utf-8'))
metadata.update(version='1.3.1', products=['英语星球冒险 U0–U9（ZZY）', 'Bluey 原声漫画（S01E01、S03E10）'],
    englishSource=str(source), englishSourceProject='ZZY', miniVersion='1.3.0',
    miniSyncStatus='Web-only replacement; mini-program remains unchanged')
hub.joinpath('project.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
provenance = {
    'project': 'ZZY', 'source': str(source), 'importedAt': datetime.now().isoformat(),
    'sourceIndexSHA256': hashlib.sha256(source.joinpath('index.html').read_bytes()).hexdigest(),
    'webVersion': '1.3.1', 'backup': str(backup),
    'changesToImportedPage': ['Shared product navigation', 'Mobile mascot placement to avoid action button overlap; source gameplay and styles retained'],
    'storageKey': 'bobo-adventure-u012-v1', 'media': []}
for file in sorted(source.rglob('*')):
    if file.is_file() and file.suffix in ('.mp3', '.jpg'):
        rel = file.relative_to(source)
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        assert digest == hashlib.sha256(target.joinpath(rel).read_bytes()).hexdigest()
        provenance['media'].append({'path': rel.as_posix(), 'sha256': digest})
hub.joinpath('english-source.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
hub.joinpath('使用说明.txt').write_text(
    '英语小花园 · ZZY 英语星球冒险版（网页版 1.3.1）\n\n'
    '运行：node preview.mjs，访问 http://127.0.0.1:5175/\n'
    '也可双击上级文件夹中的“打开学习首页.cmd”。\n'
    '迎宾首页分别进入英语复习和 Bluey 原声漫画；顶部导航可返回首页或切换产品。\n'
    '英语复习使用 ZZY 项目当前的《英语星球冒险 U0–U9》，包含五关冒险、单词星图和听读小屋。\n'
    '来源：sites/bobo-english-cloudflare/dist；复制全部音频和图片，保持源站的学习逻辑。\n'
    '仅更新本地网页，不会修改源站、小程序或已发布版本。\n'
    '进度保存在当前网址的浏览器中。不同端口、原网站和不同设备之间不会自动同步。\n'
    f'被替换的旧 Unit 2 网页保存在：{backup}\n', encoding='utf-8')
readme = root.joinpath('README.md').read_text(encoding='utf-8')
paragraph = ('当前迎宾首页网页版（2026-10-22，1.3.1）：本地网页位于 `learning-hub-v1`，通过 '
    '`打开学习首页.cmd` 启动后访问 http://127.0.0.1:5175/ 。英语入口已替换为 ZZY 项目的'
    '《英语星球冒险 U0–U9》，来源 `sites/bobo-english-cloudflare/dist`；Bluey 两集和迎宾首页保留。'
    '本次仅更新网页，小程序 `miniprogram/english-review-bluey-v6` 仍为本地 1.3.0。'
    '不同网址分别保存进度。旧 Unit 2 页面已备份到 `history/learning-hub`，历史交付包保留。')
readme = paragraph + '\n\n' + readme.split('\n\n', 1)[1]
root.joinpath('README.md').write_text(readme, encoding='utf-8')
print(json.dumps({'status': 'imported', 'version': '1.3.1', 'mediaFiles': len(provenance['media']),
    'source': str(source), 'backup': str(backup), 'preview': 'http://127.0.0.1:5175/'}, ensure_ascii=False))
