"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  completeRun,
  createMission,
  createProject,
  createTask,
  recomputeTaskRouting,
  seedDogfoodProject,
  setResourceManual,
  startRun,
} from "./services";
import type {
  AgentId,
  Domain,
  ModelTier,
  ResourceStatus,
  RiskLevel,
  RunMode,
  TaskType,
} from "@lumina/core";

export async function actionCreateProject(formData: FormData) {
  const project = await createProject({
    name: String(formData.get("name") || "").trim(),
    goal: String(formData.get("goal") || "").trim(),
    description: String(formData.get("description") || ""),
    repoUrl: String(formData.get("repoUrl") || "") || undefined,
    techStack: String(formData.get("techStack") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  });
  revalidatePath("/");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function actionCreateMission(formData: FormData) {
  const mission = await createMission({
    projectId: String(formData.get("projectId")),
    title: String(formData.get("title") || "").trim(),
    goal: String(formData.get("goal") || "").trim(),
    complexity: Number(formData.get("complexity") || 5),
    risk: String(formData.get("risk") || "medium") as RiskLevel,
    priority: Number(formData.get("priority") || 50),
  });
  revalidatePath(`/projects/${mission.projectId}`);
  revalidatePath("/missions");
  redirect(`/missions/${mission.id}`);
}

export async function actionCreateTask(formData: FormData) {
  const task = await createTask({
    missionId: String(formData.get("missionId")),
    title: String(formData.get("title") || "").trim(),
    goal: String(formData.get("goal") || "").trim(),
    description: String(formData.get("description") || ""),
    complexity: Number(formData.get("complexity") || 5),
    risk: String(formData.get("risk") || "medium") as RiskLevel,
    taskType: String(formData.get("taskType") || "implementation") as TaskType,
    domain: String(formData.get("domain") || "logic") as Domain,
    scope: String(formData.get("scope") || ""),
    outOfScope: String(formData.get("outOfScope") || ""),
    acceptanceCriteria: String(formData.get("acceptanceCriteria") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    estimatedFiles: Number(formData.get("estimatedFiles") || 3),
    contextFiles: String(formData.get("contextFiles") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    priority: Number(formData.get("priority") || 50),
  });
  revalidatePath(`/tasks/${task.id}`);
  revalidatePath(`/missions/${task.missionId}`);
  revalidatePath("/");
  redirect(`/tasks/${task.id}`);
}

export async function actionStartRun(formData: FormData) {
  const useRecommended = formData.get("useRecommended") !== "false";
  const run = await startRun({
    taskId: String(formData.get("taskId")),
    useRecommended,
    agent: formData.get("agent")
      ? (String(formData.get("agent")) as AgentId)
      : undefined,
    modelTier: formData.get("modelTier")
      ? (String(formData.get("modelTier")) as ModelTier)
      : undefined,
    mode: formData.get("mode")
      ? (String(formData.get("mode")) as RunMode)
      : undefined,
  });
  revalidatePath(`/tasks/${run.taskId}`);
  revalidatePath("/runs");
  revalidatePath("/");
}

export async function actionCompleteRun(formData: FormData) {
  const runId = String(formData.get("runId"));
  const { readStore } = await import("./store");
  const before = await readStore();
  const existing = before.runs.find((r) => r.id === runId);
  await completeRun({
    runId,
    result: String(formData.get("result") || "success") as "success" | "failure",
    changedFiles: String(formData.get("changedFiles") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    testsSummary: String(formData.get("testsSummary") || ""),
    resultNotes: String(formData.get("resultNotes") || ""),
    resourcePointsActual: formData.get("resourcePointsActual")
      ? Number(formData.get("resourcePointsActual"))
      : undefined,
    humanIntervention: formData.get("humanIntervention") === "on",
  });
  revalidatePath("/runs");
  revalidatePath("/");
  revalidatePath("/resources");
  revalidatePath("/tasks");
  if (existing?.taskId) {
    revalidatePath(`/tasks/${existing.taskId}`);
  }
}

export async function actionReroute(taskId: string) {
  await recomputeTaskRouting(taskId);
  revalidatePath(`/tasks/${taskId}`);
}

export async function actionSeedDogfood() {
  const project = await seedDogfoodProject();
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  redirect(`/projects/${project.id}`);
}

export async function actionSetResource(formData: FormData) {
  await setResourceManual({
    agentId: String(formData.get("agentId")) as AgentId,
    todayRp: Number(formData.get("todayRp") || 0),
    weekRp: Number(formData.get("weekRp") || 0),
    status: String(formData.get("status") || "green") as ResourceStatus,
  });
  revalidatePath("/resources");
  revalidatePath("/");
}
