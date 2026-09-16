export type AgentId =
  | "chatgpt_lumina"
  | "cursor"
  | "claude_code"
  | "codex";

export type ModelTier = "fast" | "balanced" | "strong" | "max";

export type ContextSize = "small" | "medium" | "large";

export type ResourceStatus = "green" | "yellow" | "red";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type TaskType =
  | "planning"
  | "exploration"
  | "implementation"
  | "debugging"
  | "testing"
  | "review"
  | "security"
  | "ui"
  | "data_analysis";

export type Domain =
  | "ui"
  | "db"
  | "auth"
  | "security"
  | "infrastructure"
  | "api"
  | "logic"
  | "documentation";

export type TaskSize = "S" | "M" | "L" | "XL";

export type ProjectStatus = "active" | "paused" | "archived" | "done";
export type MissionStatus =
  | "planned"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";
export type TaskStatus =
  | "todo"
  | "ready"
  | "running"
  | "blocked"
  | "review"
  | "done"
  | "cancelled";
export type RunStatus =
  | "queued"
  | "running"
  | "paused"
  | "success"
  | "failure"
  | "cancelled";

export type PermissionLevel =
  | "read"
  | "plan"
  | "write"
  | "execute"
  | "commit"
  | "push"
  | "deploy";

export type RunMode =
  | "ask"
  | "plan"
  | "implementation"
  | "review"
  | "debug"
  | "explore";

export interface Workspace {
  id: string;
  name: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  goal: string;
  status: ProjectStatus;
  repoUrl?: string;
  defaultBranch: string;
  localPathHint?: string;
  techStack: string[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Mission {
  id: string;
  projectId: string;
  title: string;
  goal: string;
  status: MissionStatus;
  priority: number;
  risk: RiskLevel;
  complexity: number;
  progress: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  missionId: string;
  projectId: string;
  code: string;
  title: string;
  description: string;
  goal: string;
  status: TaskStatus;
  priority: number;
  complexity: number;
  risk: RiskLevel;
  taskType: TaskType;
  domain: Domain;
  scope: string;
  outOfScope: string;
  acceptanceCriteria: string[];
  estimatedFiles: number;
  contextFiles: string[];
  contextSize: ContextSize;
  recommendedAgent?: AgentId;
  recommendedModelTier?: ModelTier;
  recommendedMode?: RunMode;
  resourceBudget?: number;
  reviewRequired?: boolean;
  reviewAgent?: AgentId;
  splitRecommended?: boolean;
  routingReasons: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
}

export interface AiAgent {
  id: AgentId;
  name: string;
  role: string;
  bestFor: string[];
  dailySoftCapRp: number;
  weeklySoftCapRp: number;
  active: boolean;
}

export interface ModelProfile {
  id: string;
  agentId: AgentId;
  tier: ModelTier;
  label: string;
  providerModelHint: string;
  active: boolean;
}

export interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  condition: Record<string, unknown>;
  result: Partial<{
    agent: AgentId;
    modelTier: ModelTier;
    mode: RunMode;
    reviewRequired: boolean;
    reviewAgent: AgentId;
    splitRecommended: boolean;
  }>;
  active: boolean;
}

export interface Run {
  id: string;
  taskId: string;
  code: string;
  agent: AgentId;
  modelTier: ModelTier;
  mode: RunMode;
  status: RunStatus;
  promptSnapshot: string;
  permissions: PermissionLevel[];
  sessionId?: string;
  startedAt: string;
  finishedAt?: string;
  gitShaBefore?: string;
  gitShaAfter?: string;
  exitCode?: number;
  resourcePointsEstimated: number;
  resourcePointsActual?: number;
  result?: "success" | "failure";
  resultNotes?: string;
  changedFiles: string[];
  testsSummary?: string;
  humanIntervention: boolean;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UsageEvent {
  id: string;
  runId: string;
  provider: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  estimatedCost?: number;
  resourcePoints: number;
  source: "manual" | "cli" | "estimated";
  recordedAt: string;
}

export interface Handoff {
  id: string;
  runId: string;
  taskId: string;
  summary: string;
  changedFiles: string[];
  tests: string;
  risks: string[];
  blockers: string[];
  nextAgent?: AgentId;
  nextAction?: string;
  reviewPrompt?: string;
  createdAt: string;
}

export interface ContextAsset {
  id: string;
  taskId: string;
  path: string;
  kind: "file" | "note" | "diff" | "doc";
  notes?: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  taskId?: string;
  runId?: string;
  action: "commit" | "push" | "deploy" | "migration" | "delete" | "other";
  status: "pending" | "approved" | "rejected";
  notes?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface StoreSnapshot {
  version: number;
  workspace: Workspace;
  projects: Project[];
  missions: Mission[];
  tasks: Task[];
  taskDependencies: TaskDependency[];
  aiAgents: AiAgent[];
  modelProfiles: ModelProfile[];
  routingRules: RoutingRule[];
  runs: Run[];
  usageEvents: UsageEvent[];
  handoffs: Handoff[];
  contextAssets: ContextAsset[];
  approvals: Approval[];
  resourceOverrides: Record<AgentId, { todayRp: number; weekRp: number; status: ResourceStatus }>;
}
