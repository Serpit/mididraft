# Analytics

Product events from the converter go to GA4. Reports live in GA4 itself —
there is no in-app dashboard.

- GA4 property: **MidiDraft** (`properties/555524070`, account Serpit)
- Web stream: MidiDraft Web, measurement ID `G-6C8T3HFK3N`
- Exploration: **Explore → MidiDraft 看板** (9 tabs, below)

## Code

| File | Role |
|------|------|
| `src/lib/analytics/events.ts` | Event names and parameters, `track()`, bucketing helpers |
| `src/components/analytics/google-analytics.tsx` | Loads gtag; signals and ad personalisation off |
| `src/components/converter/converter.tsx` | Where the events fire |

`track()` sends through `gtag` when it is loaded (production builds only) and
queues events fired before it loads. In development it logs each event to the
console as `[analytics]` instead. Add `?ga_debug=1` to a production URL to see
its events in GA4 → Admin → DebugView.

`VITE_GOOGLE_ANALYTICS_ID` is baked in at build time. Production is built by
Cloudflare Workers Builds, so it must be set as a **build variable** there;
`.env.production` only covers local `pnpm deploy`.

## Privacy rule

The privacy policy says we never record file names, audio or note data. Event
parameters are categories and coarse buckets only (`file_ext` is `other` for
unknown extensions, lengths are bucketed, results are `empty_result: yes/no`).
Keep that true when adding events.

## Events

| Event | When | Parameters |
|-------|------|------------|
| `file_loaded` | File decoded and within limits | `input_source`, `file_ext`, `audio_length`, `example_slug`, `file_index` |
| `file_rejected` | File never reached the model | `input_source`, `reason`, `file_ext` |
| `second_file_loaded` | Second file in one page visit (once) | `input_source` |
| `analyze_start` | Model run begins | `segment_length`, `run_index` |
| `analyze_complete` | Model run finished | `segment_length`, `duration_ms`, `empty_result`, `run_index` |
| `analyze_error` | Model run failed | `reason`, `segment_length` |
| `analyze_cancel` | User pressed Cancel during a run | `segment_length` |
| `preview_play` | First play of a source, per file | `preview_source` |
| `ab_compared` | Both sources played, per file | — |
| `settings_adjusted` | First change in a settings group, per file | `setting_group` |
| `midi_download` | MIDI downloaded | `input_source`, `segment_length`, `cleanup_active`, `bpm_edited`, `file_index` |
| `multi_file_drop` | Several files dropped or chosen on the homepage | `file_count` |
| `batch_entry` | In-product link to the batch page followed | `surface` (`multi_drop`, `waiting_banner`, `post_download`, `dropzone_hint`) |
| `batch_page_view` | Batch page opened | `entry` (a `batch_entry` surface, `direct` for nav/footer/search, `resume`), `plan_id` |
| `batch_paywall_view` | Unlock panel shown with files queued (once per visit) | `file_count`, `offer` |
| `batch_unlock_click` | Unlock button pressed | `signed_in`, `offer`, `file_count` |
| `batch_resume` | Batch saved before sign-in/checkout brought back | `reason` (`login`, `paid`, `cancel`, `return`), `restored` (`files`, `names`, `none`) |

## GA4 configuration

Registered as event-scoped custom dimensions (display name ← parameter):
失败原因 ← `reason`, 文件来源 ← `input_source`, 示例片段 ← `example_slug`,
识别片段长度 ← `segment_length`, 音频时长 ← `audio_length`, 空结果 ←
`empty_result`, 文件格式 ← `file_ext`, 试听来源 ← `preview_source`, 调整的设置 ←
`setting_group`, 是否清理 ← `cleanup_active`, 是否改过BPM ← `bpm_edited`.
Custom metric: 识别耗时 ← `duration_ms` (milliseconds).

A new parameter needs a new custom dimension before GA will break it down, and
dimensions only collect from the moment they exist.

Event data retention is 14 months (the default of 2 would cap explorations).
Google signals is off.

**Pending:** mark `midi_download` as a key event. GA only allows it once the
event has been received: Admin → Events → star `midi_download`.

## MidiDraft 看板 (exploration tabs)

| Tab | What it answers |
|-----|-----------------|
| 转换漏斗 | file_loaded → analyze_complete → preview_play → midi_download, by device |
| 事件总览 | Users and counts for every product event |
| 失败原因 | Why files were rejected or runs failed, by device |
| 文件来源 | Upload vs example, and which example |
| 识别表现 | Completed runs by segment length and empty result; total 识别耗时 ÷ 事件数 = average |
| 调参 | Which settings groups people touch |
| 流量来源 | Sessions by default channel group |
| 着陆页 | Sessions by landing page |
| 每日趋势 | Daily file_loaded / analyze_complete / midi_download |

Key ratios, read off the tabs: download rate = 下载 MIDI ÷ 加载文件 (funnel);
multi-file rate = users(`second_file_loaded`) ÷ users(`file_loaded`) and
A/B rate = users(`ab_compared`) ÷ users(`analyze_complete`) (事件总览).
