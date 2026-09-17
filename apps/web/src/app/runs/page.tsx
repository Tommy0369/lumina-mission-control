import Link from "next/link";
import { Badge, Panel } from "@lumina/ui";
import { listRuns } from "@/lib/services";
import { RUN_STATUS_LABEL, recommendationLabel } from "@/lib/labels";

export default async function RunsPage() {
  const rows = await listRuns();

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>依頼の履歴</h1>
          <p>外部AIに頼んだ回数の記録（詳しく）</p>
        </div>
      </header>
      <Panel title="履歴">
        <div className="mc-list">
          {rows.length === 0 ? (
            <p className="mc-muted">まだない。</p>
          ) : (
            rows.map(({ run, task, handoff }) => (
              <div key={run.id} className="mc-row">
                <div>
                  <div>
                    {task ? (
                      <Link href={`/tasks/${task.id}`}>{task.title}</Link>
                    ) : (
                      "—"
                    )}
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>
                    {recommendationLabel(run.agent, run.modelTier)}
                  </div>
                  <div className="mc-muted">
                    {handoff?.nextAgent
                      ? `次のAI: ${handoff.nextAgent}`
                      : "申し送りなし"}
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
                  {RUN_STATUS_LABEL[run.status] === "成功"
                    ? "できた"
                    : RUN_STATUS_LABEL[run.status] === "失敗"
                      ? "つまった"
                      : RUN_STATUS_LABEL[run.status]}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Panel>
    </>
  );
}
