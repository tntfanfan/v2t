当前 Magic 样式修订：189 个气泡继续叠放在 72 个画格内部，对照第一集改成白底、深蓝手绘轮廓、尖尾巴与圆润字样。第一集文字属于插图，没有独立字体文件；本版以 Patrick Hand 加描边作视觉匹配，网页和小程序使用同一套透明 PNG，避免设备字体替换。本机预览：http://127.0.0.1:5173/?episode=s03e10 。修订数据见 `output/S03E10/comic-v3`，独立网页见 `output/bluey-library-v3`，小程序本地版为 `E:/英语复习/miniprogram/english-review-bluey-v5`（1.2.2，尚未上传）。第一集和历史交付保留。

气泡样式构建顺序：`scripts/style-magic-bubbles.py` → `scripts/check-comic-lettering.cjs --center`（按文字实际轮廓居中并检查边界）→ `scripts/render-comic-bubbles.cjs` → `scripts/sync-comic-style-mini.py`。字体及 OFL 许可保存在 `design/fonts/`；整页、单格、原声点读和小程序编译检查通过后再打包。原声、台词及上一版的图像和气泡位置保持不变。

# Bluey · 两集原声漫画点读

2026-10-19 新增 S03E10《Magic / 魔法》：12 页、72 格、189 个气泡、261 段原声音频。S01E01《魔法木琴》继续保留。网页顶部可切换分集，各集阅读位置独立保存；第一集原有数据、媒体和进度键不变。

- 网页：`http://127.0.0.1:5173/?episode=s03e10`，重启后仍可使用根目录“启动Vite调试.cmd”。
- 新集素材：`output/S03E10/comic-v1`；原声从第三季视频本身截取，不使用同目录内误标为第二季的音频。
- 新集图片与文字由页面组合显示，文字不遮挡角色。逐句原声时间窗部分参考 ASR；6 处短发声说话人继续标为待核，尚未逐句完成全部切点听审。
- 独立双集网页包：`output/bluey-library-v1`，构建脚本 `scripts/build-bluey-library.py`。
- 合并小程序 1.2.0：`E:/英语复习/miniprogram/english-review-bluey-v3`，保留动物园英语复习、第一集和新集；1.1.0 项目不修改。此为本地项目，上传和发布状态另行记录。
- 新集数据构建：`scripts/build-magic-comic.py`；小程序初建：`scripts/build-bluey-multi-mini.py`；工作稿素材同步：`scripts/sync-magic-mini-media.py`。
- 验证：`scripts/verify-bluey-web.cjs`、`scripts/verify-bluey-mini.cjs`，以及小程序目录中的 `node --test tests/*.test.cjs`。编译和浏览器测试不代替微信真机验收。

下文保留第一集的制作与历史版本记录。

第一季第一集的独立静态网页示例。9 页原漫画、54 个画格和 115 个气泡覆盖原核对稿的 140 条记录。点击气泡听一句，点击画面听整格；全部 169 段 MP3 均从本地视频的原音轨截取，保留音乐、笑声和环境音。

支持整页/单格阅读、翻页、逐格前进、暂停继续、重听、进度拖动和 0.75/1/1.25 倍速。单播放器避免声音叠加；翻页停止播放；切换阅读模式、横竖屏及进入后台时暂停。浏览器保存阅读位置、模式和倍速，不上传阅读记录。手机可以切换“一格看”放大气泡，并使用下方台词列表点读。

## 本地运行

### Vite 开发与调试

在项目根目录执行：

```powershell
pnpm install
pnpm dev
```

需要 Node.js 22.12+（推荐 24）。Vite 配置方式参考 [官方指南](https://vite.dev/guide/)。当前本机可使用已有的 Node.js 与 pnpm，无需 npm。开发地址为 <http://127.0.0.1:5173/>，端口占用时会报错；可通过 `pnpm dev --port 5174` 改端口，此时也需同步调试配置的 URL。

- 修改 `src/styles.css` 会热更新；修改 HTML、JavaScript 或 `data/s01e01.json` 会刷新页面。
- `src/vite-entry.js` 将当前 JSON 数据接入已有播放器，Vite 处理模块与源码映射；原来的 Python 构建入口继续可用。
- 图片与音频直接读取本地 `output/S01E01/comic-web-v4/dist/assets/`；启动时检查数据引用的文件是否齐全。克隆仓库后需自行恢复该目录的媒体，缺失时会提示具体路径。
- 本流程用于前端调试，不重新切音频或生成图片；修改 JSON 中的音频时间段不会改变现有 MP3，重新切片仍使用下方的 Python 流程并创建新版本目录。
- 本机装好依赖后，可双击根目录 `启动Vite调试.cmd`，或执行 `.\启动Vite调试.cmd --open`。启动文件可在普通 Windows 终端中复用 Codex 自带的 Node.js，服务运行期间保留窗口，Ctrl+C 停止。

VS Code 打开 `E:\v2t`（或实际项目根目录），按 F5 选择“漫画点读：启动 Vite 并调试 Edge”。断点设在 `src/app.js`；启动后在页面点击按钮即可触发。若已经通过终端启动服务，使用“漫画点读：调试已运行的 Vite”。也可直接在浏览器按 F12 使用 Sources 和 Console 调试。

```powershell
pnpm build
pnpm preview
```

构建目录为 `.cache/bluey-reader/dist/`，包含源码映射、9 张图片和 169 段音频；每次构建会刷新这个开发缓存目录。预览地址为 <http://127.0.0.1:4173/>。历史交付的 `output/S01E01/comic-web-v*/` 不会被修改。

### 已有交付预览

Windows 下，重启电脑后双击项目根目录的 **`打开漫画预览.cmd`**。它会启动本地服务，并在默认浏览器打开漫画；已有服务时直接打开网页。保留弹出的运行窗口（最小化即可），关闭它会停止预览。无需先打开 Codex，也无需重新生成图片或音频。

启动文件优先使用当前用户目录里的 Codex Python 运行环境，也支持本机已安装的 `py` 或 `python`。请保留项目下的 `output/S01E01/comic-web-v4/dist/` 完整文件夹。当前默认打开依据原片动作核对修订的 v4 版，v1、v2、v3 原样保留。

已有构建位于 `output/S01E01/comic-web-v4/dist/`。在项目根目录运行：

```powershell
python -m http.server 8766 --bind 127.0.0.1 --directory output/S01E01/comic-web-v4/dist
```

浏览器打开 `http://127.0.0.1:8766/`。也可打开构建目录里的 `index.html`，数据使用普通脚本加载，无需后端接口；建议通过 HTTP 预览以获得一致的媒体行为。

## 从源码构建

Python 3.12 标准库和 FFmpeg 即可，无 npm 包或新模型。构建前准备 `data/sources.json` 指定的原视频与 9 张漫画 PNG；这些媒体不随 Git 提交。脚本会先校验源文件哈希，不会重新生成漫画或猜测新时间段。

```powershell
python -B web/bluey-reader/build.py --output output/S01E01/comic-web-v5
python -B web/bluey-reader/verify.py output/S01E01/comic-web-v5
```

输出目录必须不存在，避免覆盖已有交付。支持 `--root` 指定素材根目录、`--ffmpeg` 指定程序；默认从 `pipeline.local.json` 的 `media_dependency_dirs` 查找已有 FFmpeg，再尝试 PATH。构建失败后检查错误并选用新输出目录。

`verify.py` 检查源记录完整性、坐标范围、数据一致性、图片及音频哈希，并完整解码每段 MP3，核对时长。结果写入输出的 `qa/validation.json`；这是程序和媒体结构检查，不能替代逐句听审。

## 文件与修改方式

- `src/`：HTML、CSS 和 JavaScript；只有一个音频元素。
- `data/s01e01.json`：原图像素坐标、气泡原句与角色、源记录 ID、最终音频起止秒数。`start/end` 是原视频时间，播放器进度是切片内时间。
- `data/sources.json`：本地源文件位置和哈希、待核内容与时间精度说明。
- `build.py`：复制原图、切原声并生成 `dist/book-data.js`、`qa/source-audio.json`。
- `verify.py`：运行验证；需要当前源码和构建产物匹配。

修改点读位置或切片边界后，构建到新的版本目录，检查完整画面、单格裁切及实际声音，再更新分集索引。图片以 1024 × 1536 原始坐标映射，不修改原图文字。

## 内容与验证范围

v4 为动作核对修订：按 54 格各抽取三张原片画面，核查肢体数量、手腕/脚踝连接、尾巴位置、遮挡及道具支撑。重新生成第 1、2、7、9 页，修正第 2、3、4、6、11、41、51 格；第 3、4、5、6、8 页经检查后复用 v3 图片。第 4、6 格的爸爸尾巴按当前漫画构图遮挡处理。新版图片在 `output/S01E01/comic-characters-v4/deliverables/pages/`，内置 imagegen 提示词在 `data/character-revision-v4-prompts.json`，逐格核对记录在 `data/character-revision-v4-review.json`。角色身份和配色继续绑定 revision 5。新版 PDF 与网页使用同一组九张图片。

v3 依据 `series/bluey/visual-references/individual-20261014/` 的四张单人照片修订四位主角，使用角色表 revision 5。重点修正蓝色角色灰白手脚、Bluey 灰白腹部、爸爸金黄腹部与浅色宽边、爸爸深色尾根与浅蓝灰尾尖，以及妈妈橙色底带奶油斑点的尾巴；妈妈不再沿用 Bingo 的奶油色尾尖。九张修订图另存于 `output/S01E01/comic-characters-v3/deliverables/pages/`。生成使用内置 imagegen，初稿与局部修正提示词保存在 `data/character-revision-v3-prompts.json`。图像仍为漫画改编，四张原始照片作为主要外观依据保存，不能将生成图反向作为身份事实依据。

台词、角色归属及 169 段原视频音频保持不变，媒体哈希与新版检查记录见交付目录 `qa/`。历史 v2 继续绑定角色表 revision 4，三张整页照片及旧提示词均保留。

第 36 格按用户确认保留原句。第 22、45 格没有对白，播放对应原片环境音。源记录 20 的报幕角色、126 的部分哼唱歌词继续显示待核，不作新认定。

本版切片使用已核对台词的字幕时间窗，部分边界参考既有 ASR 词时间，添加起止余量后处理相邻重叠。字幕时间本身约有 0.5 秒误差；尚未完成所有气泡边界的逐句人工听审，不将自动校验等同于精确听审。所有最终切片时间与哈希都可追溯。

这是完整首集的点读示例；视频上传、内容生成后台、账户、审核发布工作台不在此实现中。真实手机 Safari/微信 WebView 的音频策略仍需设备验收。
