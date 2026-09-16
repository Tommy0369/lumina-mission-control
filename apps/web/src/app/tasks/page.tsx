import Link from "next/link";
import { readStore } from "@/lib/store";
import { Badge, Panel } from "@lumina/ui";

export default async function TasksPage() {
  const store = await readStore();
  const tasks = store.tasks
    .slice()
    .sort((a, b) => b.priority - a.priority || a.code.localeCompare(b.code));

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>Tasks</h1>
          <p>Center of Mission Control</p>
        </div>
      </header>
      <Panel title="All Tasks">
        <div className="mc-list">
          {tasks.map((t) => (
            <Link key={t.id} href={`/tasks/${t.id}`} className="mc-row">
              <div>
                <div>
                  <span className="mc-mono">{t.code}</span> {t.title}
                </div>
                <div className="mc-muted">
                  {t.recommendedAgent ?? "—"} / {t.recommendedModelTier ?? "—"} ·{" "}
                  complexity {t.complexity}
                </div>
              </div>
              <Badge tone="neutral">{t.status}</Badge>
            </Link>
          ))}
        </div>
      </Panel>
    </>
  );
}
