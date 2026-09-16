import Link from "next/link";
import { Badge, Button, Panel, ProgressBar } from "@lumina/ui";
import { getDashboard } from "@/lib/services";
import { actionSeedDogfood } from "@/lib/actions";

function statusTone(status: string) {
  if (status === "green") return "green" as const;
  if (status === "yellow") return "yellow" as const;
  if (status === "red") return "red" as const;
  return "neutral" as const;
}

export default async function DashboardPage() {
  const data = await getDashboard();

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>Mission Control</h1>
          <p>Plan. Route. Build. Review. Learn.</p>
        </div>
        <form action={actionSeedDogfood}>
          <Button type="submit" variant="secondary">
            Seed Dogfood Project
          </Button>
        </form>
      </header>

      <div className="mc-grid-2">
        <Panel title="Next Action">
          {data.nextTask ? (
            <div className="mc-stack">
              <div className="mc-row" style={{ border: "none", padding: 0, background: "transparent" }}>
                <div>
                  <div className="mc-mono">{data.nextTask.code}</div>
                  <div style={{ fontSize: 20, fontWeight: 650, marginTop: 4 }}>
                    {data.nextTask.title}
                  </div>
                  <div className="mc-muted" style={{ marginTop: 6 }}>
                    Recommended: {data.nextTask.recommendedAgent ?? "—"} /{" "}
                    {data.nextTask.recommendedModelTier ?? "—"}
                  </div>
                </div>
                <Badge tone="purple">{data.nextTask.status}</Badge>
              </div>
              <Link href={`/tasks/${data.nextTask.id}`}>
                <Button>Open Task</Button>
              </Link>
            </div>
          ) : (
            <div className="mc-stack">
              <p className="mc-muted">No ready tasks. Seed dogfood or create a project.</p>
              <Link href="/projects">
                <Button variant="secondary">Go to Projects</Button>
              </Link>
            </div>
          )}
        </Panel>

        <Panel title="Today">
          <div className="mc-grid-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div>
              <div className="mc-muted">Tasks</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{data.today.total}</div>
            </div>
            <div>
              <div className="mc-muted">Done</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{data.today.done}</div>
            </div>
            <div>
              <div className="mc-muted">Running</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{data.today.running}</div>
            </div>
            <div>
              <div className="mc-muted">Blocked</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{data.today.blocked}</div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mc-grid-2">
        <Panel title="Blockers">
          {data.blocked.length === 0 ? (
            <p className="mc-muted">No blockers.</p>
          ) : (
            <div className="mc-list">
              {data.blocked.map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="mc-row">
                  <span>
                    <span className="mc-mono">{t.code}</span> {t.title}
                  </span>
                  <Badge tone="red">blocked</Badge>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Running AI">
          {data.running.length === 0 ? (
            <p className="mc-muted">No active runs.</p>
          ) : (
            <div className="mc-list">
              {data.running.map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`} className="mc-row">
                  <span>
                    <span className="mc-mono">{t.code}</span> {t.title}
                  </span>
                  <Badge tone="purple">{t.recommendedAgent}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="AI Resource">
        <div className="mc-list">
          {data.resources.map((r) => (
            <div key={r.agent.id} className="mc-row">
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <strong>{r.agent.name}</strong>
                  <Badge tone={statusTone(r.status)}>{r.status.toUpperCase()}</Badge>
                </div>
                <div className="mc-muted" style={{ marginTop: 6 }}>
                  Best for: {r.bestFor.join(" / ")}
                  {r.successRate != null ? ` · Success ${r.successRate}%` : ""}
                </div>
                <div style={{ marginTop: 8 }}>
                  <ProgressBar
                    value={r.todayRp}
                    max={r.agent.dailySoftCapRp}
                    label={`Today ${r.todayRp} / ${r.agent.dailySoftCapRp} RP`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Active Projects">
        {data.activeProjects.length === 0 ? (
          <p className="mc-muted">No projects yet.</p>
        ) : (
          <div className="mc-list">
            {data.activeProjects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="mc-row">
                <span>● {p.name}</span>
                <span className="mc-muted">{p.progress}%</span>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
