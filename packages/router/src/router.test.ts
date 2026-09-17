import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { routeTask } from "./route";

describe("routeTask", () => {
  it("routes low complexity UI to cursor fast/balanced", () => {
    const d = routeTask({
      taskType: "ui",
      complexity: 2,
      risk: "low",
      domain: "ui",
      estimatedFiles: 2,
    });
    assert.equal(d.agent, "cursor");
    assert.ok(d.modelTier === "fast" || d.modelTier === "balanced");
    assert.equal(d.executionBlocked, false);
  });

  it("routes planning to chatgpt_lumina", () => {
    const d = routeTask({
      taskType: "planning",
      complexity: 5,
      risk: "medium",
      domain: "logic",
      estimatedFiles: 1,
    });
    assert.equal(d.agent, "chatgpt_lumina");
    assert.equal(d.mode, "plan");
  });

  it("routes auth high complexity to claude strong with review", () => {
    const d = routeTask({
      taskType: "implementation",
      complexity: 7,
      risk: "high",
      domain: "auth",
      estimatedFiles: 6,
    });
    assert.equal(d.agent, "claude_code");
    assert.equal(d.modelTier, "strong");
    assert.equal(d.reviewRequired, true);
    assert.equal(d.reviewAgent, "codex");
  });

  it("blocks XL / complexity 9+ and recommends split", () => {
    const d = routeTask({
      taskType: "implementation",
      complexity: 9.5,
      risk: "critical",
      domain: "logic",
      estimatedFiles: 20,
    });
    assert.equal(d.splitRecommended, true);
    assert.equal(d.executionBlocked, true);
    assert.equal(d.mode, "plan");
    assert.equal(d.agent, "chatgpt_lumina");
  });

  it("blocks XL by file count even when complexity is lower", () => {
    const d = routeTask({
      taskType: "implementation",
      complexity: 5,
      risk: "medium",
      domain: "api",
      estimatedFiles: 15,
    });
    assert.equal(d.taskSize, "XL");
    assert.equal(d.executionBlocked, true);
    assert.equal(d.splitRecommended, true);
  });

  it("routes review tasks to codex strong", () => {
    const d = routeTask({
      taskType: "review",
      complexity: 5,
      risk: "medium",
      domain: "security",
      estimatedFiles: 4,
    });
    assert.equal(d.agent, "codex");
    assert.equal(d.modelTier, "strong");
    assert.equal(d.mode, "review");
  });

  it("reroutes red agent to cursor unless blocker", () => {
    const d = routeTask({
      taskType: "implementation",
      complexity: 7,
      risk: "medium",
      domain: "api",
      estimatedFiles: 5,
      resourceStatus: { claude_code: "red", cursor: "green" },
    });
    assert.equal(d.agent, "cursor");
    assert.ok(d.reason.includes("resource_red_reroute_cursor"));
  });

  it("keeps preferred agent on red when task is a blocker", () => {
    const d = routeTask({
      taskType: "implementation",
      complexity: 7,
      risk: "high",
      domain: "auth",
      estimatedFiles: 6,
      resourceStatus: { claude_code: "red", cursor: "green" },
      isBlocker: true,
    });
    assert.equal(d.agent, "claude_code");
    assert.ok(d.reason.includes("resource_red_but_blocker"));
  });

  it("keeps review on Codex when Codex is red", () => {
    const d = routeTask({
      taskType: "review",
      complexity: 5,
      risk: "medium",
      domain: "security",
      estimatedFiles: 4,
      resourceStatus: { codex: "red", cursor: "green" },
    });
    assert.equal(d.agent, "codex");
    assert.equal(d.modelTier, "strong");
    assert.ok(d.reason.includes("resource_red_keep_reviewer"));
  });

  it("downgrades strong to balanced on yellow when complexity < 7, except review", () => {
    const impl = routeTask({
      taskType: "implementation",
      complexity: 6,
      risk: "medium",
      domain: "auth",
      estimatedFiles: 3,
      resourceStatus: { claude_code: "yellow" },
    });
    assert.equal(impl.agent, "claude_code");
    assert.equal(impl.modelTier, "balanced");
    assert.ok(impl.reason.includes("resource_yellow_limit_strong"));

    const review = routeTask({
      taskType: "review",
      complexity: 5,
      risk: "medium",
      domain: "security",
      estimatedFiles: 3,
      resourceStatus: { codex: "yellow" },
    });
    assert.equal(review.agent, "codex");
    assert.equal(review.modelTier, "strong");
  });
});
