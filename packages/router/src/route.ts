import {
  classifyTaskSize,
  contextSizeFromFiles,
  estimateResourcePoints,
  isExecutionBlocked,
  type AgentId,
  type ContextSize,
  type Domain,
  type ModelTier,
  type ResourceStatus,
  type RiskLevel,
  type RunMode,
  type TaskType,
} from "@lumina/core";

export interface RouteInput {
  taskType: TaskType;
  complexity: number;
  risk: RiskLevel;
  domain: Domain;
  estimatedFiles: number;
  contextSize?: ContextSize;
  resourceStatus?: Partial<Record<AgentId, ResourceStatus>>;
  isBlocker?: boolean;
}

export interface RouteDecision {
  agent: AgentId;
  modelTier: ModelTier;
  mode: RunMode;
  complexity: number;
  risk: RiskLevel;
  resourceBudget: number;
  reason: string[];
  reviewRequired: boolean;
  reviewAgent?: AgentId;
  splitRecommended: boolean;
  executionBlocked: boolean;
  taskSize: ReturnType<typeof classifyTaskSize>;
  contextSize: ContextSize;
}

function pickMode(taskType: TaskType): RunMode {
  switch (taskType) {
    case "planning":
      return "plan";
    case "exploration":
      return "explore";
    case "review":
    case "security":
      return "review";
    case "debugging":
      return "debug";
    default:
      return "implementation";
  }
}

function defaultPermissionsMode(taskType: TaskType): RunMode {
  return pickMode(taskType);
}

export function routeTask(input: RouteInput): RouteDecision {
  const complexity = Math.min(10, Math.max(0, input.complexity));
  const contextSize =
    input.contextSize ?? contextSizeFromFiles(input.estimatedFiles);
  const taskSize = classifyTaskSize(
    input.estimatedFiles,
    complexity,
    input.risk,
  );
  const reason: string[] = [];
  const mode = defaultPermissionsMode(input.taskType);
  const resource = input.resourceStatus ?? {};

  if (isExecutionBlocked(taskSize, complexity)) {
    reason.push("complexity_or_size_requires_split");
    return {
      agent: "chatgpt_lumina",
      modelTier: "max",
      mode: "plan",
      complexity,
      risk: input.risk,
      resourceBudget: estimateResourcePoints(complexity, "max", contextSize),
      reason,
      reviewRequired: false,
      splitRecommended: true,
      executionBlocked: true,
      taskSize,
      contextSize,
    };
  }

  let agent: AgentId = "cursor";
  let modelTier: ModelTier = "balanced";
  let reviewRequired = false;
  let reviewAgent: AgentId | undefined;

  if (input.taskType === "review" || input.taskType === "security") {
    agent = "codex";
    modelTier = complexity >= 6 ? "strong" : "balanced";
    reason.push(input.taskType);
  } else if (input.taskType === "planning") {
    agent = "chatgpt_lumina";
    modelTier = complexity >= 7 ? "strong" : "balanced";
    reason.push("planning");
  } else if (input.taskType === "exploration" || input.taskType === "ui") {
    agent = "cursor";
    modelTier = complexity <= 3 ? "fast" : "balanced";
    reason.push(input.taskType === "ui" ? "ui_work" : "exploration");
  } else if (
    (input.domain === "auth" ||
      input.domain === "db" ||
      input.domain === "security") &&
    complexity >= 6
  ) {
    agent = "claude_code";
    modelTier = "strong";
    reason.push(input.domain, "security_sensitive");
    reviewRequired = true;
    reviewAgent = "codex";
  } else if (complexity <= 3) {
    agent = "cursor";
    modelTier = complexity <= 1 ? "fast" : "balanced";
    reason.push("low_complexity");
  } else if (complexity <= 6) {
    if (input.estimatedFiles >= 5 || input.domain === "api") {
      agent = "claude_code";
      modelTier = "balanced";
      reason.push("medium_complexity_multi_file");
    } else {
      agent = "cursor";
      modelTier = "balanced";
      reason.push("medium_complexity");
    }
  } else {
    // 7–8
    if (input.taskType === "debugging") {
      agent = "codex";
      modelTier = "strong";
      reason.push("complex_debugging");
    } else {
      agent = "claude_code";
      modelTier = "strong";
      reason.push("high_complexity");
    }
    reviewRequired = true;
    reviewAgent = "codex";
  }

  if (input.estimatedFiles >= 5) reason.push("multiple_files");
  if (input.risk === "high" || input.risk === "critical") {
    reason.push(`risk_${input.risk}`);
    reviewRequired = true;
    reviewAgent = reviewAgent ?? "codex";
  }

  // Resource pressure: RED → prefer Cursor unless blocker
  const agentStatus = resource[agent];
  if (agentStatus === "red") {
    if (input.isBlocker) {
      reason.push("resource_red_but_blocker");
    } else if (agent !== "cursor") {
      reason.push("resource_red_reroute_cursor");
      agent = "cursor";
      modelTier = complexity >= 6 ? "balanced" : "fast";
      if (complexity >= 7) {
        reason.push("high_complexity_under_resource_pressure");
      }
    }
  } else if (agentStatus === "yellow" && modelTier === "strong" && complexity < 7) {
    modelTier = "balanced";
    reason.push("resource_yellow_limit_strong");
  }

  const resourceBudget = estimateResourcePoints(
    complexity,
    modelTier,
    contextSize,
  );

  return {
    agent,
    modelTier,
    mode,
    complexity,
    risk: input.risk,
    resourceBudget,
    reason: [...new Set(reason)],
    reviewRequired,
    reviewAgent,
    splitRecommended: false,
    executionBlocked: false,
    taskSize,
    contextSize,
  };
}
