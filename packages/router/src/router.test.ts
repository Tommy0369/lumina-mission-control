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
  });

  it("routes review tasks to codex", () => {
    const d = routeTask({
      taskType: "review",
      complexity: 5,
      risk: "medium",
      domain: "security",
      estimatedFiles: 4,
    });
    assert.equal(d.agent, "codex");
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
});
