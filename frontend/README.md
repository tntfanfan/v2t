# 英语小花园 · 当前保留版本

本地开发版本 2.0.0，2026-10-23 整理。网页版以用户确认的 `learning-hub-v1`（1.3.1）为基准，保留迎宾首页、ZZY 英语星球冒险 U0–U9 和 Bluey 两集原声点读。小程序对应这套内容，英语复习已替换为 U0–U9。

```text
frontend/
  web/                 网页源码、静态媒体、构建和浏览器验证
    src/               HTML / CSS / JavaScript / 英语内容数据
    public/            英语和 Bluey 图片、音频
    scripts/           构建、开发服务器
    tests/             浏览器功能检查
    dist/              生成的可部署静态网站
  miniprogram/         微信开发者工具导入此目录
    src/               主包、Bluey 分包、U0–U9 分包
    config/media.json  课本长录音的 HTTPS 地址配置
    scripts/           同步内容、编译和包体检查
    tests/             交互和播放器测试
```

## 日常使用

双击项目根目录 `启动整合网页.cmd`，访问 http://127.0.0.1:5175/ 。也可以在 `E:\v2t` 运行 `pnpm dev`。网页运行与构建只需要 Node.js 22.12+，不再依赖旧的 Vite 工程。

微信开发者工具导入 `E:\v2t\frontend\miniprogram`，当前 `project.config.json` 的 AppID 为 `touristappid`，项目名 `english-garden-2.0.0`。无需构建 npm 即可查看已生成的原生小程序源码。连接正式账号、手机预览或上传前需配置相应正式 AppID；本地版本号不表示线上版本已更新。完整启动、依赖与检查步骤见 [项目使用文档](../README.md)。

## 功能和数据

- 迎宾首页介绍两个产品，各有独立入口。
- 英语复习：10 个单元、90 个词、五关十题、点读、句子朗读、徽章和家长进度。小程序的单词、录音、闯关、徽章和进度各有独立页面。
- Bluey：保留 S01E01《Magic Xylophone》和 S03E10《Magic》，整页／单格阅读、气泡／画格原声、暂停重听、变速及阅读位置。
- 英语内容维护在 `web/src/english/content.json`，小程序构建从该文件和网页版句子、记忆逻辑同步，避免继续维护两份词表。
- 网页继续使用原来的 5175 地址与浏览器存储键。微信进度与网页分别保存；原来的 Bluey 小程序存储键保留。

## 当前媒体状态

网页全部音频在本地可用。小程序打包了 90 条词语、85 条句子朗读及 430 条 Bluey 原声切片。体积较大的课本录音需要 HTTPS 素材服务，当前入口明确显示“暂未接通”。

旧小程序源码没有素材域名。仅在旧发布记录发现 `https://bobo-english-u0-u9.pages.dev/`，2026-10-23 检查录音得到 HTTP 403（1010），因此没有写成可用地址；该历史结果不代表今天重新检查过。配置可用素材服务的步骤见 [小程序 README](miniprogram/README.md)，域名校验保持开启。

## 目录清理记录

2026-10-23 按用户要求进一步删除旧的 Vite、单独 Unit 2、旧漫画网页、旧小程序 v1–v6 开发目录、重复依赖、一次性脚本和临时检查文件；上次迁移产生的 `frontend-archive-2026-10-23` 备份也已删除。当前只有本目录下的 web 和 miniprogram 两套实现，分别服务网页与微信。

仍有用的资料单独保留：漫画坐标、制作记录与字体在 `series/bluey/comic-sources/`，旧网站发布元数据在 `web/deployment/history/`，四个历史小程序交付 ZIP 在 `output/releases/legacy-miniprograms/`。原始视频、分集成果、角色表、台词处理 skill 和当前 ASR 模型均保留。

迁移时的文件哈希和位置记录存放于 `output/maintenance/frontend-migration-2026-10-23/`，实际删除及保留文件清单在 `output/maintenance/cleanup-2026-10-23.json`（以上路径相对仓库根目录）。这些是历史记录，里面的旧开发路径不再有效。

## 验证范围

浏览器检查覆盖双产品入口、10 单元、五类题目、音频、进度重载和手机宽度。小程序检查包含交互测试、实际 WXML/WXSS 编译、包大小与全部原声哈希，以及编译模板的手机宽度排版检查。报告和截图统一写入 `output/qa/frontend/`，不混在源码目录中。编译模板截图不等于微信模拟器或真机验证；发布前还需在开发者工具和手机检查。

检查所需的 Playwright、sharp 可以装在各项目的开发依赖中；本机也可通过 `dev-runtime.cjs` 复用已安装的 Codex 运行环境。其他机器可用 `CODEX_NODE_MODULES` 指定这些依赖的位置，`BROWSER_PATH` 指定测试浏览器。
