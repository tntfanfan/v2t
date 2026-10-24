# 英语小花园 · 微信小程序 2.0.0

导入微信开发者工具时选择本目录；当前 `project.config.json` 的 AppID 为 `touristappid`，项目名为 `english-garden-2.0.0`，代码目录指向 `src/`。已生成的代码和媒体可直接编译，不需要在开发者工具内“构建 npm”。连接正式账号、手机预览或上传前需配置相应正式 AppID；本地版本与线上发布状态分别确认。根目录命令和依赖说明见 [项目使用文档](../../README.md)。

## 页面与包

- 主包：迎宾首页、英语单元选择、Bluey 故事目录，以及共用播放器和英语练习逻辑。
- `src/english/u0` 至 `u9`：每单元六个独立页面（基地、闯关、单词、录音、徽章、进度），附该单元词语、配图及句子声音。
- `src/chapters/`、`src/magic/`：S01E01、S03E10 原声漫画分包。保留旧路由和阅读位置键。
- `src/review/`：旧 Unit 2 的七个轻量路由兼容页，只跳转到新的英语入口。
- `src/lib/adventure/`：原生微信交互适配。记忆算法和题目来自保留的网页版。

新英语进度按微信本地存储保存，与网页版分别计算；没有把旧 Unit 2 的进度套到 U0–U9 上。

## 更新英语内容

在 `../web/src/english/content.json` 修改内容，然后在本目录执行：

```powershell
node scripts/sync-content.cjs
node --test tests/*.test.cjs
node scripts/verify.cjs
```

同步脚本读取网页版的词表、句子生成规则和记忆算法，复制或转换已有图片、音频，生成 10 个单元分包；它不会生成缺失的录音，也不会同步 Bluey。它需要 sharp；测试和编译工具作为开发依赖使用，不打进小程序。

首次准备开发检查依赖：在本目录执行 `pnpm install --frozen-lockfile`，按目录中提供的锁文件安装 `miniprogram-compiler`。同步所需的 sharp 和模板排版所需的 Playwright 需另行安装或复用本机运行环境。模板排版命令为 `node scripts/preview-layout.cjs`；依赖定位方法见上级 README。

## 课本长录音

90 条词语、85 条句子和 430 条 Bluey 音频均已打包，不需要外部服务器。课本长录音没有打包；保留全部清单和播放页面，并显示当前未接通状态。

`config/media.json` 的 `lessonBaseUrl` 当前为空。旧 Cloudflare 网站的录音在 2026-10-23 检查时返回 403；配置中的旧网址只作历史记录，不自动用作素材地址。接通步骤：

1. 将 `../web/public/english/` 中清单涉及的课本音频按原相对路径部署到可用 HTTPS 地址。例如设置 `https://assets.example.com/english`，其后须能拼接每条 lessons[].src。
2. 在微信后台按实际服务填写相关服务器合法域名，确保音频能由手机正常访问。
3. 填写 `config/media.json` 的 `lessonBaseUrl`，运行同步脚本，再在开发者工具和手机验证音频、拖动进度、变速与暂停。

未配置时不生成假地址、不切换为关闭域名校验。

## 图片与验证结果

为容纳新增英语模块，新小程序副本中的 44 张 JPEG 做了同尺寸压缩；网页版原图、原始素材、气泡素材与所有原声音频保持不变。转换哈希见 `image-optimization.json`。已检查第一集与《魔法》的整页／单格截图，气泡样式和字体保持原版。

仓库的 `output/qa/frontend/miniprogram/verification.json` 记录 91 条路由、413 个模板状态、全部 430 条 Bluey 原声哈希，以及每包小于 2 MiB、总包约 28.68 MiB 的本地检查。实际上传包大小以微信开发者工具为准。

以上数量与结果对应 2026-10-23 的本地检查记录；修改后需按影响范围重新验证。交互／播放器测试和模板排版检查不能替代微信模拟器和手机测试。CLI 若提示“服务端口已关闭”，可在开发者工具中手动导入本目录；发布前继续完成模拟器与手机检查，再上传相应版本。
