import Link from "next/link";
import { Button, Panel, ProgressBar } from "@lumina/ui";
import { listProjects } from "@/lib/services";
import { actionCreateProject } from "@/lib/actions";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>Projects</h1>
          <p>What are you building?</p>
        </div>
      </header>

      <div className="mc-grid-2">
        <Panel title="Active">
          {projects.length === 0 ? (
            <p className="mc-muted">No projects. Create one to start.</p>
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

        <Panel title="Create Project">
          <form action={actionCreateProject} className="mc-form">
            <label>
              What are you building?
              <input name="name" required placeholder="Inventory AI" />
            </label>
            <label>
              Goal
              <textarea name="goal" required rows={3} placeholder="統合する業務・成果" />
            </label>
            <label>
              Description
              <textarea name="description" rows={2} />
            </label>
            <label>
              Repo URL
              <input name="repoUrl" placeholder="https://github.com/..." />
            </label>
            <label>
              Tech stack (comma separated)
              <input name="techStack" placeholder="Next.js, Supabase" />
            </label>
            <Button type="submit">Create</Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
