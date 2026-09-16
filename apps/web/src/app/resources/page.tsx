import { Badge, Panel, ProgressBar } from "@lumina/ui";
import { getResources } from "@/lib/services";
import { actionSetResource } from "@/lib/actions";
import { Button } from "@lumina/ui";

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
          <h1>AI Resources</h1>
          <p>Resource Points — not raw tokens alone</p>
        </div>
      </header>

      <div className="mc-stack">
        {resources.map((r) => (
          <Panel
            key={r.agent.id}
            title={r.agent.name}
            actions={<Badge tone={tone(r.status)}>{r.status.toUpperCase()}</Badge>}
          >
            <div className="mc-grid-3">
              <div>
                <div className="mc-muted">Today</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{r.todayRp} RP</div>
              </div>
              <div>
                <div className="mc-muted">Week</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{r.weekRp} RP</div>
              </div>
              <div>
                <div className="mc-muted">Success</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {r.successRate == null ? "—" : `${r.successRate}%`}
                </div>
              </div>
            </div>
            <ProgressBar
              value={r.todayRp}
              max={r.agent.dailySoftCapRp}
              label={`Soft cap ${r.agent.dailySoftCapRp} RP/day · retry avg ${r.avgRetry}`}
            />
            <div className="mc-muted">Best for: {r.agent.bestFor.join(" / ")}</div>
            <div className="mc-muted">
              Model tiers:{" "}
              {r.profiles.map((p) => `${p.tier}=${p.label}`).join(" · ")}
            </div>
            <form action={actionSetResource} className="mc-form" style={{ marginTop: 8 }}>
              <input type="hidden" name="agentId" value={r.agent.id} />
              <div className="mc-grid-3">
                <label>
                  Today RP
                  <input name="todayRp" type="number" defaultValue={r.todayRp} />
                </label>
                <label>
                  Week RP
                  <input name="weekRp" type="number" defaultValue={r.weekRp} />
                </label>
                <label>
                  Status
                  <select name="status" defaultValue={r.status}>
                    <option value="green">green</option>
                    <option value="yellow">yellow</option>
                    <option value="red">red</option>
                  </select>
                </label>
              </div>
              <Button type="submit" variant="secondary">
                Update resource
              </Button>
            </form>
          </Panel>
        ))}
      </div>
    </>
  );
}
