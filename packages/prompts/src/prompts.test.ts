import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateTaskPrompt,
  generateReviewPrompt,
  generateHandoffMarkdown,
  generateDebugPrompt,
} from "./generate";

function assertSections(prompt: string, sections: string[]) {
  for (const section of sections) {
    assert.ok(prompt.includes(section), `missing ${section}`);
  }
}

describe("prompts", () => {
  const sampleTask = {
    code: "TASK-032",
    title: "Fix OAuth callback",
    goal: "Redirect to /dashboard after OAuth",
    description: "Callback lands on /login",
    scope: "callback, middleware, session",
    outOfScope: "UI, billing",
    acceptanceCriteria: ["Login succeeds", "Redirect /dashboard"],
    contextFiles: ["middleware.ts"],
    recommendedAgent: "claude_code" as const,
    recommendedModelTier: "strong" as const,
    recommendedMode: "implementation" as const,
  };

  it("task prompt includes required sections", () => {
    const prompt = generateTaskPrompt({
      task: sampleTask,
      pickerModel: "Opus 5",
      pickerEffort: "超高",
    });
    assertSections(prompt, [
      "ROLE",
      "GOAL",
      "TASK",
      "DESCRIPTION",
      "CONTEXT",
      "CURRENT STATE",
      "SCOPE",
      "DO NOT TOUCH",
      "ACCEPTANCE",
      "OUTPUT",
      "STOP CONDITION",
    ]);
    assert.ok(prompt.includes("TASK-032"));
    assert.ok(prompt.includes("middleware.ts"));
    assert.ok(prompt.includes("Opus 5"));
    assert.ok(prompt.includes("超高"));
    assert.ok(prompt.includes("モデルで「Opus 5」を選び、仕事量は「超高」"));
  });

  it("review prompt includes required sections", () => {
    const p = generateReviewPrompt({
      taskCode: "TASK-032",
      taskTitle: "Fix OAuth",
    });
    assertSections(p, [
      "ROLE",
      "GOAL",
      "TASK",
      "FOCUS",
      "DO NOT TOUCH",
      "OUTPUT",
      "STOP CONDITION",
    ]);
    assert.ok(p.includes("PASS"));
    assert.ok(p.includes("FINDINGS:"));
    assert.ok(p.includes("GPT-5.6 Sol"));
    assert.ok(p.includes("高"));
  });

  it("review prompt uses custom focus when provided", () => {
    const p = generateReviewPrompt({
      taskCode: "TASK-001",
      taskTitle: "Auth",
      focus: ["token expiry", "csrf"],
    });
    assert.ok(p.includes("- token expiry"));
    assert.ok(p.includes("- csrf"));
  });

  it("handoff markdown includes required sections", () => {
    const h = generateHandoffMarkdown({
      taskCode: "TASK-032",
      worker: "cursor",
      modelTier: "balanced",
      result: "SUCCESS",
      changedFiles: ["apps/web/page.tsx"],
      tests: "typecheck OK",
      knownRisks: ["manual QA pending"],
      nextAgent: "codex",
      nextAction: "Review git diff",
    });
    assertSections(h, [
      "HANDOFF",
      "TASK",
      "WORKER",
      "MODEL",
      "RESULT",
      "CHANGED FILES",
      "TESTS",
      "KNOWN RISKS",
      "NEXT",
      "ACTION",
    ]);
    assert.ok(h.includes("apps/web/page.tsx"));
    assert.ok(h.includes("Review git diff"));
  });

  it("debug prompt includes required sections", () => {
    const d = generateDebugPrompt({
      taskCode: "TASK-099",
      symptom: "500 on POST /api/login",
      files: ["apps/web/src/app/api/login/route.ts"],
    });
    assertSections(d, [
      "ROLE",
      "GOAL",
      "TASK",
      "CONTEXT FILES",
      "SCOPE",
      "DO NOT TOUCH",
      "ACCEPTANCE",
      "OUTPUT",
      "STOP CONDITION",
    ]);
    assert.ok(d.includes("500 on POST /api/login"));
  });
});
