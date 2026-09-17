import {
  createCode,
  createId,
  nowIso,
  resourceStatusFromUsage,
  type AgentId,
  type Domain,
  type PlanIntake,
  type Mission,
  type MissionStatus,
  type ModelTier,
  type Project,
  type ProjectStatus,
  type ResourceStatus,
  type RiskLevel,
  type Run,
  type RunMode,
  type StoreSnapshot,
  type Task,
  type TaskStatus,
  type TaskType,
} from "@lumina/core";
import { routeTask } from "@lumina/router";
import {
  generateHandoffMarkdown,
  generateReviewPrompt,
  generateTaskPrompt,
} from "@lumina/prompts";
import { readStore, updateStore } from "./store";
import { resolveModelProfile } from "./labels";
import {
  DEFAULT_PLAN_INTAKE,
  derivePlanFromIntake,
  formatPlanIntakeSummary,
  ideaSignalsFromText,
} from "./plan-intake";

function modelPickerFor(agent?: AgentId | null, tier?: ModelTier | null) {
  const profile = resolveModelProfile(agent, tier);
  if (!profile) return { modelName: undefined as string | undefined };
  return {
    modelName: profile.label,
    pickerModel: profile.pickerModel,
    pickerEffort: profile.pickerEffort,
  };
}

function resourceStatusMap(
  store: StoreSnapshot,
): Partial<Record<AgentId, ResourceStatus>> {
  return Object.fromEntries(
    store.aiAgents.map((a) => {
      const override = store.resourceOverrides[a.id];
      const status =
        override?.status ??
        resourceStatusFromUsage(override?.todayRp ?? 0, a.dailySoftCapRp);
      return [a.id, status];
    }),
  ) as Partial<Record<AgentId, ResourceStatus>>;
}

export interface NextRunRecommendation {
  readonly agent?: AgentId;
  readonly modelTier?: ModelTier;
  readonly mode?: RunMode;
}

/**
 * task.recommendedAgent/Tier/Mode is the original routing decision snapshot.
 * Once a task is waiting on review, the next run must go to reviewAgent in
 * review mode instead of repeating the implementation recommendation.
 */
function nextRunRecommendation(task: Task): NextRunRecommendation {
  if (task.status === "review" && task.reviewAgent) {
    return { agent: task.reviewAgent, modelTier: "strong", mode: "review" };
  }
  return {
    agent: task.recommendedAgent,
    modelTier: task.recommendedModelTier,
    mode: task.recommendedMode,
  };
}

/** 画面表示用。依頼中ならその回のAI、見直し待ちならレビュー担当。 */
export function recommendationForTask(
  task: Task,
  runs: Run[] = [],
): NextRunRecommendation {
  const active = runs.find((run) => run.taskId === task.id && run.status === "running");
  if (active) {
    return { agent: active.agent, modelTier: active.modelTier, mode: active.mode };
  }
  return nextRunRecommendation(task);
}

function pickOpenTask(tasks: Task[]): Task | undefined {
  return tasks
    .slice()
    .sort((a, b) => b.priority - a.priority || a.complexity - b.complexity)[0];
}

function applyRouting(task: Task, store: StoreSnapshot): Task {
  const decision = routeTask({
    taskType: task.taskType,
    complexity: task.complexity,
    risk: task.risk,
    domain: task.domain,
    estimatedFiles: task.estimatedFiles,
    contextSize: task.contextSize,
    resourceStatus: resourceStatusMap(store),
    isBlocker: task.status === "blocked",
  });

  return {
    ...task,
    recommendedAgent: decision.agent,
    recommendedModelTier: decision.modelTier,
    recommendedMode: decision.mode,
    resourceBudget: decision.resourceBudget,
    reviewRequired: decision.reviewRequired,
    reviewAgent: decision.reviewAgent,
    splitRecommended: decision.splitRecommended,
    routingReasons: decision.reason,
    contextSize: decision.contextSize,
    updatedAt: nowIso(),
  };
}

function recalculateProgress(store: StoreSnapshot, t = nowIso()): void {
  for (const mission of store.missions) {
    const missionTasks = store.tasks.filter((task) => task.missionId === mission.id);
    const done = missionTasks.filter((task) => task.status === "done").length;
    mission.progress = missionTasks.length
      ? Math.round((done / missionTasks.length) * 100)
      : 0;
    mission.status =
      missionTasks.length > 0 && mission.progress === 100
        ? "done"
        : missionTasks.some((task) => task.status === "running")
          ? "in_progress"
          : missionTasks.some((task) => task.status === "blocked")
            ? "blocked"
            : mission.status === "cancelled"
              ? "cancelled"
              : "in_progress";
    mission.updatedAt = t;
  }

  for (const project of store.projects) {
    const projectTasks = store.tasks.filter((task) => task.projectId === project.id);
    const done = projectTasks.filter((task) => task.status === "done").length;
    project.progress = projectTasks.length
      ? Math.round((done / projectTasks.length) * 100)
      : 0;
    project.updatedAt = t;
  }
}

function removeTasks(store: StoreSnapshot, taskIds: Set<string>): void {
  const runIds = new Set(
    store.runs.filter((run) => taskIds.has(run.taskId)).map((run) => run.id),
  );
  store.tasks = store.tasks.filter((task) => !taskIds.has(task.id));
  store.taskDependencies = store.taskDependencies.filter(
    (dependency) =>
      !taskIds.has(dependency.taskId) &&
      !taskIds.has(dependency.dependsOnTaskId),
  );
  store.runs = store.runs.filter((run) => !runIds.has(run.id));
  store.usageEvents = store.usageEvents.filter((event) => !runIds.has(event.runId));
  store.handoffs = store.handoffs.filter(
    (handoff) => !taskIds.has(handoff.taskId) && !runIds.has(handoff.runId),
  );
  store.contextAssets = store.contextAssets.filter(
    (asset) => !taskIds.has(asset.taskId),
  );
  store.approvals = store.approvals.filter(
    (approval) =>
      (!approval.taskId || !taskIds.has(approval.taskId)) &&
      (!approval.runId || !runIds.has(approval.runId)),
  );
}

export async function getDashboard() {
  const store = await readStore();
  const activeProjects = store.projects.filter((p) => p.status === "active");
  const tasks = store.tasks;
  const running = tasks.filter((t) => t.status === "running");
  const blocked = tasks.filter((t) => t.status === "blocked");
  const review = tasks.filter((t) => t.status === "review");
  const ready = tasks.filter((t) => t.status === "ready" || t.status === "todo");
  const doneToday = tasks.filter((t) => {
    if (t.status !== "done") return false;
    return t.updatedAt.slice(0, 10) === new Date().toISOString().slice(0, 10);
  });

  const nextTask =
    pickOpenTask(running) ?? pickOpenTask(review) ?? pickOpenTask(ready) ?? null;
  const nextRecommendation = nextTask
    ? recommendationForTask(nextTask, store.runs)
    : null;

  const resources = store.aiAgents.map((agent) => {
    const override = store.resourceOverrides[agent.id];
    const todayRp = override?.todayRp ?? 0;
    const weekRp = override?.weekRp ?? 0;
    const status =
      override?.status ??
      resourceStatusFromUsage(todayRp, agent.dailySoftCapRp);
    const successRuns = store.runs.filter(
      (r) => r.agent === agent.id && r.result === "success",
    );
    const allRuns = store.runs.filter((r) => r.agent === agent.id);
    const successRate =
      allRuns.length === 0
        ? null
        : Math.round((successRuns.length / allRuns.length) * 100);
    return {
      agent,
      todayRp,
      weekRp,
      status,
      successRate,
      bestFor: agent.bestFor,
    };
  });

  return {
    workspace: store.workspace,
    activeProjects,
    nextTask,
    nextRecommendation,
    blocked,
    running,
    today: {
      total: tasks.filter((t) =>
        ["todo", "ready", "running", "blocked", "review", "done"].includes(
          t.status,
        ),
      ).length,
      done: doneToday.length,
      running: running.length,
      blocked: blocked.length,
    },
    resources,
    recentRuns: store.runs
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8),
  };
}

export async function listProjects() {
  const store = await readStore();
  return store.projects;
}

export async function getProject(projectId: string) {
  const store = await readStore();
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return null;
  const missions = store.missions
    .filter((m) => m.projectId === projectId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const tasks = store.tasks.filter((t) => t.projectId === projectId);
  const projectRuns = store.runs.filter((run) =>
    tasks.some((task) => task.id === run.taskId),
  );
  const currentTask =
    tasks.find((t) => t.status === "running") ??
    tasks.find((t) => t.status === "review") ??
    tasks.find((t) => t.status === "ready" || t.status === "todo") ??
    null;
  return { project, missions, tasks, currentTask, runs: projectRuns };
}

export async function createProject(input: {
  name: string;
  goal: string;
  description?: string;
  repoUrl?: string;
  techStack?: string[];
}) {
  let created!: Project;
  await updateStore((store) => {
    const t = nowIso();
    const project: Project = {
      id: createId("proj"),
      workspaceId: store.workspace.id,
      name: input.name,
      description: input.description ?? "",
      goal: input.goal,
      status: "active",
      repoUrl: input.repoUrl,
      defaultBranch: "main",
      techStack: input.techStack ?? [],
      progress: 0,
      createdAt: t,
      updatedAt: t,
    };
    store.projects.push(project);
    created = project;
  });
  return created;
}

export async function updateProject(
  projectId: string,
  input: Partial<
    Pick<Project, "name" | "description" | "goal" | "status" | "repoUrl" | "techStack">
  >,
) {
  let updated!: Project;
  await updateStore((store) => {
    const project = store.projects.find((item) => item.id === projectId);
    if (!project) throw new Error("Project not found");
    if (input.name !== undefined) project.name = input.name.trim();
    if (input.description !== undefined) project.description = input.description;
    if (input.goal !== undefined) project.goal = input.goal.trim();
    if (input.status !== undefined) project.status = input.status;
    if (input.repoUrl !== undefined) project.repoUrl = input.repoUrl || undefined;
    if (input.techStack !== undefined) project.techStack = input.techStack;
    if (!project.name || !project.goal) {
      throw new Error("Project name and goal are required");
    }
    project.updatedAt = nowIso();
    updated = project;
  });
  return updated;
}

export async function deleteProject(projectId: string, expectedName: string) {
  await updateStore((store) => {
    const project = store.projects.find((item) => item.id === projectId);
    if (!project) throw new Error("Project not found");
    if (project.name !== expectedName) throw new Error("Project delete confirmation mismatch");
    const taskIds = new Set(
      store.tasks.filter((task) => task.projectId === projectId).map((task) => task.id),
    );
    removeTasks(store, taskIds);
    store.missions = store.missions.filter((mission) => mission.projectId !== projectId);
    store.projects = store.projects.filter((item) => item.id !== projectId);
  });
}

export async function createMission(input: {
  projectId: string;
  title: string;
  goal: string;
  risk?: RiskLevel;
  complexity?: number;
  priority?: number;
}) {
  const store = await updateStore((s) => {
    const t = nowIso();
    const order = s.missions.filter((m) => m.projectId === input.projectId)
      .length;
    const mission: Mission = {
      id: createId("mis"),
      projectId: input.projectId,
      title: input.title,
      goal: input.goal,
      status: "planned",
      priority: input.priority ?? 50,
      risk: input.risk ?? "medium",
      complexity: input.complexity ?? 5,
      progress: 0,
      sortOrder: order,
      createdAt: t,
      updatedAt: t,
    };
    s.missions.push(mission);
    return s;
  });
  return store.missions[store.missions.length - 1];
}

export async function updateMission(
  missionId: string,
  input: Partial<
    Pick<Mission, "title" | "goal" | "status" | "priority" | "risk" | "complexity">
  >,
) {
  let updated!: Mission;
  await updateStore((store) => {
    const mission = store.missions.find((item) => item.id === missionId);
    if (!mission) throw new Error("Mission not found");
    if (input.title !== undefined) mission.title = input.title.trim();
    if (input.goal !== undefined) mission.goal = input.goal.trim();
    if (input.status !== undefined) mission.status = input.status;
    if (input.priority !== undefined) mission.priority = input.priority;
    if (input.risk !== undefined) mission.risk = input.risk;
    if (input.complexity !== undefined) mission.complexity = input.complexity;
    if (!mission.title || !mission.goal) {
      throw new Error("Mission title and goal are required");
    }
    mission.updatedAt = nowIso();
    updated = mission;
  });
  return updated;
}

export async function deleteMission(missionId: string, expectedTitle: string) {
  let projectId = "";
  await updateStore((store) => {
    const mission = store.missions.find((item) => item.id === missionId);
    if (!mission) throw new Error("Mission not found");
    if (mission.title !== expectedTitle) throw new Error("Mission delete confirmation mismatch");
    projectId = mission.projectId;
    const taskIds = new Set(
      store.tasks.filter((task) => task.missionId === missionId).map((task) => task.id),
    );
    removeTasks(store, taskIds);
    store.missions = store.missions.filter((item) => item.id !== missionId);
    recalculateProgress(store);
  });
  return { projectId };
}

export async function createTask(input: {
  missionId: string;
  title: string;
  goal: string;
  description?: string;
  complexity?: number;
  risk?: RiskLevel;
  taskType?: TaskType;
  domain?: Domain;
  scope?: string;
  outOfScope?: string;
  acceptanceCriteria?: string[];
  estimatedFiles?: number;
  contextFiles?: string[];
  priority?: number;
}) {
  let created!: Task;
  await updateStore((store) => {
    const mission = store.missions.find((m) => m.id === input.missionId);
    if (!mission) throw new Error("Mission not found");
    const t = nowIso();
    const n = store.tasks.length + 1;
    let task: Task = {
      id: createId("task"),
      missionId: input.missionId,
      projectId: mission.projectId,
      code: createCode("TASK", n),
      title: input.title,
      description: input.description ?? "",
      goal: input.goal,
      status: "ready",
      priority: input.priority ?? 50,
      complexity: input.complexity ?? 5,
      risk: input.risk ?? "medium",
      taskType: input.taskType ?? "implementation",
      domain: input.domain ?? "logic",
      scope: input.scope ?? "",
      outOfScope: input.outOfScope ?? "",
      acceptanceCriteria: input.acceptanceCriteria ?? [],
      estimatedFiles: input.estimatedFiles ?? 3,
      contextFiles: input.contextFiles ?? [],
      contextSize: "small",
      routingReasons: [],
      createdAt: t,
      updatedAt: t,
    };
    task = applyRouting(task, store);
    store.tasks.push(task);
    created = task;
  });
  return created;
}

export async function updateTask(
  taskId: string,
  input: Partial<
    Pick<
      Task,
      | "title"
      | "goal"
      | "description"
      | "status"
      | "priority"
      | "complexity"
      | "risk"
      | "taskType"
      | "domain"
      | "scope"
      | "outOfScope"
      | "acceptanceCriteria"
      | "estimatedFiles"
      | "contextFiles"
    >
  >,
) {
  let updated!: Task;
  await updateStore((store) => {
    const index = store.tasks.findIndex((item) => item.id === taskId);
    if (index < 0) throw new Error("Task not found");
    const task = store.tasks[index];
    const routingChanged =
      input.complexity !== undefined ||
      input.risk !== undefined ||
      input.taskType !== undefined ||
      input.domain !== undefined ||
      input.estimatedFiles !== undefined;
    Object.assign(task, input);
    task.title = task.title.trim();
    task.goal = task.goal.trim();
    if (!task.title || !task.goal) throw new Error("Task title and goal are required");
    task.updatedAt = nowIso();
    store.tasks[index] = routingChanged ? applyRouting(task, store) : task;
    recalculateProgress(store, task.updatedAt);
    updated = store.tasks[index];
  });
  return updated;
}

export async function deleteTask(taskId: string, expectedCode: string) {
  let missionId = "";
  let projectId = "";
  await updateStore((store) => {
    const task = store.tasks.find((item) => item.id === taskId);
    if (!task) throw new Error("Task not found");
    if (task.code !== expectedCode) throw new Error("Task delete confirmation mismatch");
    missionId = task.missionId;
    projectId = task.projectId;
    removeTasks(store, new Set([taskId]));
    recalculateProgress(store);
  });
  return { missionId, projectId };
}

export async function getTask(taskId: string) {
  const store = await readStore();
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) return null;
  const mission = store.missions.find((m) => m.id === task.missionId) ?? null;
  const project = store.projects.find((p) => p.id === task.projectId) ?? null;
  const runs = store.runs
    .filter((r) => r.taskId === taskId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const handoffs = store.handoffs.filter((h) => h.taskId === taskId);
  const prompt = generateTaskPrompt({
    task,
    ...modelPickerFor(task.recommendedAgent, task.recommendedModelTier),
    planContext: project?.planIntake
      ? formatPlanIntakeSummary(project.planIntake)
      : undefined,
  });
  const reviewPrompt =
    task.reviewRequired && task.reviewAgent === "codex"
      ? generateReviewPrompt({
          taskCode: task.code,
          taskTitle: task.title,
          focus:
            task.domain === "auth"
              ? [
                  "authentication regressions",
                  "session handling",
                  "security vulnerabilities",
                  "missing edge cases",
                  "missing tests",
                ]
              : undefined,
        })
      : null;
  const sizeDecision = routeTask({
    taskType: task.taskType,
    complexity: task.complexity,
    risk: task.risk,
    domain: task.domain,
    estimatedFiles: task.estimatedFiles,
  });
  return {
    task,
    mission,
    project,
    runs,
    handoffs,
    prompt,
    reviewPrompt,
    executionBlocked: sizeDecision.executionBlocked,
    taskSize: sizeDecision.taskSize,
    nextRecommendation: recommendationForTask(task, runs),
  };
}

export async function recomputeTaskRouting(taskId: string) {
  await updateStore((store) => {
    const idx = store.tasks.findIndex((t) => t.id === taskId);
    if (idx < 0) throw new Error("Task not found");
    store.tasks[idx] = applyRouting(store.tasks[idx], store);
  });
  return getTask(taskId);
}

export async function startRun(input: {
  taskId: string;
  agent?: AgentId;
  modelTier?: ModelTier;
  mode?: RunMode;
  useRecommended?: boolean;
}) {
  let run!: Run;
  await updateStore((store) => {
    const task = store.tasks.find((t) => t.id === input.taskId);
    if (!task) throw new Error("Task not found");
    if (task.status === "done" || task.status === "cancelled") {
      throw new Error("Completed or cancelled tasks cannot start a new run");
    }
    if (store.runs.some((candidate) => candidate.taskId === task.id && candidate.status === "running")) {
      throw new Error("Task already has a running run");
    }
    if (!(["todo", "ready", "blocked", "review"] as TaskStatus[]).includes(task.status)) {
      throw new Error(`Task cannot start from status: ${task.status}`);
    }
    const decision = routeTask({
      taskType: task.taskType,
      complexity: task.complexity,
      risk: task.risk,
      domain: task.domain,
      estimatedFiles: task.estimatedFiles,
      contextSize: task.contextSize,
      resourceStatus: resourceStatusMap(store),
      isBlocker: task.status === "blocked",
    });
    if (decision.executionBlocked) {
      throw new Error("TASK TOO LARGE — split before running");
    }

    const next = nextRunRecommendation(task);
    const agent =
      input.useRecommended !== false
        ? (next.agent ?? decision.agent)
        : (input.agent ?? next.agent ?? decision.agent);
    const modelTier =
      input.useRecommended !== false
        ? (next.modelTier ?? decision.modelTier)
        : (input.modelTier ?? next.modelTier ?? decision.modelTier);
    const mode =
      input.mode ?? next.mode ?? decision.mode ?? "implementation";

    const picker = modelPickerFor(agent, modelTier);
    const project = store.projects.find((p) => p.id === task.projectId);
    const planContext = project?.planIntake
      ? formatPlanIntakeSummary(project.planIntake)
      : undefined;
    const prompt =
      mode === "review"
        ? generateReviewPrompt({
            taskCode: task.code,
            taskTitle: task.title,
            pickerModel: picker.pickerModel,
            pickerEffort: picker.pickerEffort,
          })
        : generateTaskPrompt({
            task,
            agent,
            modelTier,
            mode,
            ...picker,
            planContext,
          });

    const t = nowIso();
    const runCount = store.runs.filter((r) => r.taskId === task.id).length + 1;
    // State-first: create run row immediately as running
    run = {
      id: createId("run"),
      taskId: task.id,
      code: createCode("RUN", runCount),
      agent,
      modelTier,
      mode,
      status: "running",
      promptSnapshot: prompt,
      permissions:
        mode === "review"
          ? ["read"]
          : ["read", "write", "execute"],
      startedAt: t,
      resourcePointsEstimated:
        task.resourceBudget ?? decision.resourceBudget,
      changedFiles: [],
      humanIntervention: false,
      retryCount: 0,
      createdAt: t,
      updatedAt: t,
    };
    store.runs.push(run);
    task.status = "running";
    task.updatedAt = t;
  });
  return run;
}

export async function completeRun(input: {
  runId: string;
  result: "success" | "failure";
  changedFiles?: string[];
  testsSummary?: string;
  resultNotes?: string;
  resourcePointsActual?: number;
  humanIntervention?: boolean;
}) {
  let handoffId: string | undefined;
  await updateStore((store) => {
    const run = store.runs.find((r) => r.id === input.runId);
    if (!run) throw new Error("Run not found");
    const task = store.tasks.find((t) => t.id === run.taskId);
    if (!task) throw new Error("Task not found");
    if (run.status !== "running") {
      const existingHandoff = store.handoffs.find((handoff) => handoff.runId === run.id);
      if (existingHandoff && run.result === input.result) {
        handoffId = existingHandoff.id;
        return;
      }
      throw new Error(`Run cannot complete from status: ${run.status}`);
    }
    if (task.status !== "running") {
      throw new Error(`Task/run state mismatch: ${task.status}/${run.status}`);
    }
    const t = nowIso();

    run.status = input.result === "success" ? "success" : "failure";
    run.result = input.result;
    run.finishedAt = t;
    run.changedFiles = input.changedFiles ?? [];
    run.testsSummary = input.testsSummary ?? "";
    run.resultNotes = input.resultNotes ?? "";
    run.resourcePointsActual =
      input.resourcePointsActual ?? run.resourcePointsEstimated;
    run.humanIntervention = input.humanIntervention ?? false;
    run.updatedAt = t;

    const rp = run.resourcePointsActual ?? run.resourcePointsEstimated;
    const override = store.resourceOverrides[run.agent];
    if (override) {
      override.todayRp += rp;
      override.weekRp += rp;
      const agent = store.aiAgents.find((a) => a.id === run.agent);
      if (agent) {
        override.status = resourceStatusFromUsage(
          override.todayRp,
          agent.dailySoftCapRp,
        );
      }
    }

    store.usageEvents.push({
      id: createId("ue"),
      runId: run.id,
      provider: run.agent,
      model: run.modelTier,
      resourcePoints: rp,
      source: input.resourcePointsActual === undefined ? "estimated" : "manual",
      recordedAt: t,
    });

    // A run in review mode IS the review — do not send it back for review again.
    const isReviewRun = run.mode === "review";
    const needsReview =
      input.result === "success" && task.reviewRequired && !isReviewRun;

    const nextAgent = needsReview
      ? task.reviewAgent
      : input.result === "failure"
        ? run.agent
        : undefined;
    const nextAction = needsReview
      ? "現在の git diff だけをレビューする。"
      : input.result === "failure"
        ? "スコープを絞って再試行するか、エージェントを上げる。"
        : "タスク完了にするか、次のタスクへ進む。";

    const risks = input.resultNotes
      ? [input.resultNotes]
      : ([] as string[]);

    const reviewPrompt =
      nextAgent === "codex"
        ? generateReviewPrompt({
            taskCode: task.code,
            taskTitle: task.title,
          })
        : undefined;

    const handoff = {
      id: createId("ho"),
      runId: run.id,
      taskId: task.id,
      summary: generateHandoffMarkdown({
        taskCode: task.code,
        worker: run.agent,
        modelTier: run.modelTier,
        modelName: modelPickerFor(run.agent, run.modelTier).modelName,
        result: input.result === "success" ? "SUCCESS" : "FAILURE",
        changedFiles: run.changedFiles,
        tests: run.testsSummary ?? "",
        knownRisks: risks,
        nextAgent,
        nextAction,
      }),
      changedFiles: run.changedFiles,
      tests: run.testsSummary ?? "",
      risks,
      blockers: input.result === "failure" ? ["実行失敗 — メモを確認"] : [],
      nextAgent,
      nextAction,
      reviewPrompt,
      createdAt: t,
    };
    store.handoffs.push(handoff);
    handoffId = handoff.id;

    if (input.result === "success") {
      task.status = needsReview ? "review" : "done";
    } else {
      task.status = "blocked";
    }
    task.updatedAt = t;

    recalculateProgress(store, t);
  });
  return { handoffId };
}

export async function listRuns() {
  const store = await readStore();
  return store.runs
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((run) => ({
      run,
      task: store.tasks.find((t) => t.id === run.taskId) ?? null,
      handoff: store.handoffs.find((h) => h.runId === run.id) ?? null,
    }));
}

export async function listMissions(projectId?: string) {
  const store = await readStore();
  return store.missions
    .filter((m) => (projectId ? m.projectId === projectId : true))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getMission(missionId: string) {
  const store = await readStore();
  const mission = store.missions.find((m) => m.id === missionId);
  if (!mission) return null;
  const tasks = store.tasks
    .filter((t) => t.missionId === missionId)
    .sort((a, b) => a.code.localeCompare(b.code));
  const project = store.projects.find((p) => p.id === mission.projectId) ?? null;
  return { mission, tasks, project };
}

export async function getResources() {
  const store = await readStore();
  return store.aiAgents.map((agent) => {
    const override = store.resourceOverrides[agent.id];
    const todayRp = override?.todayRp ?? 0;
    const weekRp = override?.weekRp ?? 0;
    const status =
      override?.status ??
      resourceStatusFromUsage(todayRp, agent.dailySoftCapRp);
    const runs = store.runs.filter((r) => r.agent === agent.id);
    const success = runs.filter((r) => r.result === "success").length;
    const retries = runs.reduce((acc, r) => acc + r.retryCount, 0);
    return {
      agent,
      todayRp,
      weekRp,
      status,
      successRate: runs.length ? Math.round((success / runs.length) * 100) : null,
      avgRetry: runs.length ? Math.round((retries / runs.length) * 10) / 10 : 0,
      profiles: store.modelProfiles.filter((p) => p.agentId === agent.id),
    };
  });
}

export async function getRoutingRules() {
  const store = await readStore();
  return store.routingRules
    .slice()
    .sort((a, b) => b.priority - a.priority);
}

export async function getModelProfiles() {
  const store = await readStore();
  return store.modelProfiles;
}

export async function setResourceManual(input: {
  agentId: AgentId;
  todayRp?: number;
  weekRp?: number;
  status?: ResourceStatus;
}) {
  await updateStore((store) => {
    const current = store.resourceOverrides[input.agentId];
    store.resourceOverrides[input.agentId] = {
      todayRp: input.todayRp ?? current?.todayRp ?? 0,
      weekRp: input.weekRp ?? current?.weekRp ?? 0,
      status: input.status ?? current?.status ?? "green",
    };
  });
  return getResources();
}

export async function seedDogfoodProject() {
  const store = await readStore();
  if (store.projects.some((p) => p.name === "LUMINA Mission Control")) {
    return store.projects.find((p) => p.name === "LUMINA Mission Control")!;
  }

  await updateStore((s) => {
    const t = nowIso();
    const project: Project = {
      id: createId("proj"),
      workspaceId: s.workspace.id,
      name: "LUMINA Mission Control",
      description: "AI開発リソース管制塔 — Dogfood用プロジェクト",
      goal: "考える。振り分ける。作る。検証する。学習する。— V0.1 手動オーケストレーション",
      status: "active",
      repoUrl: "https://github.com/Tommy0369/lumina-mission-control",
      defaultBranch: "main",
      localPathHint: "~/projects/lumina-mission-control",
      techStack: ["Next.js", "Supabase", "TypeScript", "pnpm"],
      progress: 0,
      createdAt: t,
      updatedAt: t,
    };
    s.projects.push(project);

    const mission: Mission = {
      id: createId("mis"),
      projectId: project.id,
      title: "V0.1 基盤",
      goal: "手動オーケストレーションの一周を通す",
      status: "in_progress",
      priority: 100,
      risk: "medium",
      complexity: 7,
      progress: 0,
      sortOrder: 0,
      createdAt: t,
      updatedAt: t,
    };
    s.missions.push(mission);

    const specs: Array<{
      title: string;
      goal: string;
      complexity: number;
      domain: Domain;
      taskType: TaskType;
      risk: RiskLevel;
      estimatedFiles: number;
      contextFiles: string[];
    }> = [
      {
        title: "アーキテクチャ",
        goal: "monorepo・正本・手動オーケストレーションの境界を確定する",
        complexity: 7,
        domain: "infrastructure",
        taskType: "planning",
        risk: "medium",
        estimatedFiles: 8,
        contextFiles: ["docs/architecture/product-brief.md", "AGENTS.md"],
      },
      {
        title: "データベースレビュー",
        goal: "V0.1スキーマのマイグレーションとseedをレビューする",
        complexity: 6,
        domain: "db",
        taskType: "review",
        risk: "medium",
        estimatedFiles: 4,
        contextFiles: ["supabase/migrations/001_init.sql"],
      },
      {
        title: "UIプロトタイプ / ダッシュボード",
        goal: "次のアクションを最優先にしたダッシュボードを作る",
        complexity: 5,
        domain: "ui",
        taskType: "ui",
        risk: "low",
        estimatedFiles: 6,
        contextFiles: ["apps/web/src/app/page.tsx"],
      },
      {
        title: "AIルーター",
        goal: "ルールベースのエージェント/帯ルーティングを実装する",
        complexity: 7,
        domain: "logic",
        taskType: "implementation",
        risk: "medium",
        estimatedFiles: 5,
        contextFiles: ["packages/router/src/route.ts"],
      },
      {
        title: "ルーターレビュー",
        goal: "ルーティングルールを独立レビューする",
        complexity: 5,
        domain: "logic",
        taskType: "review",
        risk: "low",
        estimatedFiles: 3,
        contextFiles: ["packages/router/src/route.ts"],
      },
      {
        title: "プロンプトエンジン",
        goal: "タスク/レビュー/引き継ぎプロンプトを生成する",
        complexity: 6,
        domain: "logic",
        taskType: "implementation",
        risk: "low",
        estimatedFiles: 4,
        contextFiles: ["packages/prompts/src/generate.ts"],
      },
      {
        title: "UI統合",
        goal: "タスク詳細の実行・引き継ぎループをつなぐ",
        complexity: 6,
        domain: "ui",
        taskType: "implementation",
        risk: "medium",
        estimatedFiles: 8,
        contextFiles: ["apps/web/src/app/tasks"],
      },
      {
        title: "最終監査",
        goal: "V0.1完成条件に対して監査する",
        complexity: 6,
        domain: "security",
        taskType: "review",
        risk: "medium",
        estimatedFiles: 10,
        contextFiles: ["docs/architecture/product-brief.md"],
      },
    ];

    specs.forEach((spec, i) => {
      let task: Task = {
        id: createId("task"),
        missionId: mission.id,
        projectId: project.id,
        code: createCode("TASK", i + 1),
        title: spec.title,
        description: spec.goal,
        goal: spec.goal,
        status: i === 0 ? "ready" : "todo",
        priority: 100 - i,
        complexity: spec.complexity,
        risk: spec.risk,
        taskType: spec.taskType,
        domain: spec.domain,
        scope: "Mission Control V0.1 の範囲のみ",
        outOfScope: "Local Runner、MLルーティング、課金、チーム権限",
        acceptanceCriteria: [
          "V0.1計画に沿っている",
          "無関係なスコープを入れない",
          "引き継ぎを残す",
        ],
        estimatedFiles: spec.estimatedFiles,
        contextFiles: spec.contextFiles,
        contextSize: "medium",
        routingReasons: [],
        createdAt: t,
        updatedAt: t,
      };
      task = applyRouting(task, s);
      s.tasks.push(task);
    });
  });

  const next = await readStore();
  return next.projects.find((p) => p.name === "LUMINA Mission Control")!;
}

/**
 * 「やりたいこと」から作戦（project + mission + 段取りtasks）を一括生成。
 * ルールベース。一般人向けの定番5段。
 */
export async function createPlanFromIdea(input: {
  idea: string;
  intake?: PlanIntake;
}) {
  const idea = input.idea.trim();
  if (!idea) throw new Error("やりたいことを書いてください");

  const intake = input.intake ?? DEFAULT_PLAN_INTAKE;
  const signals = ideaSignalsFromText(idea);
  const derived = derivePlanFromIntake(idea, intake);
  const { looksAuth, looksUi, looksDb } = signals;
  const baseDomain = derived.domain;

  let projectId = "";
  let firstTaskId = "";

  await updateStore((s) => {
    const t = nowIso();
    const shortName =
      idea.length > 40 ? `${idea.slice(0, 40)}…` : idea;

    const project: Project = {
      id: createId("proj"),
      workspaceId: s.workspace.id,
      name: shortName,
      description: idea,
      goal: idea,
      status: "active",
      defaultBranch: "main",
      techStack: [],
      progress: 0,
      planIntake: intake,
      createdAt: t,
      updatedAt: t,
    };
    s.projects.push(project);
    projectId = project.id;

    const mission: Mission = {
      id: createId("mis"),
      projectId: project.id,
      title: "完成までの作戦",
      goal: idea,
      status: "in_progress",
      priority: 100 + derived.priorityBonus,
      risk: derived.missionRisk,
      complexity: derived.missionComplexity,
      progress: 0,
      sortOrder: 0,
      createdAt: t,
      updatedAt: t,
    };
    s.missions.push(mission);

    const rawSteps: Array<{
      title: string;
      goal: string;
      taskType: TaskType;
      domain: Domain;
      complexity: number;
      risk: RiskLevel;
      estimatedFiles: number;
      scope: string;
      outOfScope: string;
    }> = [
      {
        title: "場所を探す",
        goal: `「${idea}」に関係するコードの場所と現状を把握する`,
        taskType: "exploration",
        domain: baseDomain,
        complexity: 3,
        risk: "low",
        estimatedFiles: 3,
        scope: "調査とメモまで。大きな実装はしない",
        outOfScope: "本番変更、無関係なリファクタ",
      },
      {
        title: "本体をつくる",
        goal: `「${idea}」の中心部分を実装する`,
        taskType: "implementation",
        domain: looksAuth ? "auth" : looksDb ? "db" : baseDomain,
        complexity: looksAuth || looksDb ? 7 : looksUi ? 5 : 6,
        risk: looksAuth ? "high" : "medium",
        estimatedFiles: looksAuth || looksDb ? 6 : 4,
        scope: "ゴールに必要な実装のみ",
        outOfScope: "別機能の追加、大規模リファクタ",
      },
      {
        title: "自分で確認する",
        goal: "動くか・壊れていないかを手元で確認する",
        taskType: "testing",
        domain: "logic",
        complexity: 3,
        risk: "low",
        estimatedFiles: 2,
        scope: "動作確認と簡単なテスト",
        outOfScope: "新機能の追加",
      },
      {
        title: "見直す",
        goal: "差分だけを見直し、穴とリスクを見つける",
        taskType: "review",
        domain: looksAuth ? "security" : "logic",
        complexity: 5,
        risk: looksAuth ? "high" : "medium",
        estimatedFiles: 4,
        scope: "git diff のレビューのみ",
        outOfScope: "全面書き直し",
      },
      {
        title: "直して仕上げる",
        goal: "見直しで出た点を直し、完成にする",
        taskType: "implementation",
        domain: baseDomain === "ui" ? "ui" : "logic",
        complexity: 4,
        risk: "low",
        estimatedFiles: 3,
        scope: "指摘への対応のみ",
        outOfScope: "別スコープの拡張",
      },
    ];
    const steps = rawSteps.map((step) => derived.adjustStep(step));

    steps.forEach((step, i) => {
      let task: Task = {
        id: createId("task"),
        missionId: mission.id,
        projectId: project.id,
        code: createCode("TASK", s.tasks.length + 1),
        title: step.title,
        description: step.goal,
        goal: step.goal,
        status: i === 0 ? "ready" : "todo",
        priority: 100 - i + derived.priorityBonus,
        complexity: step.complexity,
        risk: step.risk,
        taskType: step.taskType,
        domain: step.domain,
        scope: step.scope,
        outOfScope: step.outOfScope,
        acceptanceCriteria: [
          "ゴールを満たす",
          "触らないことに手を出さない",
          "申し送りを残す",
        ],
        estimatedFiles: step.estimatedFiles,
        contextFiles: [],
        contextSize: "small",
        routingReasons: [],
        createdAt: t,
        updatedAt: t,
      };
      task = applyRouting(task, s);
      task.routingReasons = [
        ...new Set([...task.routingReasons, ...derived.intakeRoutingReasons]),
      ];
      if (i === 0) firstTaskId = task.id;
      s.tasks.push(task);
    });
  });

  return { projectId, firstTaskId };
}
