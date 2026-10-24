# v2t · 英语小花园与分集内容制作

项目包含整合网页版、对应的原生微信小程序，以及视频／音频的分角色台词和学习脑图制作流程。本文说明当前目录结构、运行方法和内容维护方式；开发协作约定见 [AGENTS.md](AGENTS.md)。

当前前端版本为 `2.0.0`，只有 `frontend/web/` 和 `frontend/miniprogram/` 两套实现，提供相同的两个产品入口：

| 模块 | 功能 |
| --- | --- |
| 迎宾首页 | 介绍英语复习、Bluey 漫画，并进入各自页面 |
| 英语复习 | ZZY《英语星球冒险 U0–U9》：10 个单元、90 个词、五类练习、点读、徽章与家长进度；小程序按功能提供独立页面 |
| Bluey 原声漫画 | S01E01《Magic Xylophone》、S03E10《Magic》；整页／单格阅读、气泡／画格原声、暂停、重听、变速与阅读位置保存 |

学习记录保存在当前浏览器或微信本地，没有账号后台或跨设备进度同步。原始素材和内容制作流程独立于前端，启动网页不需要运行转写、文档或脑图工具。

## 目录结构

以下路径相对项目根目录；当前电脑为 `E:\v2t`。标注“本地”的素材、配置、依赖和生成产物不一定随 Git 提供。

```text
v2t/
├─ AGENTS.md                       开发协作、内容制作与检查约定
├─ README.md                       本文：目录说明和使用方法
├─ package.json                    两端统一命令，版本与 Node.js 要求
├─ 启动整合网页.cmd                 Windows 网页服务启动器
├─ 打开整合网页.url                 打开本地网址，需先启动服务
├─ frontend/
│  ├─ README.md                    前端总览
│  ├─ dev-runtime.cjs              开发检查工具的依赖与浏览器定位
│  ├─ web/
│  │  ├─ src/                     网页源码
│  │  │  ├─ index.html            迎宾首页
│  │  │  ├─ english/              英语界面、词表、句子和记忆逻辑
│  │  │  └─ bluey/                漫画目录、内容数据和点读界面
│  │  ├─ public/                  图片、音频和许可证；媒体为本地资源
│  │  ├─ scripts/                 静态构建与本地服务器
│  │  ├─ tests/                   浏览器功能检查
│  │  ├─ deployment/history/      历史网站发布元数据
│  │  └─ dist/                    生成的网站；服务器实际读取此目录
│  └─ miniprogram/
│     ├─ project.config.json      开发者工具入口，miniprogramRoot 为 src/
│     ├─ package.json             本地编译检查依赖
│     ├─ pnpm-lock.yaml           编译检查依赖锁文件
│     ├─ config/media.json        课本长录音 HTTPS 基地址
│     ├─ scripts/                 英语内容同步、编译和排版检查
│     ├─ tests/                   练习交互和播放器测试
│     └─ src/
│        ├─ app.*                 应用配置、入口与全局样式
│        ├─ pages/                迎宾首页、英语单元选择、Bluey 目录
│        ├─ lib/                  播放器、阅读逻辑、英语原生交互
│        ├─ shared/               共用漫画模板与样式
│        ├─ data/                 漫画目录数据
│        ├─ assets/               共用本地资源
│        ├─ english/u0 … u9/      生成的英语分包：数据、资源及六类页面
│        ├─ chapters/             S01E01 漫画分包
│        ├─ magic/                S03E10 漫画分包
│        └─ review/               旧 Unit 2 路由跳转兼容页
├─ input/                         本地原始视频／音频，按季保留原目录结构
│  └─ template/                   共享的学习总结脑图参考模板
├─ output/                        本地分集成果、历史交付与检查产物
│  ├─ qa/frontend/                网页、小程序检查报告和截图
│  ├─ maintenance/                目录迁移、保留与清理记录
│  ├─ releases/                   历史小程序交付 ZIP
│  └─ validation-history/         历史台词验证记录和文稿
├─ series/bluey/                  角色表、逐集索引、参考帧和版本快照
│  └─ comic-sources/              漫画制作坐标、校对资料、字体与许可证
├─ skills/episode-dialogue-docs/   分集制作 skill、通用脚本与使用参考
├─ resources/wechat-promotion/     推广图片、PDF 和设计源文件
├─ demo/                          本地演示素材、成果和在用 ASR 模型
├─ .demo_deps/、.ocr_tools/        本地媒体／OCR 依赖
├─ .vscode/                       本机调试入口与启动任务
├─ pipeline.example.json          分集制作配置示例
└─ pipeline.local.json            本机素材、模板、依赖和模型配置
```

`dist/`、生成的英语分包、历史交付 ZIP 都不是另一套需要独立开发的前端。源码入口和生成文件的对应关系见下文“修改与同步内容”。旧 Vite 工程、单独 Unit 2 产品和早期小程序开发目录已清理；保留的历史记录中仍可能出现旧路径。

## 启动整合网页版

### 本机直接打开

1. 双击根目录的 `启动整合网页.cmd`，保持服务窗口运行。
2. 双击 `打开整合网页.url`，或在浏览器访问 [迎宾首页](http://127.0.0.1:5175/)。
3. 从首页进入 [英语复习](http://127.0.0.1:5175/english/index.html) 或 [Bluey 漫画](http://127.0.0.1:5175/bluey/index.html)。

启动器优先使用 PATH 中的 Node.js，也支持当前用户已安装的 Codex Node.js 运行环境。网址快捷方式只打开页面，不会启动服务。

### 命令行运行与构建

网页启动、构建只需要 **Node.js 22.12 或以上**，无须安装 Vite。根 `package.json` 指定 `pnpm@11.25.0`；以下命令均在项目根目录执行：

```powershell
pnpm dev
```

未安装 pnpm 时，可直接运行同一入口：

```powershell
node frontend/web/scripts/serve.mjs
```

服务器启动时构建网站，默认只监听本机 `127.0.0.1:5175`。修改 `frontend/web/src/` 后自动重新构建，需手动刷新浏览器；修改 `public/` 媒体后运行 `pnpm build` 或重启服务。停止服务用 `Ctrl+C`。

```powershell
pnpm build
```

构建结果在 `frontend/web/dist/`，可交给静态网站服务器部署。页面使用从站点根目录开始的路径，部署时把 `dist/` 的内容作为站点根目录。`pnpm preview` 与 `pnpm dev` 使用同一个本地服务器，也会构建，默认端口同为 5175。

需要临时换端口时，在当前 PowerShell 中设置后启动：

```powershell
$env:PORT = '5176'
pnpm dev
```

学习进度与网址来源有关：`127.0.0.1`、`localhost` 或不同端口会使用不同的浏览器记录。日常使用建议固定默认地址。

### VS Code 调试

用 VS Code 打开整个项目根目录，在“运行和调试”中选择 **网页版：启动并调试**。它通过 `整合网页版: dev` 前置任务启动网页服务，再打开 Edge。配置在 `.vscode/launch.json` 与 `.vscode/tasks.json`，浏览器路径按本机安装位置调整；若已手动启动服务，可直接使用现有网页，避免重复占用端口。

## 导入微信小程序

1. 打开微信开发者工具，导入 **`E:\v2t\frontend\miniprogram`**，不要选择里面的 `src/`。
2. 当前 `project.config.json` 的项目名为 `english-garden-2.0.0`，AppID 为 **`touristappid`**，代码目录为 `src/`。
3. 使用已生成的代码和本地资源编译，检查迎宾首页、英语入口及两集 Bluey。产品运行代码不需要在开发者工具内“构建 npm”。

当前是游客项目配置。后续连接正式账号、手机预览或上传时，需要配置相应正式 AppID，并使用有权限的微信账号。本地 `2.0.0` 版本号不代表线上版本已更新；本地编译、手机验证、上传和发布是不同步骤。

VS Code 的 **微信小程序：启动开发者工具** 也可打开项目；其中的 CLI 路径按本机安装位置配置。若工具提示“服务端口已关闭”，可先在开发者工具界面手动导入。

小程序的单词、句子和 Bluey 原声已经打包；**课本长录音目前尚未配置可用的 HTTPS 地址**。具体接通方法见下文。小程序页面结构、媒体与检查说明见 [小程序 README](frontend/miniprogram/README.md)。

## 修改与同步内容

| 要修改的内容 | 编辑入口 | 后续操作 |
| --- | --- | --- |
| 迎宾首页、网页布局 | `frontend/web/src/index.html`、相关 CSS | 网页构建／刷新；小程序布局在自身 `src/pages/` 中维护 |
| 英语词表、图片／音频清单 | `frontend/web/src/english/content.json`、`frontend/web/public/english/` | 网页构建，并运行 `pnpm build:mini` |
| 英语句子规则、单元展示、记忆算法 | `frontend/web/src/english/app.js` 的 `makeSentences`、`META`，以及 `memory.js` | 同步维护句子音频映射；网页构建并运行 `pnpm build:mini` |
| 小程序英语交互与共用页面 | `frontend/miniprogram/src/lib/adventure/engine.js`、`page.js`、`page.wxml`、`page.wxss` | 运行小程序测试与编译检查 |
| Bluey 网页内容与点读 | `frontend/web/src/bluey/`、`frontend/web/public/bluey/` | 检查画格、气泡与原声对应关系 |
| Bluey 小程序内容与点读 | `frontend/miniprogram/src/data/`、`lib/`、`shared/`、`chapters/`、`magic/` | 两端分别维护并检查；英语同步脚本不会新增或同步 Bluey 集数 |
| 课本长录音地址 | `frontend/miniprogram/config/media.json` | 运行 `pnpm build:mini`，再验证手机播放 |

```powershell
pnpm build
pnpm build:mini
```

网页构建把 `src/` 和 `public/` 组合到 `dist/`，并从 `content.json` 生成 `dist/english/data.js`。不要直接修改 `dist/`；当前构建会复制和更新文件，不自动清除已从源码删除的旧文件，删除／重命名资源后需检查构建目录。

小程序同步读取网页词表、句子生成规则及记忆算法，生成 `src/english/u0` 至 `u9` 的数据、资源和页面包装文件，以及 `src/lib/adventure/` 内的 `catalog.js`、`memory.js`、`media-config.js`，并更新应用的英语分包配置。这些生成文件应通过来源或脚本修改，避免下一次同步覆盖手工改动。

### 接通课本长录音

当前 `frontend/miniprogram/config/media.json` 中 `lessonBaseUrl` 为空。单词、句子和 Bluey 音频不依赖此地址；它只控制课本长录音。配置中的 `previousWebsiteUrl` 是历史记录，不会作为备用地址自动使用。

1. 按 `content.json` 各单元的 `lessons[].src`，将 `frontend/web/public/english/` 下对应音频保留相对目录上传到可用 HTTPS 素材服务。
2. 将该目录的 HTTPS 基地址填入 `lessonBaseUrl`，使基地址与每条 `src` 拼接后能访问正确的音频。
3. 在微信后台配置与实际素材服务匹配的服务器合法域名，再执行 `pnpm build:mini`。
4. 在开发者工具和手机上检查播放、拖动进度、暂停及变速。

地址未配置时，页面显示未接通提示。不要用历史地址代替验证，也不要通过关闭域名校验掩盖访问问题。

## 开发检查

### 准备检查依赖

日常启动网页不需要以下依赖。小程序编译检查依赖 `miniprogram-compiler`，从现有锁文件安装：

```powershell
pnpm --dir frontend/miniprogram install --frozen-lockfile
```

英语分包同步另需 `sharp`，浏览器功能检查和小程序模板排版检查另需 `playwright`。`frontend/dev-runtime.cjs` 先寻找相应项目中安装的包，再尝试 `CODEX_NODE_MODULES` 指向的目录，未设置时尝试当前用户的 Codex 依赖目录。

没有可复用运行环境时，可按需安装到对应项目：

```powershell
pnpm --dir frontend/web add -D playwright
pnpm --dir frontend/miniprogram add -D sharp playwright
```

这些安装会更新对应开发依赖和锁文件，不进入产品运行代码。浏览器检查优先使用 `BROWSER_PATH` 指定的可执行文件，其次尝试本机 Edge；都没有时，需为 Playwright 准备 Chromium，例如执行 `pnpm --dir frontend/web exec playwright install chromium`。

### 检查命令与产物

以下命令在项目根目录运行；网页版检查前，先在另一个终端保持 `pnpm dev` 运行。使用自定义端口时，检查终端中的 `PORT` 也要相同。

| 命令 | 作用 | 产物 |
| --- | --- | --- |
| `pnpm test:web` | 独立浏览器上下文检查入口、英语练习、音频、进度和手机宽度 | `output/qa/frontend/web/` |
| `pnpm test:mini` | 小程序练习交互、页面状态与播放器单元测试 | 终端结果 |
| `pnpm verify:mini` | WXML／WXSS 编译、路由、包体积和 Bluey 原声哈希检查 | `output/qa/frontend/miniprogram/verification.json` |
| `node frontend/miniprogram/scripts/preview-layout.cjs` | 将编译模板放入浏览器检查排版 | `output/qa/frontend/miniprogram/layout/` |

包体积阈值是本项目的本地检查规则，实际上传结果以开发者工具为准。模板排版截图不等于微信原生运行效果；发布前还需检查模拟器和手机。浏览器检查使用隔离上下文，不读取或清空孩子日常浏览器的学习进度。

## 分集台词与脑图制作

开始处理指定集数前，阅读 [分集制作 skill](skills/episode-dialogue-docs/SKILL.md) 和 [本地工具使用说明](skills/episode-dialogue-docs/references/local-workflow.md)。这个流程交付带中文角色说明和时间码的英文台词 DOCX、TXT、SRT，以及一张中英双语学习总结脑图 PNG。

首次配置只在本机配置缺失时复制示例：

```powershell
if (-not (Test-Path -LiteralPath 'pipeline.local.json')) {
    Copy-Item -LiteralPath 'pipeline.example.json' -Destination 'pipeline.local.json'
}
```

在 `pipeline.local.json` 填写实际素材、依赖和本地 ASR 模型位置，相对路径均以项目根目录为基准。`pipeline.example.json` 中的模型路径只是示例，仓库不会自动下载模型。已有本机配置使用的 `demo/`、`.demo_deps/`、`.ocr_tools/` 包含在用资源。

操作顺序：

1. 从 `input/` 确认片源、音频和时间轴，从 `series/bluey/episodes.json` 确认指定集数的进度。
2. 以 `series/bluey/characters.json` 为角色身份来源，结合字幕、音画逐句核对；OCR 和 ASR 只提供候选证据。
3. 校验台词结构，导出文档并逐页检查；准备脑图文案，校验原句、说话人和参考帧后生成并检查图片。
4. 将结果放入 `output/<集号>/<新版本目录>/`，记录所用角色版本并更新进度。保留原素材、模板和既有交付。

通用脚本在 `skills/episode-dialogue-docs/scripts/`。`media.py` 与 `transcript.py` 的调用者需按配置显式传参，不能假定脚本自动读取所有本机设置；完整参数示例见上述工具说明。

Python 工具已在 Python 3.12 验证。规则单元测试只使用标准库；文稿导出需 `python-docx`，抽帧需 `av`／`Pillow`，OCR 和 ASR 依赖按任务从本机配置复用。文档逐页检查需要文档渲染工具；`render_word.ps1` 备用方案需要 Microsoft Word。脑图校验脚本不直接生成图片，出图另需图像生成能力。

```powershell
python -B -m unittest discover -s skills/episode-dialogue-docs/scripts -p "test_*.py" -v
```

这些测试验证结构与约束，不代替真实台词、角色、翻译或脑图文字的人工核对。

## 常见问题与文件分发

| 现象 | 处理方法 |
| --- | --- |
| 打开网址但无法访问 | 先启动网页服务并保持窗口运行；核对输出端口；不要直接打开源码 HTML |
| 提示 5175 端口已占用 | 检查是否已有本项目服务；优先访问现有地址，或设置其他 `PORT`，不要结束不明进程 |
| 修改媒体后没有变化 | `public/` 不在自动监听范围内，执行构建或重启服务，再刷新页面 |
| 换浏览器或网址后进度为空 | 学习记录按浏览器和网址来源保存；回到原浏览器、原地址查看 |
| 小程序课本录音无法播放 | 当前基地址为空时属于未接通状态，按“接通课本长录音”配置 |
| 新电脑缺图、缺音频或缺模型 | 补齐被 Git 忽略的本地资源，不能仅凭源码恢复所有媒体 |

`.gitignore` 排除了原始媒体、导出文件、模型、依赖、本机配置、网页构建产物，以及前端多数音频／漫画资源和生成分包。迁移电脑时需另行复制这些必要资源；小程序的英语包可以在词表、原媒体和依赖齐备后重新生成，Bluey 分包则需保留现有资源。`episodes.json` 的历史记录不代表新电脑上已经具有对应素材。

更多前端说明见 [前端总览](frontend/README.md)、[网页版说明](frontend/web/README.md) 和 [小程序说明](frontend/miniprogram/README.md)。本地目录清理明细位于 `output/maintenance/cleanup-2026-10-23.json`，仅供追溯，不是启动或恢复旧工程的入口。
