import Link from "next/link";
import { Button, Panel, ProgressBar } from "@lumina/ui";
import { listProjects } from "@/lib/services";
import { actionCreatePlanFromIdea } from "@/lib/actions";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>つくっているもの</h1>
          <p>完成させたいものの一覧</p>
        </div>
        <Link href="/">
          <Button variant="secondary">新しく始める</Button>
        </Link>
      </header>

      <Panel title="一覧">
        {projects.length === 0 ? (
          <div className="mc-stack">
            <p className="mc-muted">まだない。ホームでやりたいことを書こう。</p>
            <Link href="/">
              <Button>ホームへ</Button>
            </Link>
          </div>
        ) : (
          <div className="mc-list">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="mc-row">
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div className="mc-muted">{p.goal}</div>
                </div>
                <div style={{ width: 120 }}>
                  <ProgressBar value={p.progress} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="ここから新しく始める">
        <form action={actionCreatePlanFromIdea} className="mc-form">
          <label>
            やりたいこと
            <textarea name="idea" required rows={3} />
          </label>
          <Button type="submit">作戦をつくる</Button>
        </form>
      </Panel>
    </>
  );
}
