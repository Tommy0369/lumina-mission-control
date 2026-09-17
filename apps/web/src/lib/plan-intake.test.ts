import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_PLAN_INTAKE,
  derivePlanFromIntake,
  formatPlanIntakeSummary,
  ideaSignalsFromText,
  parsePlanIntake,
} from "./plan-intake.ts";

describe("plan intake", () => {
  it("parses form values with defaults for invalid", () => {
    assert.deepEqual(parsePlanIntake({}), DEFAULT_PLAN_INTAKE);
    assert.equal(
      parsePlanIntake({ productionExposure: "may_affect_users" })
        .productionExposure,
      "may_affect_users",
    );
  });

  it("raises mission risk when production may be affected", () => {
    const base = derivePlanFromIntake("在庫画面", DEFAULT_PLAN_INTAKE);
    const prod = derivePlanFromIntake("在庫画面", {
      ...DEFAULT_PLAN_INTAKE,
      productionExposure: "may_affect_users",
    });
    assert.equal(base.missionRisk, "medium");
    assert.equal(prod.missionRisk, "high");
    assert.ok(prod.intakeRoutingReasons.includes("intake_production"));
  });

  it("tags unknown surface and urgent deadline", () => {
    const d = derivePlanFromIntake("なにか", {
      touchSurface: "unknown",
      productionExposure: "local_only",
      deadline: "today",
    });
    assert.ok(d.intakeRoutingReasons.includes("intake_unknown_surface"));
    assert.ok(d.intakeRoutingReasons.includes("intake_urgent"));
    assert.ok(d.priorityBonus > 0);
  });

  it("detects auth keywords", () => {
    assert.equal(ideaSignalsFromText("Google認証").looksAuth, true);
  });

  it("formats summary for prompts", () => {
    const text = formatPlanIntakeSummary(DEFAULT_PLAN_INTAKE);
    assert.match(text, /初推定/);
    assert.match(text, /触る場所/);
  });
});
