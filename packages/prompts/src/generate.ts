import type { AgentId, ModelTier, RunMode, Task } from "@lumina/core";

const ROLE_BY_AGENT: Record<AgentId, string> = {
  chatgpt_lumina: "Strategist / PM / Orchestrator",
  cursor: "Explorer / Daily Developer",
  claude_code: "Senior Builder / Architect",
  codex: "Reviewer / Debugger / Independent Engineer",
};

export interface TaskPromptInput {
  task: Pick<
    Task,
    | "code"
    | "title"
    | "goal"
    | "description"
    | "scope"
    | "outOfScope"
    | "acceptanceCriteria"
    | "contextFiles"
    | "recommendedAgent"
    | "recommendedModelTier"
    | "recommendedMode"
  >;
  agent?: AgentId;
  modelTier?: ModelTier;
  modelName?: string;
  pickerModel?: string;
  pickerEffort?: string | null;
  mode?: RunMode;
  currentState?: string;
  /** 作戦作成時ヒアリング（初推定の根拠） */
  planContext?: string;
}

function pickerLines(input: {
  pickerModel?: string;
  pickerEffort?: string | null;
  modelName?: string;
  tier: string;
}): string {
  const model = input.pickerModel ?? input.modelName ?? input.tier;
  const effort = input.pickerEffort
    ? `Effort: ${input.pickerEffort}\n`
    : "";
  const picker = input.pickerModel
    ? input.pickerEffort
      ? `Picker: モデルで「${input.pickerModel}」を選び、仕事量は「${input.pickerEffort}」\n`
      : `Picker: モデルで「${input.pickerModel}」を選ぶ（仕事量の選択なし）\n`
    : "";
  return `Model: ${model}\n${effort}${picker}`;
}

export function generateTaskPrompt(input: TaskPromptInput): string {
  const agent = input.agent ?? input.task.recommendedAgent ?? "cursor";
  const tier = input.modelTier ?? input.task.recommendedModelTier ?? "balanced";
  const mode = input.mode ?? input.task.recommendedMode ?? "implementation";
  const files =
    input.task.contextFiles.length > 0
      ? input.task.contextFiles.map((f) => `- ${f}`).join("\n")
      : "- (no files listed yet)";
  const acceptance =
    input.task.acceptanceCriteria.length > 0
      ? input.task.acceptanceCriteria
          .map((c, i) => `${i + 1}. ${c}`)
          .join("\n")
      : "1. Goal is met\n2. Typecheck passes\n3. No unrelated refactors";

  return `ROLE
${ROLE_BY_AGENT[agent]}
Agent: ${agent}
${pickerLines({
  pickerModel: input.pickerModel,
  pickerEffort: input.pickerEffort,
  modelName: input.modelName,
  tier,
})}
Model Tier: ${tier}
Mode: ${mode}

GOAL
${input.task.goal || input.task.title}

TASK
${input.task.code} — ${input.task.title}

DESCRIPTION
${input.task.description || "(none)"}

CONTEXT
Relevant files:
${files}
${input.planContext ? `\n${input.planContext}\n` : ""}
CURRENT STATE
${input.currentState ?? "See task description and repository state."}

SCOPE
${input.task.scope || "Stay within the listed files and goal."}

DO NOT TOUCH
${input.task.outOfScope || "- Unrelated features\n- Drive-by refactors\n- Production deploy"}

ACCEPTANCE
${acceptance}

OUTPUT
Return:
- changed files
- reason
- tests
- remaining risks

STOP CONDITION
Stop when acceptance criteria pass.
Do not perform unrelated refactoring.`;
}

const DEFAULT_REVIEW_FOCUS = [
  "authentication regressions",
  "session handling",
  "security vulnerabilities",
  "missing edge cases",
  "missing tests",
];

export function generateReviewPrompt(input: {
  taskCode: string;
  taskTitle: string;
  focus?: string[];
  pickerModel?: string;
  pickerEffort?: string | null;
}): string {
  const focusLines =
    input.focus && input.focus.length > 0 ? input.focus : DEFAULT_REVIEW_FOCUS;
  const focus = focusLines.map((f) => `- ${f.replace(/^-\s*/, "")}`).join("\n");
  const pickerModel = input.pickerModel ?? "GPT-5.6 Sol";
  const pickerEffort = input.pickerEffort ?? "高";

  return `ROLE
Reviewer / Independent Engineer
Agent: Codex
${pickerLines({ pickerModel, pickerEffort, tier: "strong" })}
Mode: review

GOAL
Review the current git diff for ${input.taskCode} — ${input.taskTitle}

TASK
${input.taskCode} — ${input.taskTitle}

FOCUS
${focus}

DO NOT TOUCH
- Do not rewrite the implementation unless necessary
- No drive-by refactors outside the diff

OUTPUT
Return:

PASS

or

FINDINGS:
severity
file
issue
recommended fix

STOP CONDITION
Stop when review is complete or blocked with clear evidence.`;
}

export function generateHandoffMarkdown(input: {
  taskCode: string;
  worker: AgentId;
  modelTier: ModelTier;
  modelName?: string;
  result: "SUCCESS" | "FAILURE";
  changedFiles: string[];
  tests: string;
  knownRisks: string[];
  nextAgent?: AgentId;
  nextAction?: string;
}): string {
  const files =
    input.changedFiles.length > 0
      ? input.changedFiles.join("\n")
      : "(none)";
  const risks =
    input.knownRisks.length > 0 ? input.knownRisks.join("\n") : "(none)";

  return `HANDOFF

TASK
${input.taskCode}

WORKER
${input.worker}

MODEL
${input.modelName ?? input.modelTier}

RESULT
${input.result}

CHANGED FILES
${files}

TESTS
${input.tests || "(not recorded)"}

KNOWN RISKS
${risks}

NEXT
${input.nextAgent ?? "(none)"}

ACTION
${input.nextAction ?? "(none)"}`;
}

export function generateDebugPrompt(input: {
  taskCode: string;
  symptom: string;
  files: string[];
}): string {
  return `ROLE
Independent debugger

GOAL
Diagnose and fix: ${input.symptom}

TASK
${input.taskCode}

CONTEXT FILES
${input.files.map((f) => `- ${f}`).join("\n") || "- (none)"}

SCOPE
- Reproduce if possible
- Identify root cause
- Minimal fix only

DO NOT TOUCH
- Unrelated modules
- Speculative rewrites

ACCEPTANCE
1. Root cause explained
2. Fix applied or clear next step
3. Regression risk listed

OUTPUT
- root cause
- changed files
- remaining risks

STOP CONDITION
Stop when the symptom is resolved or blocked with clear evidence.`;
}
