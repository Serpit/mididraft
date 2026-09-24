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
  - [ ] Bing 里提交 `https://mididraft.com/sitemap.xml`（导入后 Sitemaps 列表为空）
  - [ ] 可选：Cloudflare 面板开启 Crawler Hints

## 内容

- [x] Logic Pro 的 audio to midi 教程（真实输入音频、导出 `.mid`、DAW 截图、链回首页）
  - [ ] DAW 截图待补（本机未装 Logic / GarageBand）
- [x] GarageBand 的 audio to midi 教程（截图同样待补）
- [ ] 30–60 秒 YouTube 演示视频，描述放 mididraft.com 链接

## 外链

DR / 月访问为哥飞 SEO Agent 实测（SimilarWeb，2026-08）。dofollow 为惯例判断，发布后看源码 `rel` 确认。

| 优先级 | 渠道 | 类型 | DR | 月访问 | dofollow | 做法 |
|-|-|-|-|-|-|-|
| P0 | midi.org | 行业协会 | 76 | 9.5 万 | 待确认 | 查 Innovation Award 申请条件并申请（eldoraudio 已入选） |
| P0 | bedroomproducersblog.com | 垂直媒体 | 65 | 118 万 | 编辑稿通常是 | 发上线新闻稿 |
| P0 | musicradar.com | 音乐媒体 | 79 | 380 万 | 编辑稿通常是 | 新闻稿 pitch（jukeblocks 被报道过） |
| P0 | gearspace.com | 论坛 | 72 | 139 万 | 帖内多否 | New Products 板块发新品帖 |
| P0 | kvraudio.com | 论坛 + 产品库 | 75 | 118 万 | 论坛否，新闻库待确认 | 提交产品数据库、论坛发帖、新闻投稿 |
| P0 | Reddit | 论坛 | — | — | 否 | r/edmproduction、r/musicproduction、r/WeAreTheMusicMakers、r/ableton、r/FL_Studio、r/synthesia 回答 audio to midi 类提问，表明作者身份；新号先养，不要一上来发链接 |
| P1 | viberate.com | 音乐平台博客 | 64 | 53 万 | 编辑稿通常是 | pitch 制作人工作流选题 |
| P1 | rekkerd.org | 音乐软件新闻 | 未测 | 未测 | 通常是 | 新闻稿 pitch |
| P1 | alternativeto.net | 软件目录 | 80 | 230 万 | 多否 | 提交为现有 audio to midi 工具的替代品 |
| P1 | theresanaiforthat.com | AI 目录 | 77 | 471 万 | 免费收录多否 | 以 AI audio to MIDI 定位提交 |
| P1 | futuretools.io | AI 目录 | 69 | 33 万 | 多否 | 官网表单提交 |
| P1 | vi-control.net | 论坛 | 52 | 51 万 | 否 | 注册参与讨论 |
| P1 | discuss.cakewalk.com | DAW 论坛 | 未测 | 未测 | 否 | 以用户身份在 audio to midi 帖参与 |
| P1 | forum.modartt.com | 钢琴软件论坛 | 未测 | 未测 | 否 | 同类帖参与 |
| P1 | Trustpilot | 评价平台 | — | — | 否 | 建品牌页 |
| P2 | Product Hunt | 发布平台 | — | — | 否 | 发布一次，不买票 |
| P2 | Hacker News | 技术社区 | — | — | 否 | Show HN：浏览器本地跑、音频不上传 |
| P2 | themusicindustrytoolkit.com | 资源目录 | 7 | 1.9 万 | 待确认 | 顺手提交 |

- [ ] midi.org Innovation Award
- [ ] bedroomproducersblog.com 新闻稿
- [ ] musicradar.com 新闻稿
- [ ] gearspace.com 新品帖
- [ ] KVR 产品库 + 论坛 + 新闻投稿
- [ ] Reddit 答题
- [ ] viberate.com / rekkerd.org pitch
- [ ] 目录：alternativeto / theresanaiforthat / futuretools / themusicindustrytoolkit
- [ ] 论坛：vi-control / discuss.cakewalk.com / forum.modartt.com
- [ ] Trustpilot 品牌页
- [ ] Product Hunt + Show HN

之后：发布后用 GSC「链接」报告看哪些渠道带来真实引荐，加码有效的。
