import { Panel } from "@lumina/ui";
import { getModelProfiles } from "@/lib/services";
import { storePathForDocs } from "@/lib/store";

export default async function SettingsPage() {
  const profiles = await getModelProfiles();

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>Settings</h1>
          <p>Model registry · SSOT · Manual V0.1</p>
        </div>
      </header>

      <Panel title="Model Registry (Capability Tier → hint)">
        <div className="mc-list">
          {profiles.map((p) => (
            <div key={p.id} className="mc-row">
              <div>
                <strong>{p.agentId}</strong> / {p.tier} — {p.label}
                <div className="mc-muted mc-mono">{p.providerModelHint}</div>
              </div>
              <span className="mc-muted">{p.active ? "active" : "off"}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Data">
        <p className="mc-muted" style={{ margin: 0 }}>
          V0.1 local SSOT file (mirrors Supabase schema):
        </p>
        <p className="mc-mono" style={{ marginTop: 8 }}>
          {storePathForDocs()}
        </p>
        <p className="mc-muted">
          Supabase migrations live in <code>supabase/migrations/</code>. Connect
          via <code>NEXT_PUBLIC_SUPABASE_URL</code> when ready. API keys must never
          be stored in DB.
        </p>
      </Panel>

      <Panel title="Security">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>No API keys in database</li>
          <li>CLI auth stays on local machine (V0.2+)</li>
          <li>COMMIT / PUSH / DEPLOY / Migration / Delete require human approval</li>
          <li>Production auto-change is forbidden</li>
        </ul>
      </Panel>
    </>
  );
}
