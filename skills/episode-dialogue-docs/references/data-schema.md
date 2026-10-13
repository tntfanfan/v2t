# 数据结构 v1

每部剧的数据保存在项目里，不放进个人 skill 安装目录。源路径相对于项目根目录，或使用可核实的绝对路径；不是相对于当前 JSON 或 skill 文件所在目录。读取 `pipeline.local.json` 的 input_root、output_root、registry、episode_index、mindmap.template，缺省素材根目录为 input，输出根目录为 output。源码与数据为 UTF-8；CSV/TXT/SRT 导出使用 UTF-8 BOM 兼容 Windows。

## 角色总表 characters.json

```json
{
  "schema_version": 1,
  "series_id": "example", "series_name": "Example", "revision": 1,
  "characters": [{
    "id": "child_a", "name_en": "Child A", "name_zh": "角色甲",
    "display_name": "Child A", "aliases": [], "status": "confirmed",
    "visual_notes": "来自已检查画面的外观特征",
    "voice_notes": "仅作提示，不代替声音比对",
    "references": [{
      "episode": "S01E01", "source": "input/第一季52集/分集视频/1-2/S01E01.mp4", "start": 12.0, "end": 14.0,
      "language": "en", "edition": "用户提供版本", "sha256": "源视频的完整SHA256",
      "basis": "原片中的确认依据"
    }]
  }],
  "changes": [{"date": "YYYY-MM-DD", "reason": "本次更新依据", "affected_episodes": []}]
}
```

ID 使用小写英文、数字、下划线或连字符，终身稳定。`status` 为 confirmed 或 provisional。每个 confirmed 角色至少一个带来源和时间段的参考。references 只是原片参考定位，不是已提取的声纹。

用于脑图插图时，另加 `visual_status: "reviewed"`、具体的 `visual_notes` 和 `visual_references` 数组。外观描述来自实际查看的原片画面，写清颜色、体型及容易混淆角色的区别，不凭名字补细节。每个参考记录：

```json
{
  "path": "series/example/visual-references/child_a-S01E01-012.jpg",
  "sha256": "参考帧文件的完整SHA256",
  "source": "input/第一季52集/分集视频/1-2/S01E01.mp4",
  "source_sha256": "原视频的完整SHA256",
  "episode": "S01E01", "time": 12.0,
  "subject_location": "画面右侧的小蓝色角色，不是左侧成年角色",
  "basis": "实际目视核对及身份确认依据"
}
```

参考帧保存在项目 `series/<series_id>/visual-references/`，不搬动或修改原片；优先复用已提取原帧。数组第一张应是清楚可辨的代表帧，提示词脚本默认只选它。多人同框必须写 subject_location。没有核对外观时不写 reviewed，脚本改用道具。后续集可复用相同角色的外观，但更换版本或造型明显变化时重新核对；声音判断仍使用对应配音版本的证据。

## 本集 transcript.json

```json
{
  "schema_version": 1, "series_id": "example", "episode": "S01E02",
  "title": "Example Episode", "title_zh": "示例集名", "language": "en", "duration": 420.0,
  "sources": [{"path": "input/第一季52集/分集视频/1-2/S01E02.mp4", "sha256": "源文件SHA256", "role": "video"}],
  "timecode_note": "从视频开头起算，采用字幕显示区间，约有半秒偏差。",
  "scope_note": "收录对白、报幕和明确发声，不逐项记录背景音乐及一般笑声。",
  "segments": [{
    "id": 1, "start": 12.0, "end": 14.0,
    "speaker_ids": ["child_a"], "delivery": "dialogue", "text": "Hello!",
    "section": "场景名称", "text_status": "reviewed", "speaker_status": "reviewed",
    "evidence": ["ocr:1，原片 12 秒画面核对"], "source_ids": ["ocr:1"], "review_note": ""
  }],
  "coverage": {
    "source_ids": ["ocr:1", "ocr:2"],
    "excluded": [{"id": "ocr:2", "reason": "片尾制作人员名单"}],
    "review_note": "已检查无字幕空档，另外补入的发声需说明依据。"
  }
}
```

`delivery` 为 dialogue、offscreen_dialogue、narration、title_announcement、chorus、singing、vocalization 之一。发声形式和角色无强制绑定；有身份的旁白也可以引用真实角色。

`text_status` 为 reviewed 或 uncertain。`speaker_status` 为 reviewed、uncertain 或 group。reviewed 只表示已核对，不代表绝对正确。

- 未知角色：speaker_ids 为空，speaker_status 为 uncertain，review_note 写明原因。导出显示“说话人待核”。候选角色可留在 review_note，不能伪装为确定身份。
- 非逐人确认的合声：speaker_ids 为空，speaker_status 为 group，delivery 为 chorus，另加 group_label 如“片头合声”。已确认的多人合声直接填多个 ID。
- 不确定文字或身份都必须有 review_note。原文中出现“待核”或“听不清”时，文字状态不能为 reviewed。
- 每条 evidence 至少一个非空条目，只记实际取得的证据。source_ids 可以为空，例如人工从无字幕音轨补入的声音，但仍需 evidence。
- 正常按 start 排序，时间在 [0, duration]，end 大于 start。真实重叠允许，后出现的重叠条目须加 overlap_note；不要用它掩盖定位错误。
- coverage.source_ids 为本次选用候选稿中全部稳定编号。所有编号都要被 segment 引用或带原因排除；同一编号可被拆分到多条。多次 OCR/ASR 用不同前缀区分。
- section 可选，按本集剧情自然划分；不照搬上集分段。导出不擅自合并台词。

## QA 和逐集索引

validation.json 由脚本生成，只是结构校验。内容和视觉验收另存 qa/review.json：记录 content_review、visual_review、unresolved、output_files 和审阅说明。只有真正逐页检查后才写 visual_review 为 passed。

episodes.json 记录集号、源文件、结构化稿路径、交付路径、status（draft / reviewed_with_uncertainties / reviewed）、待核事项、角色表 revision、source/registry 哈希、QA 路径。生成失败不得标记完成。后续修订用新版本路径，保留旧记录；正文和说话人修订需记录理由。

本项目角色表和索引位于 series/bluey，逐集结构化稿与交付文件位于 output/<集号>；它们引用的原始视频、音频位于 input。角色表修改前将旧文件原样保存为 `history/characters.rev-NNN.json`，新版本递增 revision 并记录变更。索引顶层 `current_registry` 保存当前 path/revision/sha256；各集和脑图记录中的 registry_revision、registry_sha256、registry_snapshot 表示生成或核对时实际使用的版本，不因当前角色表升级而改写历史来源。素材迁移只更新活动引用并记录原因，保留素材哈希和台词。CSV 从角色 JSON 重新导出，不分别手改；替换查看用 CSV 前保留旧版本。

## 配套脑图

脑图文案、来源和图片验收使用独立文件，不改动 transcript.json 的台词字段和 schema_version。字段约定见 [脑图模板与生成](mindmap-workflow.md)。transcript.py 校验和导出台词；mindmap.py 校验脑图文案并生成绑定说话人的提示词与来源清单，不生成或验收图片。

逐集索引在现有记录上追加 mindmap 对象，保留原有台词 status 和历史输出。mindmap.status 为 pending / draft / reviewed / blocked / skipped；其中 skipped 仅用于用户明确不需要脑图或配置显式禁用，必须说明原因。只有真实图片生成并检查通过才写 reviewed。新流程的完整交付需要台词达到 reviewed 或 reviewed_with_uncertainties，且脑图达到 reviewed（或用户明确豁免）。旧记录缺少 mindmap 字段只说明历史上未记录脑图，不能当作脑图已完成。
