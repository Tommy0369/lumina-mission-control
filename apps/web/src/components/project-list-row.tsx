import Link from "next/link";
import { Badge, ProgressBar } from "@lumina/ui";
import type { Project } from "@lumina/core";
import { ProjectDeleteForm } from "@/components/project-delete-form";

export function ProjectListRow({
  project,
  taskCount,
  runCount,
  complete,
}: {
  project: Project;
  taskCount: number;
  runCount: number;
  complete: boolean;
}) {
  return (
    <div
      className="mc-row"
      style={{ alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}
    >
      <Link href={`/projects/${project.id}`} style={{ flex: "1 1 220px", minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{project.name}</div>
        <div className="mc-muted">{project.goal}</div>
        <div className="mc-muted" style={{ fontSize: 12, marginTop: 4 }}>
          段取り {taskCount} · 依頼 {runCount}
        </div>
      </Link>
      <div style={{ width: 140, flexShrink: 0 }}>
        <ProgressBar
          value={project.progress}
          label={complete ? "完成" : `${project.progress}%`}
        />
        {complete ? (
          <div style={{ marginTop: 8 }}>
            <Badge tone="green">完成</Badge>
          </div>
        ) : null}
        <details style={{ marginTop: 8 }}>
          <summary
            className="mc-muted"
            style={{ cursor: "pointer", fontSize: 12, listStylePosition: "inside" }}
          >
            削除
          </summary>
          <div style={{ marginTop: 8 }}>
            <ProjectDeleteForm
              projectId={project.id}
              projectName={project.name}
              taskCount={taskCount}
              runCount={runCount}
              compact
            />
          </div>
        </details>
      </div>
    </div>
  );
}
