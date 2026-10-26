# 项目协作约定

本文件供在此仓库工作的代理和开发者使用。项目目录与使用方法见 [README.md](README.md)；两者都应随实际实现更新。用户的当次要求优先。

## 铁律：所有产品需求与改造必须同步更新两个前端

**所有前端、后端的新产品需求和改造，都必须同时更新 `frontend/web/` 网页版与 `frontend/miniprogram/` 微信小程序版。只完成一端，不算完成任务。**

- 规划和实施时必须同时覆盖两端的页面入口、交互、内容、数据结构与接口适配；后端接口、字段、业务规则或配置发生变化时，两端对应的接入与展示也必须同步更新。
- 两端保持一致的产品能力和业务行为，按网页与微信平台分别实现适配；不得因平台不同、已有自动同步脚本或一端已经可用而省略另一端。英语同步脚本不能代替两端界面和业务逻辑的实际适配，也不会自动同步 Bluey。
- 验收和交付必须分别检查两端，说明各自完成的更新及验证结果。一端未完成或尚有阻塞时，任务仍未完成，必须明确报告，不能只展示另一端就宣称交付完成。

## 重点：两个前端均可通过 VS Code 调试和查看效果

**启动入口分工：根目录的两个 `.cmd` 是 Codex／命令行和用户双击共用的启动脚本；VS Code 的调试与任务入口定义在 `.vscode/`，复用这两个脚本。两种方式启动同一套前端，不维护另一套运行实现。**

- Codex 启动网页版时调用 `启动整合网页.cmd`；启动微信小程序时调用 `启动微信小程序.cmd /nopause`，避免自动操作停在按键等待。用户也可直接双击这两个脚本，它们不是 Codex 专用文件。
- `.vscode/launch.json` 定义“运行和调试”入口，`.vscode/tasks.json` 定义启动服务等任务。启动路径与工具定位逻辑集中维护在根目录脚本，VS Code 配置负责调用和调试参数，不另外复制一套启动逻辑。

**需要 debug、启动预览或查看运行结果时，可以直接通过 VS Code 操作两个前端。** 使用 VS Code 打开项目根目录，在“运行和调试”中选择对应配置：

- **网页版：启动并调试**：运行前置任务 `整合网页版: dev`，启动本地服务并通过 Edge 查看和调试 `http://127.0.0.1:5175/`。
- **微信小程序：启动开发者工具**：运行根目录 `启动微信小程序.cmd`，通过 CLI 打开 `frontend/miniprogram/`，随后在微信开发者工具中编译、调试和查看模拟器效果。CLI 服务端口未启用时须由用户在工具设置中开启；微信原生运行结果仍须在开发者工具或手机上检查。
- 启动入口维护在根目录启动脚本、`.vscode/launch.json` 和 `.vscode/tasks.json`。目录、端口或工具路径变化时，同步维护这两个前端的启动配置；查看结果前检查已有服务，避免重复启动占用端口。

## 项目边界与保留版本

- 项目同时维护英语学习前端和分集内容制作流程。前端只有 `frontend/web/` 与 `frontend/miniprogram/` 两个实现目录，分别服务网页和原生微信小程序。
- 用户已确认当前整合网页版为保留版本：迎宾首页介绍英语复习和 Bluey 漫画两个产品；英语复习使用 ZZY《英语星球冒险 U0–U9》；Bluey 保留 S01E01《Magic Xylophone》和 S03E10《Magic》。修改时保留未被用户要求移除的入口与功能。
- 旧 Vite、独立 Unit 2、旧小程序开发目录及迁移备份已清理。不得重新依赖根目录的旧 `web/`、`miniprogram/`、`scripts/` 或 `E:\英语复习\learning-hub-v1`。历史交付包、制作资料和当前运行源码分别管理。
- 修改前检查工作区状态与实际配置，保留用户已有改动。AppID、调试配置、资源地址以当前文件为准，不从聊天记录恢复旧值，也不为消除错误随意修改配置。

## 目录与文件职责

| 路径 | 维护约定 |
| --- | --- |
| `frontend/web/src/` | 网页 HTML、CSS、交互逻辑与内容数据的编辑入口 |
| `frontend/web/public/` | 网页图片、音频及字体许可证；部分资源不随 Git 分发 |
| `frontend/web/dist/` | 构建产物，开发服务器实际服务此目录；不要直接修改 |
| `frontend/miniprogram/src/` | 原生小程序主包、共用逻辑及分包 |
| `frontend/miniprogram/config/media.json` | 课本长录音的 HTTPS 基地址配置 |
| `frontend/dev-runtime.cjs` | 构建、检查依赖的定位辅助，不进入产品运行代码 |
| `input/` | 原始视频、音频和参考模板；按季保留目录结构 |
| `output/` | 分集成果、检查产物、历史交付和维护记录 |
| `series/bluey/` | 角色、分集索引、参考帧、版本快照与漫画制作资料 |
| `skills/episode-dialogue-docs/` | 本项目维护的分集制作流程与通用脚本 |
| `resources/wechat-promotion/` | 微信推广图片、PDF 与设计源文件，不是小程序代码 |
| `demo/`、`.demo_deps/`、`.ocr_tools/` | 本地素材、ASR 模型和媒体依赖；按 `pipeline.local.json` 判断用途，不按名称当作无用缓存删除 |

- 网页和小程序的检查报告、截图统一写入 `output/qa/frontend/web/` 与 `output/qa/frontend/miniprogram/`；分集检查放在本集新版本的输出目录中。
- 原始素材、重复素材副本、模板、正式交付、角色历史版本不删除、不覆盖。清理时区分可重建产物和唯一资料，先检查引用和本机配置；Windows 递归删除或移动前核对解析后的绝对路径与目标范围。
- 不提交原始媒体、模型、凭据、本机配置或构建缓存，不用强制添加绕过 `.gitignore`。不要根据历史索引里的旧路径假定文件仍存在。
- Cloudflare 的 `.wrangler/` 是本机账号／项目缓存，`.dev.vars` 及环境变体可能包含秘密，必须忽略；无秘密的示例文件可保留。`frontend/web/public/_redirects`、构建与检查脚本属于源码，应提交。发布 ZIP、部署检查记录和截图放在已忽略的 `output/`，不把整个 `deployment/` 或所有 JSON／ZIP 一概忽略。变更忽略规则后用 `git check-ignore` 核对，并检查是否已有敏感产物被跟踪；忽略规则不会自动移除已跟踪文件。

## 网页与小程序维护

### 英语内容同步

- 词表、词语音频、图片与课本录音清单维护在 `frontend/web/src/english/content.json`；句子规则和单元展示信息在同目录 `app.js` 的 `makeSentences`、`META` 中；记忆算法在 `memory.js`。
- 修改上述内容、配套媒体或 `config/media.json` 后，运行根目录的 `pnpm build:mini`，再检查两端。新增或修改句子时同步维护句子文本对应的音频映射与本地文件。
- `sync-content.cjs` 生成小程序 `src/english/u0` 至 `u9` 的数据、资源、页面包装文件，以及 `src/lib/adventure/catalog.js`、`memory.js`、`media-config.js`，并更新 `src/app.json` 的入口和英语分包。不要只手工改生成文件而不改来源或生成脚本。
- 同步脚本读取网页版 `app.js` 中 `const SENTENCES = makeSentences` 之前的定义。移动或重构该部分时同时维护同步脚本，不能只验证网页。
- 小程序独有的状态与微信交互维护在 `src/lib/adventure/engine.js`、`page.js`、`page.wxml`、`page.wxss`。英语各功能保持独立页面；旧 `src/review/` 是路由兼容入口，不是仍在维护的 Unit 2 产品。

### Bluey 与媒体

- 网页漫画入口、数据和交互位于 `frontend/web/src/bluey/`；小程序目录数据位于 `src/data/`，播放器及阅读逻辑位于 `src/lib/`、`src/shared/`，两集内容位于 `src/chapters/`、`src/magic/`。
- `series/bluey/comic-sources/` 保留制作坐标、校对记录、字体与许可证；它不是自动生成所有前端内容的构建入口。现有 `build:mini` 只同步英语模块，不会自动同步新增 Bluey 集数。
- 保持漫画气泡在画面内，延续第一集已确认的字体和气泡风格。修改图像尺寸、裁切、气泡位置或音频映射时，同时检查网页和小程序的整页／单格展示、点击位置与对应声音。
- 原声切片不以合成朗读冒充；不得为通过哈希检查而将未核对音频直接重新标为原声。播放器应避免多段叠播，并处理切页、暂停、重试和旧回调。
- 课本长录音由 `lessonBaseUrl` 控制。未配置或无法访问时保留明确的不可用提示，不写假地址、不关闭 `urlCheck` 来掩盖问题。词语、句子和 Bluey 音频使用已打包资源。

### 状态与配置

- 保留已使用的学习记录键、Bluey 分集记录键和兼容路由；确需变更时实现明确迁移。不要用孩子的日常浏览器数据进行清空或破坏性测试。
- 网页进度与微信进度分别保存；不声称跨设备同步。网页默认地址为 `http://127.0.0.1:5175/`，更改主机名、端口或浏览器会影响可见的本地记录。
- 小程序导入目录是 `frontend/miniprogram/`，不是其 `src/`。当前 AppID 取自 `project.config.json`；游客配置、正式配置和线上发布状态分别核实。
- 上传、提审、发布以及账号配置调整按用户已授权范围执行。本地构建、模板编译、开发者工具预览、真机检查和线上发布应分别报告，不能相互代替。

## 检查与交付

以下命令默认在仓库根目录执行；依赖准备见 README。

| 改动 | 相关检查 |
| --- | --- |
| 网页逻辑、样式或媒体路径 | `pnpm build`；启动服务后执行 `pnpm test:web`，检查受影响的手机／桌面画面 |
| 英语词表、句子、记忆算法或录音配置 | `pnpm build:mini`，并检查对应网页行为、小程序测试与编译 |
| 小程序逻辑、路由或资源 | `pnpm test:mini`、`pnpm verify:mini` |
| 小程序排版 | `node frontend/miniprogram/scripts/preview-layout.cjs` 并查看相关截图；适用时再检查微信模拟器／手机 |
| 分集通用规则或脚本 | `python -B -m unittest discover -s skills/episode-dialogue-docs/scripts -p "test_*.py" -v` |
| 仅文档 | 核对实际路径、配置、命令、链接与描述；不因文档改动重跑全部媒体处理 |

- `verify:mini` 的包体积阈值是本项目的本地检查规则；实际上传以微信开发者工具结果为准。模板在浏览器中的排版预览不等于原生微信运行验证。
- 检查报告记录实际范围与限制。不得只引用以前的通过结果声称本次已验证；遇到缺少本地资源或工具能力时明确说明。
- Cloudflare 发布先核实目标账号、项目与生产分支，流程测试使用独立预览分支。网页版检查支持 `WEB_TEST_BASE_URL` 和 `WEB_TEST_OUTPUT`，线上、线下结果分别保存；网页地址规范化与音频响应可能不同，必须检查实际功能并如实记录差异。保留 `frontend/web/public/_redirects` 中的旧入口兼容规则。部署凭据不写入代码或文档。
- 目录、命令、生成流程或配置职责变更后同步更新根 README 和相关前端说明。README 面向使用者，写目录结构与操作步骤；协作约束写在本文件。

## 分集台词与脑图约定

用户已指定：后续视频或音频的分角色台词文档及每集配套学习总结脑图，统一使用 `$episode-dialogue-docs` 流程。

- 原始素材统一放在 `input/`，按季保留原目录结构；生成结果放在 `output/`。查找片源时从 `input/` 开始，不再从项目根目录寻找季目录。
- 开始此类任务先读取 `skills/episode-dialogue-docs/SKILL.md`，这是本项目可维护的 skill 源文件。个人安装副本位于 `C:/Users/tntli/.codex/skills/episode-dialogue-docs`。两者有差异时先报告，不静默混用。
- Bluey 角色总表是 `series/bluey/characters.json`，查看用表格为 `series/bluey/characters.csv`，逐集进度为 `series/bluey/episodes.json`。
- 角色总表是身份信息的唯一来源，确认新角色后补充；角色与旁白、报幕、合声、画外对白分别记录。不确定处保留待核。
- 角色外观参考保存在 `series/bluey/visual-references/`，版本快照在 `series/bluey/history/`；索引的 current_registry 与历史交付使用的角色版本分别记录。脑图出图前运行 skill 的 mindmap.py 文案校验与提示词构建，按 manifest 绑定原句、说话人和参考帧，出图后再逐句核对配图。
- 台词默认保留英文原文，使用中文角色说明与时间码，交付 DOCX、TXT、SRT；每集另交付一张中英双语学习总结脑图，默认 PNG。用户新要求优先。
- 脑图参考 `input/template/Bluey_分集英语学习总结_思维导图参考模板.jpg`，路径由 `pipeline.local.json` 的 mindmap.template 配置。保留五大板块与画风，按当集核对稿重写文案；模板中的季集号、剧情和句子不是其他集的事实依据。图片生成使用 imagegen skill，逐项核对中英文文字后交付；模板和既有文档不覆盖。只修改 skill 不自动补做历史集。
- 只处理指定集数；“下一集”先读进度与素材目录。原始素材、重复副本、已有交付稿不删除、不覆盖。修订稿使用新版本目录。
- 根目录旧的 `episode_*.py`、`annotate_episode.py`、`build_episode_doc.py` 等第一集一次性脚本已清理；后续集使用 `skills/episode-dialogue-docs/scripts/`，不要重新依赖旧脚本。
- 现有媒体依赖和本地 ASR 模型位置见 `pipeline.local.json`；路径相对于项目根目录。不要为每集重复下载依赖或模型。
- 发布前必须完成内容核对、结构检查、逐页文档检查、脑图文案及视觉检查，并分别更新索引状态。流程封装不等于无人核对的自动识别。
