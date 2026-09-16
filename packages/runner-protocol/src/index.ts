/**
 * V0.2 Local Runner protocol (types only in V0.1).
 * No CLI execution in V0.1 — Manual Orchestration only.
 */
import type { AgentId, ModelTier, PermissionLevel, RunMode } from "@lumina/core";

export interface RunnerJobRequest {
  runId: string;
  taskId: string;
  agent: AgentId;
  modelTier: ModelTier;
  mode: RunMode;
  cwd: string;
  prompt: string;
  permissions: PermissionLevel[];
  maxTurns?: number;
}

export interface RunnerJobEvent {
  runId: string;
  type: "started" | "log" | "file_changed" | "finished" | "error";
  message?: string;
  path?: string;
  at: string;
}

export interface RunnerJobResult {
  runId: string;
  exitCode: number;
  changedFiles: string[];
  summary: string;
  finishedAt: string;
}
