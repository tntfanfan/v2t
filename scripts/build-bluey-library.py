"""Save a standalone two-episode web delivery, preserving historical editions."""
from pathlib import Path
import json,shutil,zipfile
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/bluey-library-v3'
DIST=OUT/'dist'
if DIST.exists():raise FileExistsError(f'Preserve existing delivery {DIST}')
DIST.mkdir(parents=True)
reader=ROOT/'web/bluey-reader'
for name in ['index.html','app.js','styles.css','library.css']:shutil.copy2(reader/'src'/name,DIST/name)
books=[json.loads((reader/f'data/{e}.json').read_text(encoding='utf-8')) for e in ['s01e01','s03e10']]
(DIST/'book-data.js').write_text('window.COMIC_LIBRARY = '+json.dumps(books,ensure_ascii=False,separators=(',',':'))+';\nwindow.COMIC_BOOK=new URLSearchParams(location.search).get("episode")==="s03e10"?window.COMIC_LIBRARY[1]:window.COMIC_LIBRARY[0];\n',encoding='utf-8')
shutil.copytree(ROOT/'output/S01E01/comic-web-v4/dist/assets',DIST/'assets')
shutil.copytree(ROOT/'output/S03E10/comic-v3/dist/assets/s03e10',DIST/'assets/s03e10')
shutil.copy2(reader/'design/fonts/patrickhand-OFL.txt',OUT/'Patrick-Hand-LICENSE.txt')
(OUT/'使用说明.txt').write_text('Bluey 两集原声点读漫画\n\nS01E01 魔法木琴：9页54格。\nS03E10 Magic 魔法：12页72格。\n\nMagic 气泡对照第一集改成白底、深蓝轮廓、尖尾巴和圆润手写字样。第一集文字已画进插图，没有独立字体文件；本版使用 Patrick Hand 加描边作视觉匹配。网页和小程序使用相同气泡图片，手机无需安装字体。\n\n打开 dist/index.html 即可从上方选择一集；建议通过本地HTTP服务打开。\n当前本机 Vite 地址：http://127.0.0.1:5173/?episode=s03e10\n关闭电脑后在 E:\\v2t 双击“启动Vite调试.cmd”可重新启动。\n\n新集所有声音均截自用户提供的原视频。部分切点尚待逐句听审，6处短发声说话人保留待核；原始资料及历史版本均保留。\n小程序项目位于 E:\\英语复习\\miniprogram\\english-review-bluey-v5，版本1.2.2（本地版，未上传）。\n',encoding='utf-8-sig')
archive=OUT/'Bluey_两集原声点读漫画_网页版.zip'
with zipfile.ZipFile(archive,'x',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(OUT.rglob('*')):
  if p.is_file() and p!=archive:z.write(p,p.relative_to(OUT))
print(archive)
