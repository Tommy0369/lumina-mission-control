# CLAUDE.md — LUMINA Mission Control

あなたは Claude Code としてこのリポジトリで働く。

## 方針

- V0.1は Manual Orchestration。CLI自動実行基盤は作らない
- Router / Prompt / Schema / 複雑実装を優先担当
- UIの軽い修正は Cursor に寄せてよい
- 変更後は handoff を意識（changed files / tests / risks / next）

## やってはいけない

- API KeyをDBやseedに入れる
- Runnerの本実装（V0.2）
- ML Routing
- スコープ外の大規模リファクタ

## 参照

- `docs/architecture/product-brief.md`
- `docs/decisions/`
- `AGENTS.md`
- `.ai/CURRENT.md`
