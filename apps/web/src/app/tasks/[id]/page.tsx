import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Panel } from "@lumina/ui";
import type { AgentId, ModelTier } from "@lumina/core";
import { getTask } from "@/lib/services";
import { actionCompleteRun, actionDeleteTask, actionStartRun, actionUpdateTask } from "@/lib/actions";
import { PromptViewer } from "@/components/prompt-tools";
import { AgentModelPicker } from "@/components/agent-model-picker";
import {
  TASK_STATUS_LABEL,
  agentLabel,
  modelPickHint,
  recommendationLabel,
  resolveModelProfile,
} from "@/lib/labels";

export default async function StepPage({
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
    nextRecommendation,
  } = data;
  const activeRun = runs.find((r) => r.status === "running");
  const latestHandoff = handoffs[handoffs.length - 1];
  const isReviewStep = task.status === "review" || activeRun?.mode === "review";
  const displayedAgent = activeRun?.agent ?? nextRecommendation.agent;
  const displayedTier = activeRun?.modelTier ?? nextRecommendation.modelTier;
  const profile = resolveModelProfile(
    displayedAgent,
    displayedTier,
  );
  const overrideAgent = (nextRecommendation.agent ?? "cursor") as AgentId;
  const overrideTier = (nextRecommendation.modelTier ?? "balanced") as ModelTier;

  return (
    <>
      <header className="mc-header">
        <div>
          <div className="mc-muted">いまの一歩</div>
          <h1>{task.title}</h1>
          <p>
            {project ? (
              <Link href={`/projects/${project.id}`}>{project.name}</Link>
            ) : null}
            {mission ? <> · {mission.title}</> : null}
          </p>
        </div>
        <Badge tone={task.status === "blocked" ? "red" : "purple"}>
          {TASK_STATUS_LABEL[task.status]}
        </Badge>
      </header>

      {executionBlocked || task.splitRecommended ? (
        <Panel title="この一歩は大きすぎる">
          <p style={{ margin: 0 }}>
            サイズ {taskSize}。このままやらず、もっと小さく分けてから。
          </p>
        </Panel>
      ) : null}

      <Panel title="何をするか">
        <p style={{ margin: 0, fontSize: 18 }}>{task.goal}</p>
      </Panel>

      <div className="mc-grid-2">
        <Panel title={isReviewStep ? "次はレビュー" : "使うAI・モデル・仕事量（初推定）"}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {recommendationLabel(
              displayedAgent,
              displayedTier,
            )}
          </div>
          <div className="mc-muted" style={{ marginTop: 8 }}>
            {modelPickHint(displayedAgent, displayedTier)}
          </div>
          {task.routingReasons.includes("plan_intake") ? (
            <p className="mc-muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
              作戦作成時の 3 問 + 固定ルールから出した初推定。必ずしも最適ではない。
            </p>
          ) : null}
          {profile ? (
            <div className="mc-mono" style={{ marginTop: 8 }}>
              {profile.providerModelHint}
            </div>
          ) : null}
        </Panel>
        <Panel title="どこまで / 触らないこと">
          <div className="mc-muted">どこまで</div>
          <p style={{ margin: "4px 0 12px" }}>{task.scope || "—"}</p>
          <div className="mc-muted">触らないこと</div>
          <p style={{ margin: "4px 0 0" }}>{task.outOfScope || "—"}</p>
        </Panel>
      </div>

      <Panel title={isReviewStep ? "依頼文（レビュー用をコピー）" : "依頼文（これをコピー）"}>
        <PromptViewer
          prompt={
            activeRun?.promptSnapshot ??
            (isReviewStep && reviewPrompt ? reviewPrompt : prompt)
          }
          reviewPrompt={
            activeRun ? null : isReviewStep && reviewPrompt ? prompt : reviewPrompt
          }
        />
        <p className="mc-muted" style={{ margin: "12px 0 0" }}>
          先に上のモデルと仕事量を選んでから、依頼文を貼る。終わったら下へ戻る。
        </p>
      </Panel>

      <Panel title="進める">
        {executionBlocked ? (
          <p className="mc-muted">分割するまで始められない。</p>
        ) : task.status === "done" || task.status === "cancelled" ? (
          <p className="mc-muted" style={{ margin: 0 }}>
            この作業は完了済み。次の一手はホームか作戦画面で確認して。
          </p>
        ) : activeRun ? (
          <div className="mc-stack">
            <p style={{ margin: 0 }}>
              いま{" "}
              <strong>
                {recommendationLabel(activeRun.agent, activeRun.modelTier)}
              </strong>{" "}
              に依頼中。作業が終わったら結果を入れて。
            </p>
            <form action={actionCompleteRun} className="mc-form">
              <input type="hidden" name="runId" value={activeRun.id} />
              <label>
                どうなった？
                <select name="result" defaultValue="success">
                  <option value="success">できた</option>
                  <option value="failure">つまった</option>
                </select>
              </label>
              <label>
                変わったファイル（わかれば・1行1件）
                <textarea name="changedFiles" rows={3} />
              </label>
              <label>
                確認メモ（テストや気づき）
                <input name="testsSummary" placeholder="動いた / まだ怪しい点" />
              </label>
              <label>
                残リスク・メモ
                <textarea name="resultNotes" rows={2} />
              </label>
              <Button type="submit">申し送りをつくって次へ</Button>
            </form>
          </div>
        ) : (
          <div className="mc-stack">
            <form action={actionStartRun} className="mc-form">
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="useRecommended" value="true" />
              <Button type="submit">
                {isReviewStep ? "レビューを始める" : "この作業を始める"}
              </Button>
            </form>
            <p className="mc-muted" style={{ margin: 0 }}>
              {isReviewStep
                ? "押すと「レビュー中」になる。上のレビュー用プロンプトをCodexへ渡して。"
                : "押すと「依頼中」になる。モデルを合わせてから依頼文をコピー。"}
            </p>
            <details>
              <summary className="mc-muted" style={{ cursor: "pointer" }}>
                AIとモデルを自分で選ぶ
              </summary>
              <form
                action={actionStartRun}
                className="mc-form"
                style={{ marginTop: 12 }}
              >
                <input type="hidden" name="taskId" value={task.id} />
                <input type="hidden" name="useRecommended" value="false" />
                <AgentModelPicker
                  defaultAgent={overrideAgent}
                  defaultTier={overrideTier}
                />
                <Button type="submit" variant="secondary">
                  選んだ組み合わせで始める
                </Button>
              </form>
            </details>
          </div>
        )}
      </Panel>

      {latestHandoff ? (
        <Panel title="申し送り">
          <div className="mc-stack">
            {latestHandoff.nextAgent ? (
              <div>
                次のおすすめ:{" "}
                <strong>{agentLabel(latestHandoff.nextAgent)}</strong>
                <div className="mc-muted">{latestHandoff.nextAction}</div>
              </div>
            ) : (
              <div className="mc-muted">次の一手はホームか作戦画面で確認。</div>
            )}
            <PromptViewer
              prompt={latestHandoff.reviewPrompt || latestHandoff.summary}
            />
            {project ? (
              <Link href={`/projects/${project.id}`}>
                <Button variant="secondary">作戦に戻る</Button>
              </Link>
            ) : (
              <Link href="/">
                <Button variant="secondary">ホームへ</Button>
              </Link>
            )}
          </div>
        </Panel>
      ) : null}

      <details>
        <summary className="mc-muted" style={{ cursor: "pointer" }}>
          詳しく（普段は見なくていい）
        </summary>
        <div className="mc-stack" style={{ marginTop: 12 }}>
          <Panel title="理由">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {task.routingReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Panel>
          <Panel title="この一歩を直す">
            <form action={actionUpdateTask} className="mc-form">
              <input type="hidden" name="taskId" value={task.id} />
              <label>
                タイトル
                <input name="title" defaultValue={task.title} required />
              </label>
              <label>
                ゴール
                <textarea name="goal" rows={2} defaultValue={task.goal} required />
              </label>
              <label>
                どこまで
                <textarea name="scope" rows={2} defaultValue={task.scope} />
              </label>
              <label>
                触らないこと
                <textarea
                  name="outOfScope"
                  rows={2}
                  defaultValue={task.outOfScope}
                />
              </label>
              <Button type="submit">保存する</Button>
            </form>
          </Panel>
          <Panel title="この一歩をやめる">
            <p className="mc-muted" style={{ marginTop: 0 }}>
              取り消せない。確認のため、番号 {task.code} を入力する。
            </p>
            <form action={actionDeleteTask} className="mc-form">
              <input type="hidden" name="taskId" value={task.id} />
              <label>
                番号（確認）
                <input name="confirmCode" placeholder={task.code} required />
              </label>
              <Button type="submit" variant="secondary">
                削除する
              </Button>
            </form>
          </Panel>
          <Panel title="この回の依頼履歴">
            {runs.length === 0 ? (
              <p className="mc-muted">まだない</p>
            ) : (
              <div className="mc-list">
                {runs.map((r) => (
                  <div key={r.id} className="mc-row">
                    <span>
                      {recommendationLabel(r.agent, r.modelTier)}
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
                      {r.status === "success"
                        ? "できた"
                        : r.status === "failure"
                          ? "つまった"
                          : r.status === "running"
                            ? "いまやってる"
                            : r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </details>
    </>
  );
}
