# 画面用語対応表

日常UIは右列だけを使う。左列はコード・DB内部名。

| 内部ID | 画面表示 | 説明 |
|--------|----------|------|
| project | つくっているもの | 完成させたい成果物全体 |
| mission | まとまり | 機能のかたまり |
| task | いまの作業 / 一歩 | 一回でやる単位 |
| run | この回の依頼 | 外部AIへの1回の作業 |
| handoff | 申し送り | 次のAI（または自分）への引き継ぎ |
| agent | おすすめのAI | Cursor / Claude Code / Codex / LUMINA |
| modelTier | （内部の強さ帯） | fast / balanced / strong / max |
| pickerModel | 選ぶモデル名 | 例: Opus 5 / GPT-5.6 Sol / GPT-6 Astra |
| pickerEffort | 仕事量 | ChatGPT: 低中高極高ウルトラ。Claude: 低中高超高最大 ultracode |
| prompt | 依頼文 | コピーして外部AIに渡す文 |

## ChatGPT / Codex の仕事量

低 / 中 / 高 / 極高 / ウルトラ

GPT-5.5 は ウルトラが無く、極高まで。2026-10-14 退役予定。推奨は GPT-5.6 か GPT-6 Astra。

## Claude Code の仕事量

低 / 中 / 高 / 超高 / 最大

ultracode は仕事量ではなく、その場のセッションモード。おすすめでは使わない。

Haiku 4.5 は仕事量スライダーなし。

## ステータス

| 内部 | 画面 |
|------|------|
| ready / todo | これから |
| running | いまやってる |
| blocked | つまった |
| review | 見直し待ち |
| done | できた |
