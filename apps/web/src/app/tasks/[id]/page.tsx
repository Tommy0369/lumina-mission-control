import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Panel, ProgressBar } from "@lumina/ui";
import { getTask } from "@/lib/services";
import {
  actionCompleteRun,
  actionReroute,
  actionStartRun,
} from "@/lib/actions";
import { PromptViewer } from "@/components/prompt-tools";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getTask(id);
  if (!data) notFound();
  const {
    task,
    mission,
    project,
    runs,
    handoffs,
    prompt,
    reviewPrompt,
    executionBlocked,
    taskSize,
  } = data;
  const activeRun = runs.find((r) => r.status === "running");
  const latestHandoff = handoffs[handoffs.length - 1];

  return (
    <>
      <header className="mc-header">
        <div>
          <div className="mc-mono">{task.code}</div>
          <h1>{task.title}</h1>
          <p>
            {project ? (
              <Link href={`/projects/${project.id}`}>{project.name}</Link>
            ) : null}
            {mission ? (
              <>
                {" · "}
                <Link href={`/missions/${mission.id}`}>{mission.title}</Link>
              </>
            ) : null}
          </p>
        </div>
        <Badge tone={task.status === "blocked" ? "red" : "purple"}>
          {task.status}
        </Badge>
      </header>

      {executionBlocked || task.splitRecommended ? (
        <Panel title="Task Too Large">
          <p style={{ margin: 0 }}>
            Size <strong>{taskSize}</strong>. Do not execute as-is.
            Split into smaller tasks first. Strongest model should PLAN only.
          </p>
        </Panel>
      ) : null}

      <div className="mc-grid-2">
        <Panel title="Goal">
          <p style={{ margin: 0, fontSize: 16 }}>{task.goal}</p>
          {task.description ? (
            <p className="mc-muted" style={{ marginTop: 8 }}>
              {task.description}
            </p>
          ) : null}
        </Panel>

        <Panel title="AI Router">
          <div className="mc-stack">
            <div>
              <div className="mc-muted">Recommended Agent</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {(task.recommendedAgent ?? "—").replaceAll("_", " ").toUpperCase()}
              </div>
            </div>
            <div className="mc-row" style={{ background: "transparent" }}>
              <span>Model Tier</span>
              <Badge tone="blue">{task.recommendedModelTier ?? "—"}</Badge>
            </div>
            <div className="mc-row" style={{ background: "transparent" }}>
              <span>Mode</span>
              <Badge tone="purple">{task.recommendedMode ?? "—"}</Badge>
            </div>
            <div className="mc-row" style={{ background: "transparent" }}>
              <span>Complexity</span>
              <strong>{task.complexity} / 10</strong>
            </div>
            <div className="mc-row" style={{ background: "transparent" }}>
              <span>Size</span>
              <strong>{taskSize}</strong>
            </div>
            <div>
              <div className="mc-muted">Why?</div>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {task.routingReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <form
              action={async () => {
                "use server";
                await actionReroute(task.id);
              }}
            >
              <Button type="submit" variant="ghost">
                Recompute Routing
              </Button>
            </form>
          </div>
        </Panel>
      </div>

      <div className="mc-grid-2">
        <Panel title="Context">
          <div className="mc-muted">{task.contextFiles.length} files · {task.contextSize}</div>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {task.contextFiles.map((f) => (
              <li key={f} className="mc-mono">
                {f}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 12 }}>
            <div className="mc-muted">Scope</div>
            <p style={{ margin: "4px 0 0" }}>{task.scope || "—"}</p>
            <div className="mc-muted" style={{ marginTop: 8 }}>
              Do not touch
            </div>
            <p style={{ margin: "4px 0 0" }}>{task.outOfScope || "—"}</p>
          </div>
        </Panel>

        <Panel title="Token / Resource">
          <ProgressBar
            value={task.resourceBudget ?? 0}
            max={Math.max(40, (task.resourceBudget ?? 0) * 1.5)}
            label={`Budget ${task.resourceBudget ?? 0} RP (expected)`}
          />
          <div className="mc-muted" style={{ marginTop: 8 }}>
            Permissions for recommended run:{" "}
            {task.recommendedMode === "review"
              ? "READ"
              : "READ · WRITE · EXECUTE (COMMIT/PUSH require approval)"}
          </div>
        </Panel>
      </div>

      <Panel title="Prompt" actions={<span className="mc-muted">Auto-generated</span>}>
        <PromptViewer prompt={prompt} reviewPrompt={reviewPrompt} />
      </Panel>

      <Panel title="Ready to Run">
        {executionBlocked ? (
          <p className="mc-muted">Execution blocked until split.</p>
        ) : activeRun ? (
          <div className="mc-stack">
            <div>
              <Badge tone="purple">RUNNING</Badge>{" "}
              <span className="mc-mono">{activeRun.code}</span> · {activeRun.agent} /{" "}
              {activeRun.modelTier}
            </div>
            <p className="mc-muted">
              Copy the prompt, run externally, then register the result below.
              State was recorded at start (state-first).
            </p>
            <form action={actionCompleteRun} className="mc-form">
              <input type="hidden" name="runId" value={activeRun.id} />
              <label>
                Result
                <select name="result" defaultValue="success">
                  <option value="success">success</option>
                  <option value="failure">failure</option>
                </select>
              </label>
              <label>
                Changed files (one per line)
                <textarea name="changedFiles" rows={3} />
              </label>
              <label>
                Tests summary
                <input name="testsSummary" placeholder="typecheck PASS / auth.test PASS" />
              </label>
              <label>
                Notes / risks
                <textarea name="resultNotes" rows={2} />
              </label>
              <label>
                Actual RP
                <input
                  name="resourcePointsActual"
                  type="number"
                  step={0.1}
                  defaultValue={activeRun.resourcePointsEstimated}
                />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, textTransform: "none" }}>
                <input name="humanIntervention" type="checkbox" />
                Human intervention required
              </label>
              <Button type="submit">Complete Run + Generate Handoff</Button>
            </form>
          </div>
        ) : (
          <div className="mc-stack">
            <div className="mc-row" style={{ background: "transparent" }}>
              <span>Use recommended</span>
              <strong>
                {task.recommendedAgent} / {task.recommendedModelTier}
              </strong>
            </div>
            <form action={actionStartRun} className="mc-form">
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="useRecommended" value="true" />
              <Button type="submit">Use Recommended · Start Run</Button>
            </form>
            <details>
              <summary className="mc-muted" style={{ cursor: "pointer" }}>
                Change agent / tier
              </summary>
              <form action={actionStartRun} className="mc-form" style={{ marginTop: 12 }}>
                <input type="hidden" name="taskId" value={task.id} />
                <input type="hidden" name="useRecommended" value="false" />
                <label>
                  Agent
                  <select name="agent" defaultValue={task.recommendedAgent ?? "cursor"}>
                    <option value="cursor">cursor</option>
                    <option value="claude_code">claude_code</option>
                    <option value="codex">codex</option>
                    <option value="chatgpt_lumina">chatgpt_lumina</option>
                  </select>
                </label>
                <label>
                  Model tier
                  <select
                    name="modelTier"
                    defaultValue={task.recommendedModelTier ?? "balanced"}
                  >
                    <option value="fast">fast</option>
                    <option value="balanced">balanced</option>
                    <option value="strong">strong</option>
                    <option value="max">max</option>
                  </select>
                </label>
                <label>
                  Mode
                  <select name="mode" defaultValue={task.recommendedMode ?? "implementation"}>
                    <option value="ask">ask</option>
                    <option value="plan">plan</option>
                    <option value="explore">explore</option>
                    <option value="implementation">implementation</option>
                    <option value="review">review</option>
                    <option value="debug">debug</option>
                  </select>
                </label>
                <Button type="submit" variant="secondary">
                  Start with override
                </Button>
              </form>
            </details>
          </div>
        )}
      </Panel>

      <div className="mc-grid-2">
        <Panel title="Runs">
          <div className="mc-list">
            {runs.length === 0 ? (
              <p className="mc-muted">No runs yet.</p>
            ) : (
              runs.map((r) => (
                <div key={r.id} className="mc-row">
                  <span>
                    <span className="mc-mono">{r.code}</span> {r.agent} / {r.modelTier}
                  </span>
                  <Badge
                    tone={
                      r.status === "success"
                        ? "green"
                        : r.status === "failure"
                          ? "red"
                          : "purple"
                    }
                  >
                    {r.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Latest Handoff">
          {latestHandoff ? (
            <div className="mc-stack">
              <pre className="mc-pre">{latestHandoff.summary}</pre>
              {latestHandoff.nextAgent ? (
                <div>
                  Next: <strong>{latestHandoff.nextAgent}</strong>
                  <div className="mc-muted">{latestHandoff.nextAction}</div>
                </div>
              ) : null}
              {latestHandoff.reviewPrompt ? (
                <PromptViewer prompt={latestHandoff.reviewPrompt} />
              ) : null}
            </div>
          ) : (
            <p className="mc-muted">Handoff appears after a run completes.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
