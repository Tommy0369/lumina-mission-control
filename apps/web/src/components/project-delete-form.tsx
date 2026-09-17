import { Button } from "@lumina/ui";
import { actionDeleteProject } from "@/lib/actions";

export function ProjectDeleteForm({
  projectId,
  projectName,
  taskCount,
  runCount,
  compact = false,
}: {
  projectId: string;
  projectName: string;
  taskCount: number;
  runCount: number;
  compact?: boolean;
}) {
  return (
    <form action={actionDeleteProject} className="mc-form">
      <input type="hidden" name="projectId" value={projectId} />
      {!compact ? (
        <p className="mc-muted" style={{ margin: 0, fontSize: 13 }}>
          この作戦に紐づくデータを <strong>すべて</strong>{" "}
          消す（段取り {taskCount} 件・依頼の履歴 {runCount}{" "}
          件・申し送りなど）。PC 上の{" "}
          <code className="mc-mono">data/store.json</code>{" "}
          から消え、取り消せない。
        </p>
      ) : (
        <p className="mc-muted" style={{ margin: 0, fontSize: 12 }}>
          段取り {taskCount} / 依頼 {runCount} もまとめて削除
        </p>
      )}
      <label>
        確認のため、名前をそのまま入力
        <input
          name="confirmName"
          placeholder={projectName}
          required
          autoComplete="off"
        />
      </label>
      <Button type="submit" variant="secondary">
        この作戦を削除する
      </Button>
    </form>
  );
}
