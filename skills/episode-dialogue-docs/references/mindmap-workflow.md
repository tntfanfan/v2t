# 分集学习总结脑图

在本集台词核对完成后读取本文件。目标是配套一张可阅读、可保存的双语学习海报式脑图，不是把完整字幕缩成小字，也不是输出 XMind 文件。仅补做脑图时复用已核对台词，不重新转写。仅修改 skill 时不自动生成任何历史集图片。

## 模板定位与保持项

从项目根目录解析 `pipeline.local.json` 的 `mindmap`：enabled 默认 true；template 指向只读参考图片；language 默认 en-zh；preferred_format 默认 png。用户当次明确只要文档时可跳过，记录原因。本项目 template 是 `input/template/Bluey_分集英语学习总结_思维导图参考模板.jpg`；其他项目未指定参考图时先询问，不默用本项目图片。

先确认模板存在，使用 view_image 查看并记录 SHA256。它是《Musical Statues》的示例海报，仅作为版式/画风参考，不据此认定当前素材的集名、编号或剧情。原图保持不变，不移动、不覆盖；不要复制进个人 skill 目录造成多个来源。

保持这些设计特征：

- 竖版白底，接近 A4 纵横比；顶部为剧名、季集号、英文集名和中文集名，彩色儿童手绘标题。
- 中央角色主题节点和彩色曲线分支；角色外观依据角色总表和本集画面，不凭模板添加未出场角色或剧情。
- 左上绿色核心词汇，右上橙色核心句型，左下蓝色语法重点，右下紫色剧情小场景，底部黄色词汇拓展和绿色学习提示。
- 圆角框、儿童友好的小插图、中英双语、清晰字号和充分留白。参考图里的手机状态栏、截图边框和界面按钮不属于模板设计，不出现在新图中。

## 先做可追溯文案

从本集已核对 transcript、角色表和原片证据整理 `WORK/mindmap.content.json`。脑图允许精选和概括，但不能反向改写原台词。未确认的句子不当作教学原句；关键剧情仍不确定时保留草稿或说明缺项，勿用模板内容补空。

五个板块和学习提示按模板保留；以下数量是排版目标，可根据真实内容和可读性减少，不为了凑数编造台词：

| 板块 | 内容与依据 | 建议数量 |
| --- | --- | --- |
| Core Vocabulary / 核心词汇 | 本集出现的高价值词，结合语境的中文释义；记录台词 ID 或原片时间依据 | 约 6 个 |
| Core Sentences / 核心句型 | 优先选短而完整的已核对原句及中文译文；引用必须逐字匹配对应台词，不把两人话语拼成一句 | 约 4 句 |
| Grammar Focus / 语法重点 | 从本集句子归纳句型和简短中文解释；自己写的例句在图上注明“练习例句”，不是原片对白 | 约 3 项 |
| Episode Scenes / 剧情小场景 | 本集实际事件的时间顺序、中英双语短概括及相应插图说明；概括不使用对白引号 | 约 4 个 |
| Vocabulary Expansion / 词汇拓展 | 与本集主题相关的拓展词及中文释义；不声称它们都在本集出现 | 约 6 个 |
| Learning Tip / 学习小贴士 | 贴合本集学习目标的一句双语建议，作为学习整理而非角色原话 | 1 条 |

文案使用独立 schema_version 1，由 mindmap.py 校验（不改变台词 schema）：

- 顶层记录 schema_version: 1、series_id、episode、title、title_zh、transcript_path、transcript_sha256、template_path、template_sha256、registry_path、registry_revision、registry_sha256、sections、learning_tip；可选 center_label、reference_images（每项为 path/sha256 对象）。路径从项目根目录解析，哈希为实际文件的完整 SHA256。角色表优先引用版本快照，保证日后可复查。
- sections 恰好包含 core_vocabulary、core_sentences、grammar_focus、episode_scenes、vocabulary_expansion 五个非空列表，对应 kind 为 episode_word、quote、grammar、scene_summary、extension。每项有非空 en、zh 和 evidence 对象，可加 illustration 提示；learning_tip 使用 kind: practice_example 和教学整理说明。
- 词汇、语法和剧情证据用真实 segment_ids；也可使用 source_path、start、end、basis 指向已检查原片区间。脚本验证引用和时间范围，内容是否真的出现仍须音画核对。
- 每个 quote（包括语法例句）必须有 evidence.segment_ids 和显式 speaker_ids；英文逐字匹配已核对台词，不能只给时间范围。多条拼接须连续、同说话人且同发声形式，英文按原条目以单个空格连接。身份待核或非逐人确认的合声填写 speaker_ids: []，不能猜角色。
- grammar 必须有非空 examples 列表，每例标 quote 或 practice_example；自编例句加 label: "练习例句"。拓展词、自编例句和学习提示在 evidence.note 中标明教学补充；不得编造原片引用。
- 出图前核对集号、片名、拼写、标点、中文语境义、语法解释、剧情顺序和角色。图中文字与这一版文案保持一致。

## 台词—说话人—插图绑定

按本地工具参考运行 `mindmap.py validate`，校验通过后运行 `build-prompt`。脚本输出提示词和同名 `.manifest.json`：从台词取得说话人，再从固定版本角色表取得外观和参考帧；不会接受 quote 自带的自由 illustration 覆盖身份。非原句的剧情插图仍须人工逐项核对。

确认身份且有已核对外观参考时，该句只配对应角色；比如句子提到 Bingo 但实际是 Bluey 说的，不能按名字配成 Bingo。画外对白保留原角色，不改为旁白。身份或外观参考未确认时只用中性道具或不配人物，不画猜测的人脸。已声明参考帧但文件缺失或哈希不符时先修复引用，不能绕过校验。

manifest 保留每句的 segment_ids、speaker_ids、delivery、配图模式、外观说明、画面中角色位置和参考图序号。查看其中所有参考图，再按 reference_images 的顺序传入图像工具；不能仅在提示词中写本地路径却不提供图片。脚本不能证明词义、翻译、剧情概括或生成图正确，仍需内容与图片验收。

## 生成图片

读取当前环境可用的 imagegen skill。使用内置 image_gen，模板标注为“版式和风格参考”，本集已核对文案才是内容来源。先查看所有本地参考图片；根据工具当前支持的参数传入参考图，不猜测参数，也不同时混用文件路径和最近图片两种引用机制。

使用构建出的 `WORK/mindmap.prompt.txt` 作为实际初次提示词；所有要显示的文字必须已写入文案字段，不以 editorial_notes 等备注偷偷替换词句。按 manifest 提供模板、当集画面和角色参考帧，原句配图遵守绑定。定向修订另存提示词，不覆盖初次提示词；修订要求仍需保持文案、说话人和外观一致。模板中的旧剧情和界面边框不得复制。

默认不透明白底，目标为清晰竖版 PNG；不承诺内置工具没有提供的精确分辨率控制。工具完成后使用其真实返回结果，展示生成图并把最终选中图片复制到本集 DELIVERABLES。不得编造缓存文件路径、只留临时预览或仅改扩展名伪装格式；如果原生结果不是 PNG，按真实格式保存并记录，需转换时遵守 imagegen 要求。

默认命名 `Bluey_<集号>_英语学习总结思维导图.png`（其他剧用其剧名；扩展名与真实格式一致）。修订放新版本目录或版本化文件名；不得覆盖原模板或旧交付。图片独立交付，除非用户要求，不把它插入 Word。

内置工具不可用或失败时保留文案与提示词，记录阻碍并说明脑图未完成；不静默切换付费 CLI/API，不自装模型。不把文案、Mermaid、SVG 或 HTML 占位物当作用户所要的参考风格图片。

## 验收与逐集记录

看完整图，再放大检查每个板块，逐条与文案比对中英文；必要时 OCR 辅助，但不能只凭 OCR 或图片存在认定通过。检查标题与集号、漏字错字、翻译、例句标签、五个分支、剧情顺序、角色和道具、排版裁切、小字可读性及模板旧内容残留。每条 quote 对照 manifest 单独检查“该句旁边画的是不是该句说话人”，不能因所有角色都画得像就跳过对应关系。优先修复具体问题后重看整图；最多做两轮定向修订，仍有实质错误则保留草稿并说明，避免无止境重试。

将以下实际信息记录到 `qa/mindmap.review.json`，再在 episodes.json 本集追加 mindmap 摘要，不覆盖原有台词状态：

- status：pending / draft / reviewed / blocked / skipped；只有实际文案与最终图片检查均通过才是 reviewed。
- template、transcript、registry：各自路径与 SHA256，角色表加 revision；content_path、validation_path、prompt_path、manifest_path、review_path，定向修订另列 repair_prompt_paths。
- generation_method（例如 built-in image_gen）、output_path、output_sha256、实际 width/height 与 image_format；没有生成则不填写虚假产物值。
- content_review、text_review、visual_review 各为 pending / passed / failed，并记录疑点和阻碍；skipped 写明用户豁免或显式配置原因。

脑图缺失或验收失败时可交付已完成文档，但必须称部分完成。以后处理“下一集”时同时查看两类交付状态，已做文档但未做脑图的集不能被默认为全套完成，也不能未经请求自行重跑所有历史集。交付时附真实图片预览、保存路径及所用提示词链接，简要说明内置生成方式。
