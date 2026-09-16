import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Panel, ProgressBar } from "@lumina/ui";
import { getProject } from "@/lib/services";
import { actionCreateMission, actionCreateTask } from "@/lib/actions";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProject(id);
  if (!data) notFound();
  const { project, missions, tasks, currentTask } = data;

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>{project.name}</h1>
          <p>{project.goal}</p>
        </div>
        <Badge tone="blue">{project.status}</Badge>
      </header>

      <Panel title="Progress">
        <ProgressBar value={project.progress} label={`${project.progress}%`} />
      </Panel>

      <div className="mc-grid-2">
        <Panel title="Mission Flow">
          <div className="mc-list">
            {missions.length === 0 ? (
              <p className="mc-muted">No missions yet.</p>
            ) : (
              missions.map((m) => (
                <Link key={m.id} href={`/missions/${m.id}`} className="mc-row">
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.title}</div>
                    <div className="mc-muted">{m.goal}</div>
                  </div>
                  <Badge
                    tone={
                      m.status === "done"
                        ? "green"
                        : m.status === "in_progress"
                          ? "purple"
                          : m.status === "blocked"
                            ? "red"
                            : "blue"
                    }
                  >
                    {m.status}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Current Task">
          {currentTask ? (
            <div className="mc-stack">
              <div className="mc-mono">{currentTask.code}</div>
              <div style={{ fontSize: 18, fontWeight: 650 }}>{currentTask.title}</div>
              <div className="mc-muted">
                Recommended: {currentTask.recommendedAgent} /{" "}
                {currentTask.recommendedModelTier}
                <br />
                Budget: {currentTask.resourceBudget ?? "—"} RP
              </div>
              <Link href={`/tasks/${currentTask.id}`}>
                <Button>Open</Button>
              </Link>
            </div>
          ) : (
            <p className="mc-muted">No current task.</p>
          )}
        </Panel>
      </div>

      <div className="mc-grid-2">
        <Panel title="Add Mission">
          <form action={actionCreateMission} className="mc-form">
            <input type="hidden" name="projectId" value={project.id} />
            <label>
              Title
              <input name="title" required />
            </label>
            <label>
              Goal
              <textarea name="goal" required rows={2} />
            </label>
            <label>
              Complexity (0-10)
              <input name="complexity" type="number" min={0} max={10} step={0.1} defaultValue={5} />
            </label>
            <label>
              Risk
              <select name="risk" defaultValue="medium">
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </label>
            <Button type="submit">Create Mission</Button>
          </form>
        </Panel>

        <Panel title="Quick Add Task">
          {missions[0] ? (
            <form action={actionCreateTask} className="mc-form">
              <input type="hidden" name="missionId" value={missions[0].id} />
              <label>
                Title
                <input name="title" required />
              </label>
              <label>
                Goal
                <textarea name="goal" required rows={2} />
              </label>
              <label>
                Complexity
                <input name="complexity" type="number" min={0} max={10} step={0.1} defaultValue={5} />
              </label>
              <label>
                Domain
                <select name="domain" defaultValue="logic">
                  <option value="ui">ui</option>
                  <option value="db">db</option>
                  <option value="auth">auth</option>
                  <option value="security">security</option>
                  <option value="api">api</option>
                  <option value="logic">logic</option>
                  <option value="infrastructure">infrastructure</option>
                  <option value="documentation">documentation</option>
                </select>
              </label>
              <label>
                Task type
                <select name="taskType" defaultValue="implementation">
                  <option value="planning">planning</option>
                  <option value="exploration">exploration</option>
                  <option value="implementation">implementation</option>
                  <option value="debugging">debugging</option>
                  <option value="testing">testing</option>
                  <option value="review">review</option>
                  <option value="security">security</option>
                  <option value="ui">ui</option>
                </select>
              </label>
              <label>
                Estimated files
                <input name="estimatedFiles" type="number" min={1} defaultValue={3} />
              </label>
              <label>
                Context files (one per line)
                <textarea name="contextFiles" rows={3} />
              </label>
              <label>
                Acceptance (one per line)
                <textarea name="acceptanceCriteria" rows={3} />
              </label>
              <Button type="submit">Create Task on first Mission</Button>
            </form>
          ) : (
            <p className="mc-muted">Create a mission first.</p>
          )}
        </Panel>
      </div>

      <Panel title="All Tasks">
        <div className="mc-list">
          {tasks.map((t) => (
            <Link key={t.id} href={`/tasks/${t.id}`} className="mc-row">
              <span>
                <span className="mc-mono">{t.code}</span> {t.title}
              </span>
              <Badge tone="neutral">{t.status}</Badge>
            </Link>
          ))}
        </div>
      </Panel>
    </>
  );
}
