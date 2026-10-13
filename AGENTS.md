# 分集台词项目约定

用户已指定：后续视频或音频的分角色台词文档及每集配套学习总结脑图，统一使用 `$episode-dialogue-docs` 流程。

- 原始素材统一放在 `input/`，按季保留原目录结构；生成结果放在 `output/`。查找片源时从 `input/` 开始，不再从项目根目录寻找季目录。

- 开始此类任务先读取 `skills/episode-dialogue-docs/SKILL.md`，这是本项目可维护的 skill 源文件。个人安装副本位于 `C:/Users/tntli/.codex/skills/episode-dialogue-docs`。两者有差异时先报告，不静默混用。
- Bluey 角色总表是 `series/bluey/characters.json`，查看用表格为 `series/bluey/characters.csv`，逐集进度为 `series/bluey/episodes.json`。
- 角色总表是身份信息的唯一来源，确认新角色后补充；角色与旁白、报幕、合声、画外对白分别记录。不确定处保留待核。
- 角色外观参考保存在 `series/bluey/visual-references/`，版本快照在 `series/bluey/history/`；索引的 current_registry 与历史交付使用的角色版本分别记录。脑图出图前运行 skill 的 mindmap.py 文案校验与提示词构建，按 manifest 绑定原句、说话人和参考帧，出图后再逐句核对配图。
- 台词默认保留英文原文，使用中文角色说明与时间码，交付 DOCX、TXT、SRT；每集另交付一张中英双语学习总结脑图，默认 PNG。用户新要求优先。
- 脑图参考 `input/template/Bluey_分集英语学习总结_思维导图参考模板.jpg`，路径由 `pipeline.local.json` 的 mindmap.template 配置。保留五大板块与画风，按当集核对稿重写文案；模板中的季集号、剧情和句子不是其他集的事实依据。图片生成使用 imagegen skill，逐项核对中英文文字后交付；模板和既有文档不覆盖。只修改 skill 不自动补做历史集。
- 只处理指定集数；“下一集”先读进度与素材目录。原始素材、重复副本、已有交付稿不删除、不覆盖。修订稿使用新版本目录。
- 根目录旧的 `episode_*.py`、`annotate_episode.py`、`build_episode_doc.py` 是第一集的一次性脚本，不直接用于后续集。
- 现有媒体依赖和本地 ASR 模型位置见 `pipeline.local.json`；路径相对于项目根目录。不要为每集重复下载依赖或模型。
- 发布前必须完成内容核对、结构检查、逐页文档检查、脑图文案及视觉检查，并分别更新索引状态。流程封装不等于无人核对的自动识别。
