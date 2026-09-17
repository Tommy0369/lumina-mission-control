import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Panel, ProgressBar } from "@lumina/ui";
import { getProject, recommendationForTask } from "@/lib/services";
import { actionDeleteProject, actionUpdateProject } from "@/lib/actions";
import {
  TASK_STATUS_LABEL,
  modelPickHint,
  recommendationLabel,
} from "@/lib/labels";
import { formatPlanIntakeSummary } from "@/lib/plan-intake";

export default async function ProjectPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProject(id);
  if (!data) notFound();
  const { project, missions, tasks, currentTask, runs } = data;
  const ordered = tasks
    .slice()
    .sort((a, b) => b.priority - a.priority || a.code.localeCompare(b.code));
  const recFor = (task: (typeof tasks)[number]) =>
    recommendationForTask(task, runs);

  return (
    <>
      <header className="mc-header">
        <div>
          <div className="mc-muted">作戦</div>
          <h1>{project.name}</h1>
          <p>{project.goal}</p>
        </div>
        <div style={{ width: 160 }}>
          <ProgressBar value={project.progress} label={`進捗 ${project.progress}%`} />
        </div>
      </header>

      {project.planIntake ? (
        <Panel title="作戦作成時のヒアリング">
          <pre
            className="mc-mono"
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {formatPlanIntakeSummary(project.planIntake)}
          </pre>
        </Panel>
      ) : null}

      {currentTask ? (
        <Panel title="いまの一歩">
          <div className="mc-stack">
            <div style={{ fontSize: 18, fontWeight: 650 }}>{currentTask.title}</div>
            <div style={{ fontWeight: 600 }}>
              {recommendationLabel(
                recFor(currentTask).agent,
                recFor(currentTask).modelTier,
              )}
            </div>
            <div className="mc-muted">
              {modelPickHint(
                recFor(currentTask).agent,
                recFor(currentTask).modelTier,
              )}
            </div>
            <Link href={`/tasks/${currentTask.id}`}>
              <Button>この作業を開く</Button>
            </Link>
          </div>
        </Panel>
      ) : null}

      <Panel title="段取り（どのAI・どのモデル・どこまで）">
        <div className="mc-list">
          {ordered.map((t, i) => (
            <Link key={t.id} href={`/tasks/${t.id}`} className="mc-row">
              <div>
                <div>
                  <span className="mc-muted">{i + 1}. </span>
                  <strong>{t.title}</strong>
                </div>
                <div style={{ marginTop: 4, fontWeight: 600 }}>
                  {recommendationLabel(recFor(t).agent, recFor(t).modelTier)}
                </div>
                <div className="mc-muted" style={{ marginTop: 2 }}>
                  {t.scope ||
                    modelPickHint(recFor(t).agent, recFor(t).modelTier)}
                </div>
              </div>
              <Badge
                tone={
                  t.status === "done"
                    ? "green"
                    : t.status === "running"
                      ? "purple"
                      : t.status === "blocked"
                        ? "red"
                        : "neutral"
                }
              >
                {TASK_STATUS_LABEL[t.status]}
              </Badge>
            </Link>
          ))}
        </div>
      </Panel>

      {missions.length > 0 ? (
        <p className="mc-muted">
          まとまり: {missions.map((m) => m.title).join(" / ")}
        </p>
      ) : null}

      <details>
        <summary className="mc-muted" style={{ cursor: "pointer" }}>
          詳しく（直す・やめる）
        </summary>
        <div className="mc-stack" style={{ marginTop: 12 }}>
          <Panel title="名前とゴールを直す">
            <form action={actionUpdateProject} className="mc-form">
              <input type="hidden" name="projectId" value={project.id} />
              <label>
                名前
                <input name="name" defaultValue={project.name} required />
              </label>
              <label>
                ゴール
                <textarea name="goal" rows={2} defaultValue={project.goal} required />
              </label>
              <label>
                説明
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={project.description}
                />
              </label>
              <Button type="submit">保存する</Button>
            </form>
          </Panel>
          <Panel title="この作戦をやめる">
            <p className="mc-muted" style={{ marginTop: 0 }}>
              取り消せない。確認のため、いまの名前を入力する。
            </p>
            <form action={actionDeleteProject} className="mc-form">
              <input type="hidden" name="projectId" value={project.id} />
              <label>
                名前（確認）
                <input name="confirmName" placeholder={project.name} required />
              </label>
              <Button type="submit" variant="secondary">
                削除する
              </Button>
            </form>
          </Panel>
        </div>
      </details>
    </>
  );
}
