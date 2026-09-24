# SEO 待办（2026-09-24）

来源：Claude 与哥飞 SEO Agent（seo.web.cafe）各自独立出建议后的综合版，外链清单来自哥飞 SEO Agent
对竞品（jukeblocks.io、ai-midi.com、eldoraudio.com）的反查。关键词量与难度为 2026-08 快照。

## 已定的取舍

- **不拆 `/mp3-to-midi`、`/wav-to-midi`。** ai-midi.com 的 369 个排名词全落在首页，jukeblocks.io 同一页拿下三个词第一，
  说明谷歌把它们当同一需求。拆页会自我竞争。GSC 里某词明显排不上时，再单独拆那一页试。
- **不做 `/youtube-to-midi`。** 不支持链接输入，计划里明确不做；不为不能用的功能建页。
- **不加 HowTo 结构化数据。** Google 2023 年起不再展示 HowTo 富结果；现有 WebApplication + FAQPage 保留。
- **首页 title 不动。** 已以 "Audio to MIDI Converter" 开头并含 mp3 / wav。
- **不买外链。** 外链市场没有音乐 / 音频类目，筛出的都是无关通用大站或站群；三个竞品都靠垂直社区、媒体投稿、协会收录起量。
- **外链预期上调。** 进前十约需：wav to midi 15–30 个引用域，mp3 to midi 30–60，audio to midi 50–110。
  计划里的 90 天 8–15 个只够 wav to midi 勉强进前十。
- **midi to mp3（2,400/月，对手弱）暂不做页面。** 需要先把「导入 .mid → 导出音频」做成可用功能（`midiFileToNotes` 与播放器合成已具备基础）。

## 站内

- [x] 首页 H1 逐字包含 "audio to midi"：`src/components/home/hero.tsx` 现为 "Turn MP3 & WAV into editable MIDI"，改为如 "Audio to MIDI: turn MP3 & WAV into editable MIDI"
- [x] 首页加 vocal / piano / guitar 场景区，每个配真实原音 vs MIDI 的 A/B 示例（voice + vocal to midi 合计 1,440/月），确认文字在 SSR 输出里
  - 2026-09-24：`#voice-to-midi` / `#piano-to-midi` / `#guitar-to-midi` 替换了原示例条；新增合成人声 `vocal-line.wav`（明确标注非真人）。A/B 走转换器的 Original / MIDI 切换。
- [x] 三篇 guides 正文加描述性锚文本回首页（"audio to midi converter"、"mp3 to midi"）；现在只有 "Back to the converter" / "Convert a file now"
- [x] 统一 blog 与 guides 入口：教程都进 `/guides`，`/blog` 只放更新或关闭
  - 2026-09-24：新增 `/guides` 汇总页（教程 + 博客文章作「背景阅读」），导航去掉 Blog，保留在页脚；现有博文 URL 不动。

## 技术

- [x] sitemap 静态页加 `lastmod`（手动维护，见 `docs/deployment.md`）
- [x] 检查 `/pricing` 在 `paidPlans=false` 时内容不空洞（现已 `paidPlans=true`；false 时仍有三档说明、为何未开售、退款段落和 FAQ，不空洞）
- [ ] 接入 Bing Webmaster Tools + IndexNow（Cloudflare Crawler Hints）
  - [x] IndexNow key 文件 + `pnpm indexnow`（部署后运行）
  - [x] Bing Webmaster 从 GSC 导入站点（2026-09-24）
  - [x] Bing 里提交 `https://mididraft.com/sitemap.xml`；上线后 `pnpm indexnow` 已推送 19 个 URL（2026-09-24）
  - [ ] 可选：Cloudflare 面板开启 Crawler Hints

## 内容

- [x] Logic Pro 的 audio to midi 教程（真实输入音频、导出 `.mid`、DAW 截图、链回首页）
  - [ ] DAW 截图待补（本机未装 Logic / GarageBand）
- [x] GarageBand 的 audio to midi 教程（截图同样待补）
- [ ] 30–60 秒 YouTube 演示视频，描述放 mididraft.com 链接

## 外链

名单、发布顺序、提交文案和发布状态统一记在飞书：[MidiDraft 外链名单与发布台账](https://my.feishu.cn/docx/EMexdRJp0oGiePxrnQHchKIjn3c)。本地不另存。
