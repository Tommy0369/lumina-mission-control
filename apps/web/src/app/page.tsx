import Link from "next/link";
import { Badge, Button, Panel } from "@lumina/ui";
import { getDashboard } from "@/lib/services";
import { actionCreatePlanFromIdea } from "@/lib/actions";
import { PlanIntakeFields } from "@/components/plan-intake-fields";
import {
  TASK_STATUS_LABEL,
  modelPickHint,
  recommendationLabel,
} from "@/lib/labels";

export default async function HomePage() {
  const data = await getDashboard();
  const continuing = data.activeProjects[0] ?? null;

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>いま、何をつくりたい？</h1>
          <p>
            どのAIの・どのモデルで・どこまで作って・次に何を渡すか。
            そこまで組んで、完成まで一緒に進む。
          </p>
        </div>
        <Link href="/how-to" className="mc-muted">
          使い方
        </Link>
      </header>

      <Panel title="やりたいことを書く">
        <form action={actionCreatePlanFromIdea} className="mc-form">
          <label>
            自由に書いてOK
            <textarea
              name="idea"
              required
              rows={4}
              placeholder="例: Google認証を追加したい / 在庫管理の画面を作りたい"
            />
          </label>
          <PlanIntakeFields />
          <Button type="submit">作戦をつくって、最初の一歩へ</Button>
        </form>
        <p className="mc-muted" style={{ margin: "12px 0 0" }}>
          押すと、探す → つくる → 確認 → 見直す → 仕上げる、の段取りができる。
        </p>
      </Panel>

      {data.nextTask ? (
        <Panel title="いまやる一手">
          <div className="mc-stack">
            <div>
              <div className="mc-mono">{data.nextTask.code}</div>
              <div style={{ fontSize: 22, fontWeight: 650, marginTop: 4 }}>
                {data.nextTask.title}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 10 }}>
                {recommendationLabel(
                  data.nextRecommendation?.agent,
                  data.nextRecommendation?.modelTier,
                )}
              </div>
              <div className="mc-muted" style={{ marginTop: 6 }}>
                {modelPickHint(
                  data.nextRecommendation?.agent,
                  data.nextRecommendation?.modelTier,
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <Badge tone="purple">
                  {TASK_STATUS_LABEL[data.nextTask.status]}
                </Badge>
              </div>
            </div>
            <Link href={`/tasks/${data.nextTask.id}`}>
              <Button>この作業を開く</Button>
            </Link>
          </div>
        </Panel>
      ) : (
        <Panel title="いまやる一手">
          <p className="mc-muted" style={{ margin: 0 }}>
            まだない。上にやりたいことを書いて始めよう。
          </p>
        </Panel>
      )}

      {continuing ? (
        <Panel title="続きから">
          <div className="mc-row">
            <div>
              <div style={{ fontWeight: 600 }}>{continuing.name}</div>
              <div className="mc-muted">{continuing.goal}</div>
            </div>
            <Link href={`/projects/${continuing.id}`}>
              <Button variant="secondary">作戦を見る</Button>
            </Link>
          </div>
        </Panel>
      ) : null}

      {data.blocked.length > 0 ? (
        <Panel title="つまったもの">
          <div className="mc-list">
            {data.blocked.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="mc-row">
                <span>
                  <span className="mc-mono">{t.code}</span> {t.title}
                </span>
                <Badge tone="red">つまった</Badge>
              </Link>
            ))}
          </div>
        </Panel>
      ) : null}
    </>
  );
}
