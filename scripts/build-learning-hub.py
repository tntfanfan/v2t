"""Create a separate welcome/learning edition; preserve all shipped projects."""
from pathlib import Path
import json, shutil, re

ROOT = Path('E:/英语复习')
WEB = ROOT/'learning-hub-v1'
OLD = ROOT/'miniprogram/english-review-bluey-v5'
MINI = ROOT/'miniprogram/english-review-bluey-v6'
APP = MINI/'miniprogram'
V2T = Path('E:/v2t')
ACTIVITIES = [('words','动物词卡','认识动物和食物，点一点听发音','Aa'),('build','句子拼图','把单词排好，说清喜欢和不喜欢','▤'),('quiz','问答练习','看清 he 和 she，再回答 Does…?','?'),('chant','开口跟读','听一句，停一停，再自己说一句','♪'),('story','故事阅读','听故事、排顺序，读懂发生了什么','▧'),('progress','我的收获','看看完成星，把错题再练一次','☆')]

def put(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')

def dump(path, obj): put(path, json.dumps(obj, ensure_ascii=False, indent=2)+'\n')

if WEB.exists() or MINI.exists():
    raise FileExistsError('New edition already exists; edit it in place instead of overwriting.')
WEB.mkdir(); shutil.copytree(OLD, MINI, ignore=shutil.ignore_patterns('qa','project.private.config.json'))
(MINI/'qa').mkdir(); shutil.copy2(OLD/'qa/preserved-assets.json',MINI/'qa/preserved-assets.json')
shutil.copytree(V2T/'output/bluey-library-v3/dist', WEB/'bluey')
(WEB/'bluey/index.html').rename(WEB/'bluey/reader.html')
shutil.copy2(OLD/'Patrick-Hand-LICENSE.txt',WEB/'Patrick-Hand-LICENSE.txt')
shutil.copytree(ROOT/'unit2-the-zoo',WEB/'english',ignore=shutil.ignore_patterns('*.test.js','教学要求.txt'))
shutil.copytree(ROOT/'output/zoo-audio-v1/audio',WEB/'english/audio')
(WEB/'images').mkdir();shutil.copy2(APP/'review/assets/animals/zebra.png',WEB/'images/zebra.png');shutil.copy2(APP/'assets/cover.jpg',WEB/'images/bluey.jpg')

nav = '<nav class="product-nav" aria-label="学习导航"><a href="/">✿ 迎宾首页</a><a href="/english/index.html">英语复习</a><a href="/bluey/index.html">Bluey 漫画</a></nav>'
navcss = '.product-nav{display:flex;gap:8px;justify-content:center;align-items:center;padding:12px 16px;border-bottom:1px solid #e0e5d9;background:#faf9f3;font:600 14px/1.4 -apple-system,BlinkMacSystemFont,"Microsoft YaHei",sans-serif;position:relative;z-index:5}.product-nav a{color:#466151;text-decoration:none;border-radius:22px;padding:9px 15px;white-space:nowrap}.product-nav a[aria-current=page]{background:#e4eddc;color:#234330}.product-nav a:focus-visible{outline:3px solid #c89141;outline-offset:3px}.product-nav a:hover{background:#edf1e7}@media(max-width:420px){.product-nav{gap:1px;padding:9px 6px}.product-nav a{padding:9px 12px;font-size:13px}}'
put(WEB/'navigation.css',navcss)
def page(title, body, selected):
    active=nav.replace(f'href="{selected}"', f'href="{selected}" aria-current="page"')
    return f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f7f5ed"><title>{title}</title><link rel="stylesheet" href="/hub.css"><link rel="stylesheet" href="/navigation.css"></head><body>{active}{body}</body></html>'

put(WEB/'index.html',page('英语小花园 · 欢迎回家', '''
<main class="hub"><header class="welcome"><span class="eyebrow">A LITTLE ENGLISH, EVERY DAY</span><p class="hello">欢迎来到英语小花园 <span>✿</span></p><h1>你好，小小探险家。<br><em>今天，想从哪里开始？</em></h1><p class="lead">一边练习，一边听故事。<br>两种喜欢的方式，陪你把英语慢慢变熟悉。</p><span class="welcome-stamp">听 · 说 · 玩 · 学</span></header>
<section class="products" aria-label="选择学习产品"><a class="product zoo" href="/english/index.html"><div class="product-top"><span class="number">01 / ENGLISH PRACTICE</span><span class="small-pill">练一练</span></div><div class="product-visual zoo-visual"><span class="letter aa">Aa</span><img src="/images/zebra.png" alt="等待一起复习的斑马朋友"><span class="floating-note">He likes apples.</span></div><div class="product-copy"><h2>英语复习</h2><p class="product-subtitle">把课堂里的知识，变成自己的本领。</p><p>从动物词卡到拼句问答，再到跟读和故事。一次选一个小练习，开口说，也动手做。</p><div class="chips"><span>词卡点读</span><span>句型练习</span><span>跟读故事</span></div><div class="product-cta"><span>进入英语复习</span><b>↗</b></div></div></a>
<a class="product bluey" href="/bluey/index.html"><div class="product-top"><span class="number">02 / BLUEY STORIES</span><span class="small-pill">听故事</span></div><div class="product-visual"><img class="comic-cover" src="/images/bluey.jpg" alt="Bluey 和家人一起玩游戏"><span class="comic-note">Hello, Bluey! ♪</span></div><div class="product-copy"><h2>Bluey 原声漫画</h2><p class="product-subtitle">喜欢的故事，现在可以点着听。</p><p>点气泡听一句，点画面听整格。跟着 Bluey 和 Bingo，在有趣的日常里听懂英语。</p><div class="chips"><span>视频原声</span><span>气泡点读</span><span>两集故事</span></div><div class="product-cta"><span>进入漫画世界</span><b>↗</b></div></div></a></section>
<section class="welcome-guide"><span class="guide-flower">✿</span><div><h2>每天一点点，就很棒。</h2><p>先选一个喜欢的入口，练一会儿、读一小段。学习页和漫画页分别记录进度，下次还能接着来。</p></div></section><footer class="hub-footer">给好奇的孩子，也给一起陪伴的大人。<small>家庭学习项目 · 非教材或 Bluey 官方产品</small></footer></main>''','/'))
put(WEB/'hub.css','''
*{box-sizing:border-box}body{margin:0;background:#f7f5ed;color:#263f35;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}a{color:inherit}button{font:inherit}.hub{max-width:1100px;margin:auto;padding:0 36px}.welcome{position:relative;text-align:center;padding:58px 0 40px}.eyebrow{font-size:11px;letter-spacing:3px;font-weight:700;color:#8a947a}.hello{font-size:17px;margin:22px 0 14px;font-weight:650}.hello span{color:#b48145}.welcome h1{font-size:44px;line-height:1.4;letter-spacing:-1.5px;font-weight:750;margin:0}.welcome h1 em{font-style:normal;color:#75906a}.lead{color:#778475;line-height:1.85;font-size:15px;margin:20px 0 0}.welcome-stamp{position:absolute;right:20px;top:115px;border:1px solid #c5ceb9;padding:14px;border-radius:50%;width:76px;height:76px;display:grid;place-items:center;font-size:12px;line-height:2;transform:rotate(12deg);color:#7d9070}.products{display:grid;grid-template-columns:1fr 1fr;gap:26px}.product{display:block;border:1px solid #d2ddc6;border-radius:24px;overflow:hidden;background:#eef2e5;text-decoration:none;transition:transform .2s,box-shadow .2s}.product:hover{transform:translateY(-4px);box-shadow:0 14px 35px #294a3614}.product:focus-visible{outline:3px solid #c58b3d;outline-offset:5px}.product-top{display:flex;align-items:center;justify-content:space-between;padding:23px 27px 17px}.number{font-size:10px;font-weight:750;letter-spacing:1.6px;color:#718469}.small-pill{border:1px solid #cbd7bc;padding:5px 11px;font-size:11px;border-radius:30px}.product-visual{height:190px;margin:0 24px;position:relative;overflow:hidden;border-radius:14px;background:#dfe9d0}.zoo-visual:before{content:"";position:absolute;width:250px;height:250px;border-radius:50%;background:#e9edd3;right:-30px;top:-20px}.zoo-visual img{position:absolute;right:35px;width:180px;height:185px;object-fit:contain}.letter{position:absolute;font:bold 70px Georgia,serif;left:27px;top:20px;color:#799466}.floating-note{position:absolute;left:20px;bottom:24px;background:#fffdf6;border-radius:13px 13px 2px 13px;padding:12px 15px;font:17px Georgia,serif;transform:rotate(-4deg);box-shadow:0 3px 12px #355a3d0b}.bluey{background:#eaf0f2;border-color:#cbdde1}.bluey .number{color:#668591}.bluey .small-pill{border-color:#c5d8df}.comic-cover{width:100%;height:100%;object-fit:cover;object-position:center 36%}.comic-note{position:absolute;right:14px;bottom:13px;background:#fffef9;color:#283d71;border:1.5px solid #3d4d71;border-radius:20px 20px 3px 20px;padding:9px 16px;transform:rotate(3deg);font:italic 18px Georgia,serif}.product-copy{padding:22px 27px 0}.product h2{font-size:27px;letter-spacing:-.5px;margin:0 0 9px}.product-subtitle{font-weight:600;color:#526b50!important;font-size:14px!important}.product p{font-size:13px;color:#74816c;line-height:1.8;margin:7px 0}.bluey p{color:#70848b}.bluey .product-subtitle{color:#4e707e!important}.chips{display:flex;gap:7px;flex-wrap:wrap;margin:18px 0 23px}.chips span{background:#ffffff80;padding:6px 10px;border-radius:6px;font-size:11px;color:#627359}.bluey .chips span{color:#587480}.product-cta{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #d5dec9;padding:18px 0;font-size:15px;font-weight:700}.product-cta b{width:34px;height:34px;background:#45654b;color:white;border-radius:50%;display:grid;place-items:center;font-size:22px;font-weight:400}.bluey .product-cta{border-color:#d2dfe2}.bluey .product-cta b{background:#46727e}.welcome-guide{display:flex;align-items:center;gap:20px;max-width:760px;margin:35px auto 0;border:1px dashed #ccd4c2;border-radius:15px;padding:20px 25px}.guide-flower{font-size:40px;color:#b39260}.welcome-guide h2{font-size:15px;margin:0 0 6px}.welcome-guide p{font-size:12px;line-height:1.9;color:#7e8877;margin:0}.hub-footer{text-align:center;padding:32px 0 28px;color:#8c9583;font-size:12px;line-height:1.9}.hub-footer small{display:block;font-size:10px;color:#a2a998}.library-intro{padding:42px 0 30px}.library-intro h1{font-size:38px;margin:12px 0}.library-intro p{color:#718477;line-height:1.8}.episode-cover{height:220px;object-position:top}.reading-tip{font-size:13px;color:#819083;margin-top:24px}.catalog-stats{font-size:12px;color:#7b8c7e}
@media(max-width:650px){.hub{padding:0 20px}.welcome{padding:35px 0 28px}.welcome h1{font-size:29px;letter-spacing:-.8px}.welcome-stamp{display:none}.hello{font-size:15px;margin:18px 0 11px}.eyebrow{font-size:9px;letter-spacing:2px}.lead{font-size:13px;margin-top:15px}.products{grid-template-columns:1fr;gap:21px}.product-top{padding:20px 22px 14px}.product-copy{padding:20px 22px 0}.product-visual{height:176px;margin:0 18px}.product h2{font-size:25px}.product p{font-size:13px}.welcome-guide{margin-top:24px;padding:17px;gap:14px}.welcome-guide p{font-size:12px}.guide-flower{font-size:32px}.library-intro{padding:30px 0 20px}.library-intro h1{font-size:30px}}@media(prefers-reduced-motion:reduce){.product{transition:none}}
''')
books=json.loads((V2T/'output/bluey-library-v3/dist/book-data.js').read_text(encoding='utf-8').split('window.COMIC_LIBRARY = ',1)[1].split(';\nwindow.COMIC_BOOK',1)[0])
cards=''
for n,b in enumerate(books):
    cards+=f'<a class="product bluey" href="reader.html?episode={b["episode"].lower()}"><div class="product-top"><span class="number">{b["episode"]}</span><span class="small-pill">视频原声</span></div><div class="product-visual episode-cover"><img class="comic-cover episode-cover" src="{b["pages"][0]["image"]}" alt="{b["titleZh"]}漫画封面"></div><div class="product-copy"><h2>{b["titleZh"]}</h2><p>{b["title"]}</p><div class="chips"><span>{len(b["pages"])} 页漫画</span><span>{sum(len(p["panels"]) for p in b["pages"])} 个画格</span></div><div class="product-cta"><span>打开故事，开始点读</span><b>↗</b></div></div></a>'
put(WEB/'bluey/index.html',page('Bluey 原声漫画 · 故事目录','<main class="hub"><header class="library-intro"><span class="eyebrow">LISTEN, READ & SAY</span><h1>和 Bluey 一起读故事。</h1><p>喜欢的故事，熟悉的声音。选一集，点气泡听一句；<br>也可以切换“一格看”，把画面放大，慢慢听。</p></header><section class="products">'+cards+'</section><p class="reading-tip">每一集分别记住阅读位置。打开故事，会接着上次读到的地方。</p><footer class="hub-footer">一起看，一起听，一起大胆开口。<small>家庭学习项目 · 非 Bluey 官方产品</small></footer></main>','/bluey/index.html'))
reader=(WEB/'bluey/reader.html').read_text(encoding='utf-8').replace('</head>','<link rel="stylesheet" href="/navigation.css"></head>').replace('<body>','<body>'+nav.replace('href="/bluey/index.html"','href="/bluey/index.html" aria-current="page"'))
reader=reader.replace('href="#panel-1" aria-label="从第一格开始看"','href="index.html" aria-label="返回漫画目录"')
put(WEB/'bluey/reader.html',reader)

# The English activities become actual document routes, sharing only content/logic.
eng=WEB/'english';original=(eng/'app.js').read_text(encoding='utf-8')
original=original.replace('`${import.meta.env.BASE_URL}audio/${item.key}.wav`','new URL(`audio/${item.key}.wav`, import.meta.url).href')
original=original.replace("function showReport() {", "function progressView() {")
original=original.replace('<button class="primary" data-action="close-modal">继续探险</button>', '<a class="primary" href="index.html">继续探险</a>')
a=original.index('function progressView()');b=original.index('\nfunction ',a+1)
part=original[a:b].replace('  showModal(', '  return (',1)
original=original[:a]+part+original[b:]
original=original.replace("current === 'home' ? homeView()", "current === 'progress' ? '<section class=\"report-page\">'+progressView()+'</section>' : current === 'home' ? homeView()")
original=original.replace("'story', 'review'].includes(view)","'story', 'review', 'progress'].includes(view)")
original=original.replace("if (action === 'report') { showReport(); return; }", "if (action === 'report') { location.href='progress.html'; return; }")
original=original.replace("  updateChrome();\n  $('main').innerHTML", "  updateChrome();\n  $('main').innerHTML")
original=original.replace(" : exerciseView(current);\n}", " : exerciseView(current);\n  document.querySelectorAll('a[href^=\"#\"]').forEach(a=>{const id=a.getAttribute('href').slice(1);if(['home','words','build','quiz','chant','story','review','progress'].includes(id))a.href=(id==='home'?'index':id)+'.html';});\n}")
original=original.replace("window.addEventListener('hashchange', () => navigate(location.hash.slice(1)));\nnavigate(location.hash.slice(1) || 'home', false);", "window.addEventListener('hashchange', () => { const id=location.hash.slice(1); if(['home','words','build','quiz','chant','story','review','progress'].includes(id)) location.href=(id==='home'?'index':id)+'.html'; });\nwindow.addEventListener('pagehide',stopAudio);\nnavigate(document.body.dataset.view || 'home', false);")
put(eng/'app.js',original)
template=(eng/'index.html').read_text(encoding='utf-8')
template=template.replace('</head>','<link rel="stylesheet" href="/navigation.css"></head>')
template=template.replace('<body>','<body data-view="VIEW">'+nav.replace('href="/english/index.html"','href="/english/index.html" aria-current="page"'))
template=template.replace('href="#home"','href="index.html"')
for key,label in [('home','英语复习 · 探险地图'),*[(x[0],x[1]) for x in ACTIVITIES],('review','错题再练')]:
    put(eng/('index.html' if key=='home' else key+'.html'),re.sub(r'<title>.*?</title>',f'<title>{label} · 英语小花园</title>',template.replace('VIEW',key)))
with (eng/'styles.css').open('a',encoding='utf-8') as f:f.write('\n.report-page{max-width:800px;margin:25px auto;padding:30px;background:#fffef8;border:1px solid #dfe3d3;border-radius:20px}.report-page .close-dialog{display:none}.report-page .dialog-header{justify-content:center}.report-page .dialog-subtitle{text-align:center}.product-nav{flex-shrink:0}@media(max-width:600px){.report-page{padding:22px 17px}}\n')

# Keep a local server entry point; it serves the actual files and supports audio seeking.
server=(ROOT/'unit-adventure/preview.mjs').read_text(encoding='utf-8')
server=server.replace("const online=process.argv.includes('--online');",'const online=false;')
server=re.sub(r"const root=fileURLToPath\(.*?;", "const root=fileURLToPath(new URL('./',import.meta.url));", server)
server=server.replace("const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));", "const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));")
server=server.replace("'.mp3':'audio/mpeg'", "'.mp3':'audio/mpeg','.wav':'audio/wav','.png':'image/png','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'")
server=server.replace("5186", "5175")
put(WEB/'preview.mjs',server)
put(ROOT/'打开学习首页.cmd','@echo off\ncd /d "%~dp0learning-hub-v1"\n"%USERPROFILE%\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe" preview.mjs\npause\n')

# Mini program: welcome, English overview and Bluey catalog are independent pages.
welcome='''<view class="garden"><view class="eyebrow">A LITTLE ENGLISH, EVERY DAY</view><view class="hello">欢迎来到英语小花园 ✿</view><view class="headline">你好，小小探险家。<view class="soft">今天，想从哪里开始？</view></view><view class="intro">一边练习，一边听故事。<view>两种喜欢的方式，陪你把英语慢慢变熟悉。</view></view>
<navigator class="module zoo" url="/pages/english/index" hover-class="pressed"><view class="module-top"><text>01 / ENGLISH PRACTICE</text><text class="pill">练一练</text></view><view class="zoo-visual"><text class="letter">Aa</text><image class="zebra" src="/assets/welcome-zebra.png" mode="aspectFit"/><view class="bubble">He likes apples.</view></view><view class="module-title">英语复习</view><view class="module-sub">把课堂里的知识，变成自己的本领。</view><view class="module-description">词卡、拼句、问答、跟读和故事。一次选一个小练习，开口说，也动手做。</view><view class="tags"><text>词卡点读</text><text>句型练习</text><text>跟读故事</text></view><view class="module-action">进入英语复习 <text>↗</text></view></navigator>
<navigator class="module bluey" url="/pages/bluey/index" hover-class="pressed"><view class="module-top"><text>02 / BLUEY STORIES</text><text class="pill">听故事</text></view><image class="cover" src="/assets/cover.jpg" mode="aspectFill"/><view class="module-title">Bluey 原声漫画</view><view class="module-sub">喜欢的故事，现在可以点着听。</view><view class="module-description">点气泡听一句，点画面听整格。跟着 Bluey 和 Bingo，在有趣的日常里听懂英语。</view><view class="tags"><text>视频原声</text><text>气泡点读</text><text>两集故事</text></view><view class="module-action">进入漫画世界 <text>↗</text></view></navigator>
<view class="welcome-note"><view>✿ 每天一点点，就很棒。</view><text>先选一个喜欢的入口，练一会儿、读一小段。两个产品分别记住进度，下次还能接着来。</text></view><view class="footer">给好奇的孩子，也给一起陪伴的大人。<view>家庭学习项目 · 非教材或 Bluey 官方产品</view></view></view>'''
mini_nav=lambda active: '<view class="product-nav">'+''.join(f'<navigator class="{"selected" if key==active else ""}" url="{url}" open-type="reLaunch">{label}</navigator>' for key,url,label in [('home','/pages/index/index','✿ 迎宾首页'),('english','/pages/english/index','英语复习'),('bluey','/pages/bluey/index','Bluey 漫画')])+'</view>'
put(APP/'pages/index/index.wxml',mini_nav('home')+welcome)
put(APP/'pages/index/index.wxss','''page{background:#f7f5ed;color:#293f33}.garden{padding:36rpx 36rpx 26rpx;max-width:1000rpx;margin:auto}.eyebrow{font-size:17rpx;letter-spacing:3rpx;color:#8d997f;text-align:center;font-weight:600}.hello{text-align:center;font-size:28rpx;font-weight:600;margin:30rpx 0 20rpx}.headline{text-align:center;font-size:48rpx;font-weight:750;line-height:1.5;letter-spacing:-1rpx}.soft{color:#77916b;font-size:43rpx}.intro{text-align:center;color:#7c8875;font-size:24rpx;line-height:1.9;margin:23rpx 0 34rpx}.module{display:block;border:2rpx solid #d5dfc9;border-radius:36rpx;background:#edf2e3;padding:30rpx 32rpx 0;margin:28rpx 0;overflow:hidden}.module-top{display:flex;align-items:center;justify-content:space-between;color:#7c8d72;font-size:18rpx;letter-spacing:1rpx;margin-bottom:23rpx}.pill{border:1rpx solid #cbd7bd;padding:5rpx 16rpx;border-radius:30rpx;letter-spacing:0}.zoo-visual{position:relative;height:280rpx;border-radius:23rpx;background:#dfe9d0;overflow:hidden}.zebra{position:absolute;right:22rpx;top:0;width:280rpx;height:280rpx}.letter{position:absolute;left:38rpx;top:28rpx;font:bold 120rpx Georgia;color:#7e986b}.bubble{position:absolute;left:23rpx;bottom:35rpx;padding:18rpx 22rpx;background:#fffef6;border-radius:20rpx 20rpx 2rpx 20rpx;font-size:27rpx;color:#465e3f;transform:rotate(-4deg)}.cover{width:100%;height:280rpx;display:block;border-radius:23rpx}.module-title{font-size:43rpx;font-weight:700;margin-top:30rpx}.module-sub{font-size:24rpx;font-weight:600;color:#647b56;margin-top:12rpx}.module-description{font-size:23rpx;line-height:1.9;color:#7c8972;margin-top:14rpx}.tags{display:flex;gap:13rpx;margin:26rpx 0 30rpx}.tags text{font-size:20rpx;padding:8rpx 13rpx;border-radius:9rpx;background:#ffffff88;color:#6d805e}.module-action{display:flex;align-items:center;justify-content:space-between;border-top:1rpx solid #d0dbc3;padding:24rpx 0;font-weight:650;font-size:27rpx}.module-action text{border-radius:50%;background:#4b6b50;color:white;font-size:35rpx;width:55rpx;height:55rpx;line-height:55rpx;text-align:center}.bluey{background:#eaf0f2;border-color:#cddde2}.bluey .module-top,.bluey .module-description{color:#748c94}.bluey .module-sub,.bluey .tags text{color:#597884}.bluey .module-action{border-color:#d0dee2}.bluey .module-action text{background:#4a7380}.welcome-note{border:1rpx dashed #c9d1be;border-radius:24rpx;padding:26rpx;margin:37rpx 0}.welcome-note view{font-size:26rpx;font-weight:600;margin-bottom:12rpx}.welcome-note text{font-size:23rpx;line-height:1.9;color:#87917c}.footer{text-align:center;font-size:21rpx;line-height:2;color:#919c87;margin:30rpx 0}.footer view{font-size:18rpx;color:#a2aa99}.pressed{opacity:.8}''')
shutil.copy2(APP/'review/assets/animals/zebra.png',APP/'assets/welcome-zebra.png')
put(APP/'pages/index/index.json',json.dumps({'navigationBarTitleText':'英语小花园 · 欢迎'},ensure_ascii=False))
english='<view class="english-home"><view class="eyebrow">ENGLISH PRACTICE · UNIT 2</view><view class="title">把英语，<view>说给动物朋友听。</view></view><view class="intro">The zoo · 选一个小站，开始今天的复习。<view>每个练习都有自己的页面，可以随时回来换一站。</view></view><view class="progress-pill">已收集 {{stars}} / 5 颗完成星</view><view class="activities">'
for key,title,desc,icon in ACTIVITIES:
    english+=f'<navigator class="activity {key}" url="/review/pages/{key}/index" hover-class="pressed"><view class="activity-icon">{icon}</view><view class="activity-copy"><view>{title}</view><text>{desc}</text></view><text class="arrow">↗</text></navigator>'
english+='</view><view class="note">先听一听，再试着说一说。<view>今天完成一小站，也值得给自己一颗星。</view></view></view>'
put(APP/'pages/english/index.wxml',mini_nav('english')+english)
put(APP/'pages/english/index.wxss','''page{background:#f7f5ed;color:#2d4735}.english-home{padding:42rpx 36rpx;max-width:1000rpx;margin:auto}.eyebrow{font-size:18rpx;letter-spacing:2rpx;color:#889579}.title{font-size:52rpx;font-weight:750;line-height:1.45;margin:20rpx 0}.title view{color:#7d966c}.intro{font-size:24rpx;color:#7c8a74;line-height:1.9}.intro view{font-size:22rpx;margin-top:7rpx}.progress-pill{display:inline-block;border:1rpx solid #d1ddbf;border-radius:35rpx;padding:12rpx 23rpx;font-size:22rpx;color:#6b8059;margin:26rpx 0 25rpx}.activity{display:flex;align-items:center;gap:23rpx;border:1rpx solid #dde3d2;background:#fffef8;padding:28rpx 25rpx;border-radius:25rpx;margin:18rpx 0}.activity-icon{width:76rpx;height:76rpx;line-height:76rpx;text-align:center;border-radius:22rpx;background:#e8efdc;font-size:32rpx;color:#6a8356;flex-shrink:0}.build .activity-icon{background:#f5e8cf;color:#b79154}.quiz .activity-icon{background:#e9e5f3;color:#9685ac}.chant .activity-icon{background:#f5e3db;color:#bd927c}.story .activity-icon{background:#e1edf0;color:#6c94a0}.activity-copy{flex:1}.activity-copy view{font-size:29rpx;font-weight:650;margin-bottom:8rpx}.activity-copy text{font-size:22rpx;color:#88917e;line-height:1.7}.arrow{font-size:31rpx;color:#9aaa8d}.note{font-size:23rpx;line-height:1.9;text-align:center;color:#8b987f;margin-top:35rpx}.pressed{opacity:.75}''')
put(APP/'pages/english/index.json',json.dumps({'navigationBarTitleText':'英语复习 · 学习目录'},ensure_ascii=False))
put(APP/'pages/english/index.js',"""const rules = require('../../lib/english/learning');
Page({data:{stars:0},onShow(){const app=getApp();if(app.player)app.player.stop();let saved;try{saved=wx.getStorageSync(rules.storageKey)}catch{}const done=rules.completed(rules.cleanProgress(saved));this.setData({stars:Object.values(done).filter(Boolean).length});},onShareAppMessage(){return {title:'英语复习 · 选一个小练习，开始今天的探索',path:'/pages/english/index'};}});
""")
globalcss='\n.product-nav{display:flex;justify-content:center;gap:8rpx;padding:18rpx 12rpx;border-bottom:1rpx solid #e1e5d7;background:#faf9f3;color:#5c725d;font-size:24rpx}.product-nav navigator{padding:14rpx 20rpx;border-radius:38rpx;white-space:nowrap}.product-nav .selected{background:#e4edda;color:#315232;font-weight:650}\n'
with (APP/'app.wxss').open('a',encoding='utf-8') as f:f.write(globalcss)
bluey=(APP/'pages/bluey/index.wxml').read_text(encoding='utf-8')
bluey=re.sub(r'  <view class="module-links">.*?</view>\n','',bluey,count=1)
put(APP/'pages/bluey/index.wxml',mini_nav('bluey')+bluey)

# Route-aware activity controller, preserving existing learning/audio rules.
controller=(OLD/'miniprogram/review/pages/index/index.js').read_text(encoding='utf-8')
controller=controller.replace("require('../../lib/", "require('./")
controller=controller.replace('Page({','module.exports = function(activity, wx) { return {',1).rstrip()
assert controller.endswith('});');controller=controller[:-3]+'}; };\n'
controller=controller.replace("tab: 'words',", "tab: activity || 'words',")
controller=controller.replace('  onLoad() {','  onLoad(options = {}) {',1)
needle='    this.loadQuiz(0, true);\n  },'
controller=controller.replace(needle,"""    this.loadQuiz(0, true);
    const id=options.question;
    if(id){const list=this.data.tab==='build'?content.builders:this.data.tab==='quiz'?content.questions:content.storyQuestions;const index=list.findIndex(q=>q.id===id);if(index>=0){if(this.data.tab==='build')this.loadBuilder(index);else this.loadQuiz(index,this.data.tab==='story');}}
  },
  onShow(){try{this.progress=rules.cleanProgress(wx.getStorageSync(rules.storageKey));this.updateProgress();}catch{}},""")
controller=controller.replace("path:'/review/pages/index/index'", "path:'/review/pages/'+this.data.tab+'/index'")
controller=controller.replace("    this.setData({tab});\n    wx.pageScrollTo({scrollTop:0,duration:0});", "    if(tab !== this.data.tab) wx.redirectTo({url:'/review/pages/'+tab+'/index'});")
a=controller.index('  reviewWrong(event) {');b=controller.index('  resetProgress()',a)
controller=controller[:a]+"""  reviewWrong(event) {
    const id=event.currentTarget.dataset.id;
    const tab=content.builders.some(q=>q.id===id)?'build':content.questions.some(q=>q.id===id)?'quiz':content.storyQuestions.some(q=>q.id===id)?'story':null;
    if(!tab)return;this.stopAudio();wx.navigateTo({url:'/review/pages/'+tab+'/index?question='+encodeURIComponent(id)});
  },
"""+controller[b:]
put(APP/'review/lib/activity.js',controller)
activityxml=(OLD/'miniprogram/review/pages/index/index.wxml').read_text(encoding='utf-8')
activityxml=re.sub(r'  <view class="module-links">.*?</view>\n','  <navigator class="module-links" url="/pages/english/index" open-type="reLaunch">← 英语复习目录</navigator>\n',activityxml,count=1)
activityxml=mini_nav('english')+activityxml
css=(OLD/'miniprogram/review/pages/index/index.wxss').read_text(encoding='utf-8')
for key,title,_,_ in ACTIVITIES:
    folder=APP/f'review/pages/{key}'
    put(folder/'index.js',f"Page(require('../../lib/activity')('{key}', wx));\n")
    put(folder/'index.wxml',activityxml);put(folder/'index.wxss',css)
    dump(folder/'index.json',{'navigationBarTitleText':title+' · 英语复习'})
# Old shared links still open words, with the new route navigation.
put(APP/'review/pages/index/index.js',"Page(require('../../lib/activity')('words', wx));\n")
put(APP/'review/pages/index/index.wxml',activityxml)
for name in ['content', 'learning']:
    put(APP/f'lib/english/{name}.js', (OLD/f'miniprogram/review/lib/{name}.js').read_text(encoding='utf-8'))
    put(APP/f'review/lib/{name}.js', f"module.exports = require('../../lib/english/{name}');\n")
p=APP/'pages/english/index.wxml'
put(p,p.read_text(encoding='utf-8').replace('每个练习都有自己的页面，可以随时回来换一站。','认认单词，拼拼句子。每次完成一小站，也很棒。'))
app=json.loads((APP/'app.json').read_text(encoding='utf-8'));app['pages'].append('pages/english/index')
next(p for p in app['subPackages'] if p['root']=='review')['pages'] += [f'pages/{x[0]}/index' for x in ACTIVITIES]
dump(APP/'app.json',app)
config=json.loads((MINI/'project.config.json').read_text(encoding='utf-8'));config.update(projectname='english-review-bluey-1.3.0',description='迎宾首页 + 独立英语练习页 + Bluey 原声漫画')
config['condition']['miniprogram']['list'][0]['name']='迎宾首页'
config['condition']['miniprogram']['list'][1].update(name='英语复习目录',pathName='pages/english/index')
dump(MINI/'project.config.json',config)
pkg=json.loads((MINI/'package.json').read_text(encoding='utf-8'));pkg['version']='1.3.0';dump(MINI/'package.json',pkg)
put(MINI/'导入说明.txt','版本 1.3.0（本地待预览）\n\n迎宾首页介绍英语复习和 Bluey 原声漫画。\n英语复习目录下，词卡、拼句、问答、跟读、故事、收获都有独立页面；Bluey 有独立故事目录和漫画阅读页。\n保留第一集、Magic、原声素材、气泡样式和原有小程序进度键。\n微信开发者工具导入此目录。AppID：wxeffdeea9ba92682b。\n尚未上传或发布；现有线上版本不受影响。\n')
put(WEB/'使用说明.txt','英语小花园 · 迎宾首页版\n\n运行：node preview.mjs，访问 http://127.0.0.1:5175/\n也可双击 E:\\英语复习\\打开学习首页.cmd。\n首页介绍英语复习和 Bluey 两个产品；功能页各有独立地址。\n本版为本地预览，网页进度保存在此地址的浏览器中，与原有不同端口网页分别保存。\n所有历史网页、小程序版本及其记录均未删除。\n')
print('Created welcome web edition and local mini program 1.3.0.')
