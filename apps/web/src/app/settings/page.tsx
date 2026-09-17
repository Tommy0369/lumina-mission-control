import { Panel } from "@lumina/ui";
import { getModelProfiles } from "@/lib/services";
import { AGENT_LABEL } from "@/lib/labels";
import { storePathForDocs } from "@/lib/store";
import type { AgentId } from "@lumina/core";

export default async function SettingsPage() {
  const profiles = await getModelProfiles();
  const byAgent = new Map<AgentId, typeof profiles>();
  for (const p of profiles) {
    const list = byAgent.get(p.agentId) ?? [];
    list.push(p);
    byAgent.set(p.agentId, list);
  }

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>設定</h1>
          <p>画面で選ぶモデル名と仕事量。内部の帯は裏側だけ。</p>
        </div>
      </header>

      {Array.from(byAgent.entries()).map(([agentId, list]) => (
        <Panel
          key={agentId}
          title={AGENT_LABEL[agentId]}
        >
          <p className="mc-muted" style={{ margin: "0 0 12px" }}>
            画面のモデル名と仕事量。内部の帯は出さない。
          </p>
          <div className="mc-list">
            {list.map((p) => (
              <div key={p.id} className="mc-row">
                <div>
                  <strong>
                    {p.pickerModel}
                    {p.pickerEffort ? ` · ${p.pickerEffort}` : ""}
                  </strong>
                  <div className="mc-muted mc-mono">{p.providerModelHint}</div>
                </div>
                <span className="mc-muted">{p.active ? "使う" : "使わない"}</span>
              </div>
            ))}
          </div>
        </Panel>
      ))}

      <Panel title="ChatGPT / Codex の注意">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>「デフォルト / おすすめのモデルセット」ではなく、モデル名を直接選ぶ</li>
          <li>仕事量は 低 / 中 / 高 / 極高 / ウルトラ</li>
          <li>GPT-5.5 は ウルトラが無く、極高まで。2026-10-14 退役予定なので推奨しない</li>
          <li>難しい作業は GPT-5.6 Sol · 高。いちばん難しいときは GPT-6 Astra · 極高</li>
        </ul>
      </Panel>

      <Panel title="Claude Code の注意">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>仕事量は 低 / 中 / 高 / 超高 / 最大</li>
          <li>ultracode は仕事量ではなく、その場のセッションモード。おすすめでは使わない</li>
          <li>Haiku 4.5 は仕事量スライダーなし</li>
          <li>いつもの実装は Sonnet 5 · 高。難しい本体は Opus 5 · 超高。いちばん長い仕事は Fable 5.1 · 最大</li>
        </ul>
      </Panel>

      <Panel title="データ">
        <p className="mc-muted" style={{ margin: 0 }}>
          いまのデータファイル:
        </p>
        <p className="mc-mono" style={{ marginTop: 8 }}>
          {storePathForDocs()}
        </p>
      </Panel>
    </>
  );
}
