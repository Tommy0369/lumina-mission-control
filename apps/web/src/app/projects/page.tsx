import Link from "next/link";
import { Button, Panel } from "@lumina/ui";
import { listProjectsWithStats } from "@/lib/services";
import { ProjectListRow } from "@/components/project-list-row";

export default async function ProjectsPage() {
  const items = await listProjectsWithStats();
  const inProgress = items.filter((item) => !item.complete);
  const completed = items.filter((item) => item.complete);

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>つくっているもの</h1>
          <p>
            進捗 100%・段取りがすべて「できた」になった作戦は{" "}
            <a href="#completed" className="mc-muted">
              完成したもの
            </a>
            へ移る。もう不要なら進捗バーの下から削除。
          </p>
        </div>
        <Link href="/">
          <Button variant="secondary">新しく始める</Button>
        </Link>
      </header>

      <Panel title="いま進めているもの">
        {inProgress.length === 0 ? (
          <div className="mc-stack">
            <p className="mc-muted" style={{ margin: 0 }}>
              {items.length === 0
                ? "まだない。ホームでやりたいことを書こう。"
                : "進行中の作戦はない。完成一覧を見るか、新しく始めよう。"}
            </p>
            {items.length === 0 ? (
              <Link href="/">
                <Button>ホームへ</Button>
              </Link>
            ) : (
              <a href="#completed">
                <Button variant="secondary">完成したものを見る</Button>
              </a>
            )}
          </div>
        ) : (
          <div className="mc-list">
            {inProgress.map((item) => (
              <ProjectListRow key={item.project.id} {...item} />
            ))}
          </div>
        )}
      </Panel>

      <div id="completed">
      <Panel title="完成したもの">
        {completed.length === 0 ? (
          <p className="mc-muted" style={{ margin: 0 }}>
            まだない。5 段すべてを「できた」にすると、ここに表示される。
          </p>
        ) : (
          <div className="mc-list">
            {completed.map((item) => (
              <ProjectListRow key={item.project.id} {...item} />
            ))}
          </div>
        )}
      </Panel>
      </div>

      <Panel title="データの置き場所">
        <p className="mc-muted" style={{ margin: 0, fontSize: 13 }}>
          記録は <code className="mc-mono">data/store.json</code>{" "}
          のみ。削除すると段取り・依頼・申し送りがまとめて消える。
        </p>
      </Panel>
    </>
  );
}
