import {
  createCode,
  createId,
  nowIso,
  resourceStatusFromUsage,
  type AgentId,
  type Domain,
  type Mission,
  type ModelTier,
  type Project,
  type ResourceStatus,
  type RiskLevel,
  type Run,
  type RunMode,
  type StoreSnapshot,
  type Task,
  type TaskType,
} from "@lumina/core";
import { routeTask } from "@lumina/router";
import {
  generateHandoffMarkdown,
  generateReviewPrompt,
  generateTaskPrompt,
} from "@lumina/prompts";
import { readStore, updateStore } from "./store";

function applyRouting(task: Task, store: StoreSnapshot): Task {
  const resourceStatus = Object.fromEntries(
    store.aiAgents.map((a) => {
      const override = store.resourceOverrides[a.id];
      const status =
        override?.status ??
        resourceStatusFromUsage(override?.todayRp ?? 0, a.dailySoftCapRp);
      return [a.id, status];
    }),
  ) as Partial<Record<AgentId, ResourceStatus>>;

  const decision = routeTask({
    taskType: task.taskType,
    complexity: task.complexity,
    risk: task.risk,
    domain: task.domain,
    estimatedFiles: task.estimatedFiles,
    contextSize: task.contextSize,
    resourceStatus,
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

export async function getDashboard() {
  const store = await readStore();
  const activeProjects = store.projects.filter((p) => p.status === "active");
  const tasks = store.tasks;
  const running = tasks.filter((t) => t.status === "running");
  const blocked = tasks.filter((t) => t.status === "blocked");
  const ready = tasks.filter((t) => t.status === "ready" || t.status === "todo");
  const doneToday = tasks.filter((t) => {
    if (t.status !== "done") return false;
    return t.updatedAt.slice(0, 10) === new Date().toISOString().slice(0, 10);
  });

  const nextTask =
    ready.sort((a, b) => b.priority - a.priority || a.complexity - b.complexity)[0] ??
    running[0] ??
    null;

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
  const currentTask =
    tasks.find((t) => t.status === "running") ??
    tasks.find((t) => t.status === "ready" || t.status === "todo") ??
    null;
  return { project, missions, tasks, currentTask };
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
  const prompt = generateTaskPrompt({ task });
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
    const decision = routeTask({
      taskType: task.taskType,
      complexity: task.complexity,
      risk: task.risk,
      domain: task.domain,
      estimatedFiles: task.estimatedFiles,
    });
    if (decision.executionBlocked) {
      throw new Error("TASK TOO LARGE — split before running");
    }

    const agent =
      input.useRecommended !== false
        ? (task.recommendedAgent ?? decision.agent)
        : (input.agent ?? task.recommendedAgent ?? decision.agent);
    const modelTier =
      input.useRecommended !== false
        ? (task.recommendedModelTier ?? decision.modelTier)
        : (input.modelTier ?? task.recommendedModelTier ?? decision.modelTier);
    const mode =
      input.mode ?? task.recommendedMode ?? decision.mode ?? "implementation";

    const prompt = generateTaskPrompt({
      task,
      agent,
      modelTier,
      mode,
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
      source: "estimated",
      recordedAt: t,
    });

    const nextAgent =
      input.result === "success" && task.reviewRequired
        ? task.reviewAgent
        : input.result === "failure"
          ? run.agent
          : undefined;
    const nextAction =
      input.result === "success" && task.reviewRequired
        ? "Review current git diff only."
        : input.result === "failure"
          ? "Retry with narrowed scope or escalate agent."
          : "Mark task done or pick next task.";

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
      blockers: input.result === "failure" ? ["Run failed — see notes"] : [],
      nextAgent,
      nextAction,
      reviewPrompt,
      createdAt: t,
    };
    store.handoffs.push(handoff);
    handoffId = handoff.id;

    if (input.result === "success") {
      task.status = task.reviewRequired ? "review" : "done";
    } else {
      task.status = "blocked";
    }
    task.updatedAt = t;

    // Update mission/project progress roughly
    const missionTasks = store.tasks.filter((x) => x.missionId === task.missionId);
    const missionDone = missionTasks.filter((x) => x.status === "done").length;
    const mission = store.missions.find((m) => m.id === task.missionId);
    if (mission) {
      mission.progress = Math.round((missionDone / missionTasks.length) * 100);
      mission.status =
        mission.progress === 100
          ? "done"
          : missionTasks.some((x) => x.status === "running")
            ? "in_progress"
            : missionTasks.some((x) => x.status === "blocked")
              ? "blocked"
              : "in_progress";
      mission.updatedAt = t;
    }
    const projectTasks = store.tasks.filter((x) => x.projectId === task.projectId);
    const project = store.projects.find((p) => p.id === task.projectId);
    if (project && projectTasks.length) {
      const done = projectTasks.filter((x) => x.status === "done").length;
      project.progress = Math.round((done / projectTasks.length) * 100);
      project.updatedAt = t;
    }
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
  return store.routingRules.sort((a, b) => b.priority - a.priority);
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
      description: "AI Development Resource Orchestrator — dogfood project",
      goal: "Plan. Route. Build. Review. Learn. — V0.1 Manual Orchestration",
      status: "active",
      repoUrl: "https://github.com/local/lumina-mission-control",
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
      title: "V0.1 Foundation",
      goal: "Ship Manual Orchestration loop",
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
        title: "Architecture",
        goal: "Define monorepo, SSOT, and Manual Orchestration boundaries",
        complexity: 7,
        domain: "infrastructure",
        taskType: "planning",
        risk: "medium",
        estimatedFiles: 8,
        contextFiles: ["docs/architecture/product-brief.md", "AGENTS.md"],
      },
      {
        title: "Database Review",
        goal: "Review migrations and seed for V0.1 schema",
        complexity: 6,
        domain: "db",
        taskType: "review",
        risk: "medium",
        estimatedFiles: 4,
        contextFiles: ["supabase/migrations/001_init.sql"],
      },
      {
        title: "UI Prototype / Dashboard",
        goal: "Build Dashboard with NEXT ACTION first",
        complexity: 5,
        domain: "ui",
        taskType: "ui",
        risk: "low",
        estimatedFiles: 6,
        contextFiles: ["apps/web/src/app/page.tsx"],
      },
      {
        title: "AI Router",
        goal: "Implement rule-based agent/tier routing",
        complexity: 7,
        domain: "logic",
        taskType: "implementation",
        risk: "medium",
        estimatedFiles: 5,
        contextFiles: ["packages/router/src/route.ts"],
      },
      {
        title: "Router Review",
        goal: "Independent review of routing rules",
        complexity: 5,
        domain: "logic",
        taskType: "review",
        risk: "low",
        estimatedFiles: 3,
        contextFiles: ["packages/router/src/route.ts"],
      },
      {
        title: "Prompt Engine",
        goal: "Generate Task/Review/Handoff prompts",
        complexity: 6,
        domain: "logic",
        taskType: "implementation",
        risk: "low",
        estimatedFiles: 4,
        contextFiles: ["packages/prompts/src/generate.ts"],
      },
      {
        title: "UI Integration",
        goal: "Wire Task Detail Run/Handoff loop",
        complexity: 6,
        domain: "ui",
        taskType: "implementation",
        risk: "medium",
        estimatedFiles: 8,
        contextFiles: ["apps/web/src/app/tasks"],
      },
      {
        title: "Final Audit",
        goal: "Audit V0.1 against completion criteria",
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
        scope: "Mission Control V0.1 scope only",
        outOfScope: "Local Runner, ML routing, billing, team ACL",
        acceptanceCriteria: [
          "Matches V0.1 plan",
          "No unrelated scope",
          "Document handoff",
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
