# Bluey 原声漫画 · 微信小程序

将现有 `web/bluey-reader` 的 S01E01 网页 v4 改编为微信原生小程序。沿用 9 页、54 格、115 个气泡和 169 段视频原声；内容、坐标、待核标注不变。当前范围是可导入工程，不含账号注册、正式发布或预览码。

## 目录

- `src/`：原生小程序目录页、阅读页、播放器与持久化逻辑。
- `scripts/`：图片副本转换、工程构建、包校验、WXML/WXSS 编译检查。
- `tests/`：音频生命周期、页面跳转与阅读状态测试。
- `IMPORT.md`：随交付工程提供的导入说明。

没有运行时 npm 依赖。开发依赖只有微信生态的 `miniprogram-compiler`，用于 WXML/WXSS 检查；导入开发者工具时不需要安装它。

## 构建与验证

从本目录执行：

```powershell
pnpm install
pnpm test
node scripts/build.cjs --output E:\v2t\output\S01E01\comic-miniprogram-v1
node scripts/verify.cjs E:\v2t\output\S01E01\comic-miniprogram-v1
node scripts/compile.cjs E:\v2t\output\S01E01\comic-miniprogram-v1
```

构建输入：`web/bluey-reader/data/s01e01.json` 和 `output/S01E01/comic-web-v4/dist/`。构建依赖 Python + Pillow，默认查找当前用户 Codex 已有 Python；其他电脑可通过 `--python <python.exe>` 或 `BLUEY_PYTHON` 指定已安装的环境。无需下载原片、重跑 ASR 或重新生成漫画。

输出目录必须不存在。后续修改先用 `.cache/bluey-miniprogram/draft-02` 等新缓存目录验证，再生成 `comic-miniprogram-v2` 等新版本。原网页、原 PNG、MP3 与历史交付不覆盖。

## 包结构

目录和共享逻辑位于主包；九个普通分包分别对应九页漫画，页面通过 `redirectTo` 切换，不累积导航栈。每个分包只引用主包与自身资源。音频保留原文件，图片转换为同尺寸 JPEG；音频较大的章节将图片放入可被分包引用的主包。

校验限制使用主包/单分包小于 2 MiB、总计小于 20 MiB 的保守预算。当前微信官方文档总包上限为 30M（服务商代开发为 20M），单包 2M；上传仍以开发者工具结果为准。[微信分包文档](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html)

## 播放与阅读

`app.js` 维护一个播放器管理器；新音频创建前停止并销毁旧上下文。每个上下文的事件检查对象身份，避免已销毁音频的延迟事件污染新状态。页面卸载时只释放自己持有的监听，避免跨页生命周期顺序造成新页被旧页停止。翻页停止，切模式/后台暂停，不自动续播。

读取/写入位置均校验范围；本机存储失败时页面会提示本次位置未保存。与网页的浏览器记录相互独立。

`scripts/layout-preview.cjs <工程目录>` 是可选的布局检查辅助工具：从实际编译后的 WXML 树生成浏览器近似视图，固定在本机 5180 端口。它不模拟微信 API，也不作为真机验收依据，不进入交付小程序。

## 当前检查与限制

14 项逻辑测试、完整媒体和数据校验、首页及 108 个阅读状态的模板生成通过。详细结果随交付保存在 `qa/`。独立 WXML/WXSS 编译器版本为 0.2.3，不能替代当前微信开发者工具编译；没有完成微信真机播放与交互验收。AppID 暂为游客占位，配置真实/测试 AppID 后再进行微信扫码预览。

本轮浏览器布局检查接口两次返回 kernel assets 路径错误，因此没有保存浏览器截图；未把其他版本的网页截图当作小程序验证。既有音频边界逐句听审和待核内容也没有因移植而改成“已完成”。
