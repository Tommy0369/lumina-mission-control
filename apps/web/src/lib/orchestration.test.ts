import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

describe("orchestration state machine", () => {
  let dir = "";
  let api: typeof import("./services.ts");

  before(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "lumina-orch-"));
    process.env.LUMINA_STORE_PATH = path.join(dir, "store.json");
    api = await import("./services.ts");
  });

  after(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("keeps review in the next-action path and does not double-count completion", async () => {
    const { firstTaskId } = await api.createPlanFromIdea({
      idea: "Google認証を追加したい",
    });
    assert.ok(firstTaskId);

    const first = await api.startRun({
      taskId: firstTaskId,
      useRecommended: true,
    });
    await api.completeRun({ runId: first.id, result: "success" });

    const dashAfterExplore = await api.getDashboard();
    const build = dashAfterExplore.nextTask;
    assert.equal(build?.title, "本体をつくる");
    assert.equal(build?.recommendedAgent, "claude_code");

    const buildRun = await api.startRun({
      taskId: build!.id,
      useRecommended: true,
    });
    await api.completeRun({ runId: buildRun.id, result: "success" });

    const waiting = await api.getDashboard();
    assert.equal(waiting.nextTask?.id, build!.id);
    assert.equal(waiting.nextTask?.status, "review");
    assert.equal(waiting.nextRecommendation?.agent, "codex");
    assert.equal(waiting.nextRecommendation?.mode, "review");

    const reviewRun = await api.startRun({
      taskId: build!.id,
      useRecommended: true,
    });
    assert.equal(reviewRun.agent, "codex");
    assert.equal(reviewRun.mode, "review");

    const duringReview = await api.getDashboard();
    assert.equal(duringReview.nextTask?.id, build!.id);
    assert.equal(duringReview.nextTask?.status, "running");
    assert.equal(duringReview.nextRecommendation?.agent, "codex");
    assert.equal(duringReview.nextRecommendation?.mode, "review");

    const detail = await api.getTask(build!.id);
    assert.equal(detail?.nextRecommendation.agent, "codex");
    assert.match(reviewRun.promptSnapshot, /GPT-5\.6 Sol/);

    await assert.rejects(
      () => api.startRun({ taskId: build!.id, useRecommended: true }),
      /already has a running run/,
    );

    const beforeRp = await api.getResources();
    const codexBefore =
      beforeRp.find((row) => row.agent.id === "codex")?.todayRp ?? 0;

    const firstComplete = await api.completeRun({
      runId: reviewRun.id,
      result: "success",
    });
    const secondComplete = await api.completeRun({
      runId: reviewRun.id,
      result: "success",
    });
    assert.equal(firstComplete.handoffId, secondComplete.handoffId);

    const afterRp = await api.getResources();
    const codexAfter =
      afterRp.find((row) => row.agent.id === "codex")?.todayRp ?? 0;
    assert.equal(
      codexAfter,
      codexBefore + (reviewRun.resourcePointsEstimated ?? 0),
    );

    const done = await api.getTask(build!.id);
    assert.equal(done?.task.status, "done");
    await assert.rejects(
      () => api.startRun({ taskId: build!.id, useRecommended: true }),
      /Completed or cancelled/,
    );
  });

  it("updates and deletes a task with confirmation", async () => {
    const { firstTaskId } = await api.createPlanFromIdea({
      idea: "在庫管理の画面を作りたい",
    });
    const updated = await api.updateTask(firstTaskId, {
      title: "場所を探す（修正）",
      goal: "画面の入口を見つける",
    });
    assert.equal(updated.title, "場所を探す（修正）");
    await assert.rejects(
      () => api.deleteTask(firstTaskId, "WRONG"),
      /confirmation mismatch/,
    );
    const deleted = await api.deleteTask(firstTaskId, updated.code);
    assert.ok(deleted.projectId);
    const missing = await api.getTask(firstTaskId);
    assert.equal(missing, null);
  });

  it("deletes a project and cascades tasks, runs, and missions", async () => {
    const { projectId, firstTaskId } = await api.createPlanFromIdea({
      idea: "テスト用の作戦",
    });
    const detail = await api.getProject(projectId);
    assert.ok(detail);
    const name = detail!.project.name;
    await assert.rejects(
      () => api.deleteProject(projectId, "wrong-name"),
      /confirmation mismatch/,
    );
    await api.deleteProject(projectId, name);
    assert.equal(await api.getProject(projectId), null);
    assert.equal(await api.getTask(firstTaskId), null);
  });

  it("marks project done when all plan steps are complete", async () => {
    const { projectId } = await api.createPlanFromIdea({
      idea: "完成テスト用",
    });
    const detail = await api.getProject(projectId);
    assert.ok(detail);
    for (const task of detail!.tasks.sort((a, b) => b.priority - a.priority)) {
      const run = await api.startRun({ taskId: task.id, useRecommended: true });
      await api.completeRun({ runId: run.id, result: "success" });
    }
    const after = await api.getProject(projectId);
    assert.equal(after!.project.progress, 100);
    assert.equal(after!.project.status, "done");
    assert.ok(api.isProjectComplete(after!.project));
  });
});
