import Link from "next/link";
import { readStore } from "@/lib/store";
import { Badge, Panel } from "@lumina/ui";
import { TASK_STATUS_LABEL, recommendationLabel } from "@/lib/labels";
import { recommendationForTask } from "@/lib/services";

export default async function TasksPage() {
  const store = await readStore();
  const tasks = store.tasks
    .slice()
    .sort((a, b) => b.priority - a.priority || a.code.localeCompare(b.code));

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>いまの作業</h1>
          <p>一歩ずつの一覧。迷ったらホームの「いまやる一手」へ。</p>
        </div>
        <Link href="/" className="mc-muted">
          ホーム
        </Link>
      </header>
      <Panel title="一覧">
        {tasks.length === 0 ? (
          <p className="mc-muted">まだない。ホームでやりたいことを書いて。</p>
        ) : (
          <div className="mc-list">
            {tasks.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="mc-row">
                <div>
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div className="mc-muted">
                    {recommendationLabel(
                      recommendationForTask(t, store.runs).agent,
                      recommendationForTask(t, store.runs).modelTier,
                    )}
                  </div>
                </div>
                <Badge tone="neutral">{TASK_STATUS_LABEL[t.status]}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
