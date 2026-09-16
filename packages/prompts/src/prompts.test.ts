import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateTaskPrompt, generateReviewPrompt } from "./generate";

describe("prompts", () => {
  it("includes required sections", () => {
    const prompt = generateTaskPrompt({
      task: {
        code: "TASK-032",
        title: "Fix OAuth callback",
        goal: "Redirect to /dashboard after OAuth",
        description: "Callback lands on /login",
        scope: "callback, middleware, session",
        outOfScope: "UI, billing",
        acceptanceCriteria: ["Login succeeds", "Redirect /dashboard"],
        contextFiles: ["middleware.ts"],
        recommendedAgent: "claude_code",
        recommendedModelTier: "strong",
        recommendedMode: "implementation",
      },
    });
    for (const section of [
      "ROLE",
      "GOAL",
      "CONTEXT",
      "SCOPE",
      "DO NOT TOUCH",
      "ACCEPTANCE",
      "OUTPUT",
      "STOP CONDITION",
    ]) {
      assert.ok(prompt.includes(section), `missing ${section}`);
    }
  });

  it("generates compact review prompt", () => {
    const p = generateReviewPrompt({
      taskCode: "TASK-032",
      taskTitle: "Fix OAuth",
    });
    assert.ok(p.includes("git diff"));
    assert.ok(p.includes("PASS"));
  });
});
