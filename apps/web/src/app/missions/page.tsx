import Link from "next/link";
import { Badge, Panel } from "@lumina/ui";
import { listMissions, listProjects } from "@/lib/services";

export default async function MissionsPage() {
  const [missions, projects] = await Promise.all([listMissions(), listProjects()]);
  const projectName = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>Missions</h1>
          <p>Feature-level units of work</p>
        </div>
      </header>
      <Panel title="All Missions">
        <div className="mc-list">
          {missions.map((m) => (
            <Link key={m.id} href={`/missions/${m.id}`} className="mc-row">
              <div>
                <div style={{ fontWeight: 600 }}>{m.title}</div>
                <div className="mc-muted">
                  {projectName[m.projectId] ?? "—"} · risk {m.risk} · complexity{" "}
                  {m.complexity}
                </div>
              </div>
              <Badge tone="blue">{m.status}</Badge>
            </Link>
          ))}
        </div>
      </Panel>
    </>
  );
}
