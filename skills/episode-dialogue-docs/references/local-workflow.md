# 本地工具与校验

## 环境

确定项目根目录 PROJECT 后先读取该目录下的 `pipeline.local.json`。从 PROJECT 解析 input_root（默认 input）、output_root（默认 output）、registry、episode_index、mindmap.template、media_dependency_dirs、local_asr_model。以下命令中的 VIDEO/AUDIO 必须指向输入目录内已确认的实际文件；WORK 与 DELIVERABLES 指向本集输出或新版本目录。media.py 和 transcript.py 不自动读取配置，调用者须显式传参；mindmap.py 以 `--project` 为路径基准，读取配置中的 input_root 和备用 registry，台词、模板及固定版本以文案字段为准。不要把说明中的变量名直接当文件名执行。

当前项目的路径示例：

```text
VIDEO        = PROJECT/input/第一季52集/分集视频/1-2/S01E01.mp4
AUDIO        = PROJECT/input/第一季52集/分集音频/1-2/S01E01.mp3
REGISTRY     = PROJECT/series/bluey/characters.json
EPISODE_INDEX= PROJECT/series/bluey/episodes.json
TRANSCRIPT   = PROJECT/output/S01E01/transcript.v1.json
MINDMAP_TEMPLATE = PROJECT/input/template/Bluey_分集英语学习总结_思维导图参考模板.jpg
WORK         = PROJECT/output/S01E01/<新运行目录>/work
DELIVERABLES = PROJECT/output/S01E01/<新运行目录>/deliverables
```

这是已有第一集的定位示例，不是授权重跑或覆盖它；处理后续集时根据索引和实际文件调整集号与路径。季内分组目录不保证都叫 1-2，先列出实际文件再确定。

先发现当前环境的 bundled Python 和文档工具，不在 skill 中锁定用户目录。媒体脚本接受重复的 `--deps DIR` 指向已有可信额外包目录；文档脚本只使用 bundled 文档依赖。缺少依赖就报告具体缺项，不静默安装或联网下载。

media.py 各命令按需导入：probe/frames 需 av、Pillow；OCR 另需 rapidocr_onnxruntime、numpy；ASR 需 faster_whisper、imageio_ffmpeg、numpy。ASR 要求明确本地模型路径，helper 不隐式下载。

以下 PYTHON 表示已发现的 Python；SKILL 表示当前 skill 目录。PowerShell 以 `& '完整python路径' '完整脚本路径' ...` 执行。

```text
PYTHON SKILL/scripts/media.py --deps MEDIA_DEPS probe --source VIDEO --source AUDIO --output WORK/source_metadata.json
PYTHON SKILL/scripts/media.py --deps MEDIA_DEPS frames --source VIDEO --times 10 30 60 --output WORK/overview.jpg
PYTHON SKILL/scripts/media.py --deps OCR_DEPS --deps MEDIA_DEPS ocr --source VIDEO --out-dir WORK/ocr --sample-every 0.5 --crop 0 0.76 1 1
PYTHON SKILL/scripts/media.py --deps MEDIA_DEPS asr --source VIDEO --model LOCAL_MODEL --language en --output WORK/asr.json
PYTHON SKILL/scripts/transcript.py validate --registry REGISTRY --transcript TRANSCRIPT --report WORK/validation.json
PYTHON SKILL/scripts/transcript.py registry-csv --registry REGISTRY --output CHARACTERS.csv
PYTHON SKILL/scripts/transcript.py export --registry REGISTRY --transcript TRANSCRIPT --out-dir DELIVERABLES --formats docx txt srt
```

所有输出默认拒绝覆盖，重跑使用新工作目录。probe 仅对显式传入的源文件做哈希，不无必要扫描、哈希整季文件。

OCR 的 crop 是 0–1 范围相对坐标，先看帧再设置，不假定分辨率。OCR 输出 groups.json、采样记录、代表帧和联系表，都是候选证据，不会自动生成角色结论。--start / --end 可用于小范围验证或加密复核。字幕闪现短于采样间隔时可能漏字，应人工回看或加密采样。

ASR 从选定媒体抽取临时单声道 16 kHz 音频，输出相对于该源开头的时间码。它不做角色聚类或角色命名，也不证明独立音频与视频同步。

## 文档质量

DOCX 使用 documents skill 的渲染流程并检查每页。先排查日志再启用备用方法。若 Windows 缺少 bundled LibreOffice 而 Microsoft Word 可用，可用 render_word.ps1 的独立隐藏 Word 实例导出 QA PDF，再以 bundled Poppler 或 PDFium 转 PNG。不关闭用户文档，不把 QA PDF 当成额外交付物。

```text
powershell -File SKILL/scripts/render_word.ps1 -DocumentPath FULL_DOCX -PdfPath NEW_QA_PDF
pdftoppm -r 200 -png NEW_QA_PDF QA/page
```

本机批量预览曾出现个别字形丢失而 PDF 文字完整。若复现，用独立进程逐页渲染（`-f N -l N`），尝试 200 DPI，或用 `-r 144 -aa no -aaVector no` 对照核实；本机测试第 2、4 页用前者、第 5 页用后者显示完整。PDFium 可作另一种检查，但也不保证消除此现象。不能直接删除角色标签或认定源文档损坏。仍需检查最后一版每页；这些参数是故障复核办法，不是所有文档的固定要求。

## 脑图生成与质量

文档导出命令不会生成脑图。按 [脑图模板与生成](mindmap-workflow.md) 先保存本集文案和证据，再使用 imagegen skill 与内置图像生成工具；优先 PNG，将工具返回的最终图片实际复制到本集 DELIVERABLES，并检查真实格式和尺寸。输出文件名使用本集集号，例如 Bluey_S01E01_英语学习总结思维导图.png；扩展名须匹配真实编码。不能只在 skill 安装目录或生成工具的默认缓存里留图。

出图前运行仅依赖标准库的文案校验和提示词构建：

```text
PYTHON SKILL/scripts/mindmap.py validate --project PROJECT --content WORK/mindmap.content.json --report WORK/mindmap.validation.json
PYTHON SKILL/scripts/mindmap.py build-prompt --project PROJECT --content WORK/mindmap.content.json --output WORK/mindmap.prompt.txt
```

第二条命令也执行校验；失败返回非零退出码且不生成提示词。成功写入提示词及 `.manifest.json`，固定可见文案、逐句说话人、参考图片顺序与哈希；不会调用图像工具或更新完成状态。输出拒绝覆盖和写入 input_root。修改文案后在新文件名或运行目录重建，不手改提示词导致它脱离 manifest。

复查旧文案时，可显式加 `--registry PROJECT/series/<series_id>/history/characters.rev-NNN.json` 选择其记录版本。旧版无 schema_version 的文案带警告兼容；新文案必须按 v1 字段记录哈希。不能为消除版本冲突直接改写历史文案。源视频不重复全量哈希，脚本核对来源记录，视频本身是否被替换应在源素材核查阶段确认。

同一 WORD/TXT/SRT/脑图组合引用同一版台词。脑图仅补做时读取已有已核对稿并输出到新的运行目录，不重转写、不覆盖文档。生成失败时保留文案、提示词和失败原因，明确报告部分完成；未经用户确认，不改走付费 CLI 或另装模型。

## 测试

```text
PYTHON -B -m unittest discover -s SKILL/scripts -p "test_*.py" -v
```

单元测试验证台词与脑图文案规则、来源哈希、说话人绑定、练习标签及错误拒绝，不评价翻译、剧情或图片质量；真实集回归再确认文字、角色、时间码和疑点保留。测试输出放隔离目录，不覆盖已交付稿。测试通过不代表已验证未来集的识别准确率或图像文字准确率。
