import {
  seedDogfoodProject,
  getDashboard,
  getTask,
  startRun,
  completeRun,
  listRuns,
  getResources,
} from "../apps/web/src/lib/services.ts";

async function main() {
  const project = await seedDogfoodProject();
  console.log("project", project.name, project.id);
  const dash = await getDashboard();
  console.log(
    "next",
    dash.nextTask?.code,
    dash.nextTask?.recommendedAgent,
    dash.nextTask?.recommendedModelTier,
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
  console.log("OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
