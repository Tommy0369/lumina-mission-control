import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function main() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lumina-smoke-"));
  process.env.LUMINA_STORE_PATH = path.join(dir, "store.json");
  const {
    seedDogfoodProject,
    getDashboard,
    getTask,
    startRun,
    completeRun,
    listRuns,
    getResources,
  } = await import("../apps/web/src/lib/services.ts");

  try {
    const project = await seedDogfoodProject();
    console.log("project", project.name, project.id);
    const dash = await getDashboard();
    console.log(
      "next",
      dash.nextTask?.code,
      dash.nextRecommendation?.agent,
      dash.nextRecommendation?.modelTier,
    );
    if (!dash.nextTask) throw new Error("no next task");
    const detail = await getTask(dash.nextTask.id);
    console.log("prompt has ROLE", detail?.prompt.includes("ROLE"));
    console.log("size", detail?.taskSize, "blocked", detail?.executionBlocked);
    const run = await startRun({
      taskId: dash.nextTask.id,
      useRecommended: true,
    });
    console.log(
      "run started",
      run.code,
      run.status,
      run.resourcePointsEstimated,
    );
    const done = await completeRun({
      runId: run.id,
      result: "success",
      changedFiles: ["docs/architecture/product-brief.md", "AGENTS.md"],
      testsSummary: "n/a — architecture notes",
      resultNotes: "Boundaries confirmed for Manual Orchestration",
    });
    console.log("handoff", done.handoffId);
    const after = await getTask(dash.nextTask.id);
    console.log("task status", after?.task.status);
    console.log(
      "handoff next",
      after?.handoffs.at(-1)?.nextAgent,
      after?.handoffs.at(-1)?.nextAction?.slice(0, 60),
    );
    const resources = await getResources();
    console.log(
      "resources",
      resources.map((r) => `${r.agent.id}:${r.todayRp}:${r.status}`).join(" | "),
    );
    const runs = await listRuns();
    console.log("runs", runs.length);
    console.log("store", process.env.LUMINA_STORE_PATH);
    console.log("OK");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
