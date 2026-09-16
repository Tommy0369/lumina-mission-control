import Link from "next/link";
import { Badge, Panel } from "@lumina/ui";
import { listRuns } from "@/lib/services";

export default async function RunsPage() {
  const rows = await listRuns();

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>Runs</h1>
          <p>TASK と AI実行を分離して測る</p>
        </div>
      </header>
      <Panel title="History">
        <div className="mc-list">
          {rows.length === 0 ? (
            <p className="mc-muted">No runs yet.</p>
          ) : (
            rows.map(({ run, task, handoff }) => (
              <div key={run.id} className="mc-row">
                <div>
                  <div>
                    <span className="mc-mono">{run.code}</span>{" "}
                    {task ? (
                      <Link href={`/tasks/${task.id}`}>{task.code}</Link>
                    ) : (
                      "—"
                    )}{" "}
                    · {run.agent} / {run.modelTier} / {run.mode}
                  </div>
                  <div className="mc-muted">
                    RP {run.resourcePointsActual ?? run.resourcePointsEstimated}
                    {handoff?.nextAgent ? ` · next ${handoff.nextAgent}` : ""}
                  </div>
                </div>
                <Badge
                  tone={
                    run.status === "success"
                      ? "green"
                      : run.status === "failure"
                        ? "red"
                        : "purple"
                  }
                >
                  {run.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Panel>
    </>
  );
}
