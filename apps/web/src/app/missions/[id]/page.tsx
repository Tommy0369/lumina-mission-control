import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Panel, ProgressBar } from "@lumina/ui";
import { getMission } from "@/lib/services";
import { actionCreateTask, actionDeleteMission, actionUpdateMission } from "@/lib/actions";
import { MISSION_STATUS_LABEL, RISK_LABEL, agentLabel } from "@/lib/labels";

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
        <Badge tone="purple">{MISSION_STATUS_LABEL[mission.status]}</Badge>
      </header>

      <div className="mc-grid-3">
        <Panel title="リスク">
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {RISK_LABEL[mission.risk]}
          </div>
        </Panel>
        <Panel title="複雑度">
          <div style={{ fontSize: 22, fontWeight: 700 }}>{mission.complexity}</div>
        </Panel>
        <Panel title="進捗">
          <ProgressBar value={mission.progress} label={`${mission.progress}%`} />
        </Panel>
      </div>

      <Panel title="タスク">
        <div className="mc-list">
          {tasks.map((t) => (
            <Link key={t.id} href={`/tasks/${t.id}`} className="mc-row">
              <span>
                {t.status === "done" ? "✓" : t.status === "running" ? "●" : "○"}{" "}
                <span className="mc-mono">{t.code}</span> {t.title}
              </span>
              <Badge tone="neutral">{agentLabel(t.recommendedAgent)}</Badge>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel title="タスク追加">
        <form action={actionCreateTask} className="mc-form">
          <input type="hidden" name="missionId" value={mission.id} />
          <label>
            タイトル
            <input name="title" required />
          </label>
          <label>
            ゴール
            <textarea name="goal" required rows={2} />
          </label>
          <label>
            複雑度
            <input
              name="complexity"
              type="number"
              min={0}
              max={10}
              step={0.1}
              defaultValue={5}
            />
          </label>
          <label>
            領域
            <select name="domain" defaultValue="logic">
              <option value="ui">UI</option>
              <option value="db">DB</option>
              <option value="auth">認証</option>
              <option value="security">セキュリティ</option>
              <option value="api">API</option>
              <option value="logic">ロジック</option>
              <option value="infrastructure">インフラ</option>
            </select>
          </label>
          <label>
            タスク種別
            <select name="taskType" defaultValue="implementation">
              <option value="planning">計画</option>
              <option value="exploration">探索</option>
              <option value="implementation">実装</option>
              <option value="debugging">デバッグ</option>
              <option value="review">レビュー</option>
              <option value="security">セキュリティ</option>
              <option value="ui">UI</option>
            </select>
          </label>
          <label>
            想定ファイル数
            <input name="estimatedFiles" type="number" defaultValue={3} />
          </label>
          <label>
            コンテキストファイル
            <textarea name="contextFiles" rows={3} />
          </label>
          <Button type="submit">タスク作成</Button>
        </form>
      </Panel>

      <details>
        <summary className="mc-muted" style={{ cursor: "pointer" }}>
          詳しく（直す・やめる）
        </summary>
        <div className="mc-stack" style={{ marginTop: 12 }}>
          <Panel title="まとまりを直す">
            <form action={actionUpdateMission} className="mc-form">
              <input type="hidden" name="missionId" value={mission.id} />
              <label>
                名前
                <input name="title" defaultValue={mission.title} required />
              </label>
              <label>
                ゴール
                <textarea name="goal" rows={2} defaultValue={mission.goal} required />
              </label>
              <Button type="submit">保存する</Button>
            </form>
          </Panel>
          <Panel title="このまとまりをやめる">
            <p className="mc-muted" style={{ marginTop: 0 }}>
              中の一歩も消える。確認のため、いまの名前を入力する。
            </p>
            <form action={actionDeleteMission} className="mc-form">
              <input type="hidden" name="missionId" value={mission.id} />
              <label>
                名前（確認）
                <input name="confirmTitle" placeholder={mission.title} required />
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
