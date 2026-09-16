import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Panel, ProgressBar } from "@lumina/ui";
import { getMission } from "@/lib/services";
import { actionCreateTask } from "@/lib/actions";

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getMission(id);
  if (!data) notFound();
  const { mission, tasks, project } = data;

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>{mission.title}</h1>
          <p>
            {project ? (
              <Link href={`/projects/${project.id}`}>{project.name}</Link>
            ) : null}{" "}
            · {mission.goal}
          </p>
        </div>
        <Badge tone="purple">{mission.status}</Badge>
      </header>

      <div className="mc-grid-3">
        <Panel title="Risk">
          <div style={{ fontSize: 22, fontWeight: 700 }}>{mission.risk}</div>
        </Panel>
        <Panel title="Complexity">
          <div style={{ fontSize: 22, fontWeight: 700 }}>{mission.complexity}</div>
        </Panel>
        <Panel title="Progress">
          <ProgressBar value={mission.progress} label={`${mission.progress}%`} />
        </Panel>
      </div>

      <Panel title="Tasks">
        <div className="mc-list">
          {tasks.map((t) => (
            <Link key={t.id} href={`/tasks/${t.id}`} className="mc-row">
              <span>
                {t.status === "done" ? "✓" : t.status === "running" ? "●" : "○"}{" "}
                <span className="mc-mono">{t.code}</span> {t.title}
              </span>
              <Badge tone="neutral">{t.recommendedAgent ?? "—"}</Badge>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel title="Add Task">
        <form action={actionCreateTask} className="mc-form">
          <input type="hidden" name="missionId" value={mission.id} />
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
            </select>
          </label>
          <label>
            Task type
            <select name="taskType" defaultValue="implementation">
              <option value="planning">planning</option>
              <option value="exploration">exploration</option>
              <option value="implementation">implementation</option>
              <option value="debugging">debugging</option>
              <option value="review">review</option>
              <option value="security">security</option>
              <option value="ui">ui</option>
            </select>
          </label>
          <label>
            Estimated files
            <input name="estimatedFiles" type="number" defaultValue={3} />
          </label>
          <label>
            Context files
            <textarea name="contextFiles" rows={3} />
          </label>
          <Button type="submit">Create Task</Button>
        </form>
      </Panel>
    </>
  );
}
