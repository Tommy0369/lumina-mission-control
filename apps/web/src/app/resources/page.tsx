import { Badge, Button, Panel, ProgressBar } from "@lumina/ui";
import { getResources } from "@/lib/services";
import { actionSetResource } from "@/lib/actions";
import { RESOURCE_STATUS_LABEL } from "@/lib/labels";

function tone(status: string) {
  if (status === "green") return "green" as const;
  if (status === "yellow") return "yellow" as const;
  return "red" as const;
}

export default async function ResourcesPage() {
  const resources = await getResources();

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>使いすぎ（詳しく）</h1>
          <p>普段は見なくていい。強いAIを使いすぎてないかのメモ。</p>
        </div>
      </header>

      <div className="mc-stack">
        {resources.map((r) => (
          <Panel
            key={r.agent.id}
            title={r.agent.name}
            actions={
              <Badge tone={tone(r.status)}>
                {RESOURCE_STATUS_LABEL[r.status]}
              </Badge>
            }
          >
            <div className="mc-grid-3">
              <div>
                <div className="mc-muted">今日</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{r.todayRp}</div>
              </div>
              <div>
                <div className="mc-muted">今週</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{r.weekRp}</div>
              </div>
              <div>
                <div className="mc-muted">うまくいった率</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {r.successRate == null ? "—" : `${r.successRate}%`}
                </div>
              </div>
            </div>
            <ProgressBar
              value={r.todayRp}
              max={r.agent.dailySoftCapRp}
              label={`目安上限 ${r.agent.dailySoftCapRp} / 日`}
            />
            <div className="mc-muted">得意: {r.agent.bestFor.join(" / ")}</div>
            <form action={actionSetResource} className="mc-form" style={{ marginTop: 8 }}>
              <input type="hidden" name="agentId" value={r.agent.id} />
              <div className="mc-grid-3">
                <label>
                  今日
                  <input name="todayRp" type="number" defaultValue={r.todayRp} />
                </label>
                <label>
                  今週
                  <input name="weekRp" type="number" defaultValue={r.weekRp} />
                </label>
                <label>
                  状態
                  <select name="status" defaultValue={r.status}>
                    <option value="green">余裕あり</option>
                    <option value="yellow">注意</option>
                    <option value="red">逼迫</option>
                  </select>
                </label>
              </div>
              <Button type="submit" variant="secondary">
                更新
              </Button>
            </form>
          </Panel>
        ))}
      </div>
    </>
  );
}
