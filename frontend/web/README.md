# 整合网页版

这是唯一保留的网页版实现。迎宾首页和两集 Bluey 保持原版，英语入口使用已确认的 ZZY《英语星球冒险 U0–U9》。以前位于 `E:\英语复习\learning-hub-v1`。

## 运行与修改

在本目录运行 `node scripts/serve.mjs`，或在仓库根目录执行 `pnpm dev`。默认 http://127.0.0.1:5175/ ，`PORT` 环境变量可覆盖端口。服务器运行期间，修改 `src` 后会重新构建；刷新浏览器查看。更改 `public` 后手动运行构建或重启服务。

- `src/index.html`、`hub.css`：迎宾首页。
- `src/english/`：保留的英语界面和练习逻辑；原单文件已拆为 HTML、CSS、app.js、memory.js 和 content.json。
- `src/bluey/`：两集漫画目录及点读逻辑。
- `public/english/`、`public/bluey/`：本地媒体。原声音频保留。
- `scripts/build.mjs`：生成 `dist`，同时把 content.json 转为网页加载的 data.js。不要直接修改 dist。

`node scripts/build.mjs` 后，`dist` 可作为静态网站部署。开发服务器支持音频 Range 请求与旧 Unit 2 网页路径的重定向。

## Cloudflare 预览发布

当前整合版使用 Wrangler 将 `dist/` 上传到 Cloudflare Pages，发布前先核对账号、项目和生产分支。2026-10-26 已完成独立预览部署及线上浏览器检查，正式站未替换。登录、预览网址、验证结果及发布步骤见 [根目录使用文档](../../README.md#网页打包与-cloudflare-pages-发布)。

`public/_redirects` 为云端提供旧英语链接跳转，属于需提交的源码。当前产物超过网页拖拽上传的 1,000 文件限制；发布 ZIP 用于交付，Wrangler 应上传 `dist/` 目录。`.wrangler/` 缓存、`.dev.vars*` 秘密和构建产物不提交；发布包与检查记录保存在仓库根目录的 `output/`。

## 验证

先启动服务器，再执行 `node tests/browser.cjs`。该检查使用独立浏览器上下文，不改变孩子日常浏览器中的记录；报告和截图写入仓库的 `output/qa/frontend/web/`。网页功能、音频与存储使用原来的 5175 地址测试，正常使用时也请固定这个地址。

检查线上预览时设置 `WEB_TEST_BASE_URL` 为预览站点网址、`WEB_TEST_OUTPUT` 为单独报告目录后执行同一脚本；报告目录的相对路径以 `frontend/web/` 为基准。测试结束后清除这两个环境变量再检查本地。测试记录云端整文件／分段音频响应差异，并单独验证实际播放和跳转。

内容来源和清理记录见上级 README。`dist` 是当前服务器使用的构建目录，可以由 `src` 和 `public` 重新生成；它是运行产物，不是另一套前端实现。
