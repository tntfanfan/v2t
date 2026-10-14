# v2t

分集视频与音频的分角色台词整理项目。维护跨集角色表，区分角色对白、旁白、报幕、合声与画外对白，导出 DOCX、TXT、SRT，并为每集制作双语学习总结脑图。

当前仓库包含内容整理流程、脚本、测试和产品设计，以及第一季第一集的漫画点读网页示例：9 页漫画、54 格、115 个气泡，点击播放视频原声切片。完整 H5 产品的上传、生成和审核流程仍待开发。自动转写和结构校验不能替代人工音画核对。

## 项目目录

| 路径 | 用途 |
| --- | --- |
| `AGENTS.md` | 项目操作与交付约定 |
| `skills/episode-dialogue-docs/` | 本项目维护的 skill、通用脚本与参考说明 |
| `series/bluey/` | 角色总表、版本快照、参考帧与分集进度 |
| `input/template/` | 已有分集学习脑图参考模板 |
| `input/` 中其他目录 | 本地原始视频和音频，不提交 Git |
| `output/` | 本地分集成果与检查文件，不提交 Git |
| `doc/` | 正式产品设计文档，保留历史版本 |
| `demo/` | 早期演示源码，不含片源、模型和生成结果 |
| `web/bluey-reader/` | 首集漫画点读网页源码、坐标与时间段、构建及检查脚本 |
| `tests/` | 历史回归准备脚本；测试产物留在本地 |
| `pipeline.example.json` | 可复制后按环境调整的配置示例 |

通用脚本入口位于 `skills/episode-dialogue-docs/scripts/`。根目录的 `episode_*.py`、`annotate_episode.py`、`build_episode_doc.py` 和演示脚本属于早期一次性处理代码，不直接用于后续集。

## 本地准备

在项目根目录执行下列 PowerShell 命令，仅在没有本机配置时复制示例：

```powershell
if (-not (Test-Path -LiteralPath 'pipeline.local.json')) {
    Copy-Item -LiteralPath 'pipeline.example.json' -Destination 'pipeline.local.json'
}
```

编辑 `pipeline.local.json`，填写实际的模型和依赖目录。相对路径以项目根目录为基准；示例中的 `models/faster-whisper-base.en` 是配置位置，不代表仓库附带模型，也不会自动下载模型。

将自行准备且有权处理的视频、音频放入 `input/`，按季保留目录结构。原素材、模板和已有交付不覆盖，重做使用新的输出版本目录。

环境按任务准备：

- Python 脚本已在 Python 3.12 环境验证；不依赖原作者个人目录。
- 台词与脑图规则单元测试使用标准库；DOCX 导出另需 `python-docx`。
- 媒体探测与抽帧使用 `av`、`Pillow`；OCR 另需 `rapidocr_onnxruntime`、`numpy`；ASR 使用 `faster_whisper`、`imageio_ffmpeg`、`numpy` 和本地模型。
- Word 逐页检查需要可用的文档渲染环境；Windows 下的 `render_word.ps1` 备用方案需要 Microsoft Word。
- 脑图图像生成需要独立的图像生成能力；文案校验与提示词构建脚本本身不生成图片。

`media.py` 与 `transcript.py` 的调用者须显式传参，不会自动加载整个本机配置。具体参数和依赖路由见 [本地工具与校验](skills/episode-dialogue-docs/references/local-workflow.md)。

## 使用流程

开始整理前阅读 [项目约定](AGENTS.md) 和 [分集整理 skill](skills/episode-dialogue-docs/SKILL.md)。依次确认片源与时间轴、核对角色和原句、校验结构、导出文稿、准备脑图文案、生成图片并完成文档与图片的视觉检查。

角色身份以 `series/bluey/characters.json` 为准，CSV 是查看用导出；历史交付保留当时的角色版本。新视频不应强行匹配 Bluey 的角色，模板中的剧情也不能充当其他集的事实依据。

现有 `episodes.json` 记录的是本地已处理进度，其 `input/` 和 `output/` 引用不一定随仓库提供。克隆后不要把这些历史状态当作本机已经具备相应片源或交付文件；真实集回归前应准备对应素材与已核对稿，不为消除缺失提示而改写历史记录。

## 单元测试

在项目根目录执行，不需要下载片源或模型：

```powershell
python -B -m unittest discover -s skills/episode-dialogue-docs/scripts -p "test_*.py" -v
```

测试覆盖角色与发声类型、时间码和疑点规则、来源与哈希、脑图原句及说话人绑定，以及输出防覆盖。它们不验证识别准确率、翻译质量或生成图片的文字质量。

`tests/prepare_episode_skill_regression.py` 是首集历史迁移辅助脚本，会写入特定本地结果路径，不是上述单元测试的一部分；不要对已有交付直接重跑。

## 产品设计

最新方案为 [儿童英语点读产品设计文档 v1.3](doc/儿童英语点读产品设计文档_v1.3.docx)。核心流程是家长上传视频、生成并审核漫画、孩子点击漫画气泡或画格听原声。第 15–23 节细化手机竖屏、手机横屏、Pad 横屏和 PC 的界面及交互。

首集可运行示例及本地构建方法见 [漫画点读网页](web/bluey-reader/README.md)。网页采用原图加可点击区域，支持整页/单格阅读、整格/单句原声、暂停、重听和变速；媒体素材仍由本地 `input/`、`output/` 提供。

## 版本控制边界

`.gitignore` 排除原始视频音频、分集导出、模型、下载依赖、文档渲染缓存、测试运行产物、本机配置和常见凭据文件；正式产品文档、角色资料、参考帧与指定模板保留在仓库。忽略规则不会删除本地文件。

公开仓库不应添加家庭私密视频、账户凭据或整季媒体包。提交前检查暂存区，不用 `git add -f` 绕过规则上传这些内容。新增素材和公开传播需自行确认使用范围；仓库中的角色参考、模板及其涉及的第三方作品不因进入版本控制而获得新的授权。
