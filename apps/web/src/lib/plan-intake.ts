import type {
  Domain,
  PlanDeadlineUrgency,
  PlanIntake,
  PlanProductionExposure,
  PlanTouchSurface,
  RiskLevel,
  TaskType,
} from "@lumina/core";

export const DEFAULT_PLAN_INTAKE: PlanIntake = {
  touchSurface: "unknown",
  productionExposure: "local_only",
  deadline: "flexible",
};

const TOUCH_LABEL: Record<PlanTouchSurface, string> = {
  unknown: "まだわからない（探すところから）",
  existing_code: "既存コードを直す・足す",
  greenfield: "新しく作る（ゼロから）",
  ui_only: "見た目・画面だけ",
};

const PROD_LABEL: Record<PlanProductionExposure, string> = {
  local_only: "手元・開発だけ",
  may_affect_users: "本番やユーザーに触れるかも",
};

const DEADLINE_LABEL: Record<PlanDeadlineUrgency, string> = {
  flexible: "余裕がある",
  this_week: "今週中",
  today: "今日中",
};

export function parsePlanIntake(input: {
  touchSurface?: string | null;
  productionExposure?: string | null;
  deadline?: string | null;
}): PlanIntake {
  const touch = input.touchSurface as PlanTouchSurface;
  const prod = input.productionExposure as PlanProductionExposure;
  const deadline = input.deadline as PlanDeadlineUrgency;
  return {
    touchSurface:
      touch && touch in TOUCH_LABEL ? touch : DEFAULT_PLAN_INTAKE.touchSurface,
    productionExposure:
      prod && prod in PROD_LABEL ? prod : DEFAULT_PLAN_INTAKE.productionExposure,
    deadline:
      deadline && deadline in DEADLINE_LABEL
        ? deadline
        : DEFAULT_PLAN_INTAKE.deadline,
  };
}

function bumpRisk(risk: RiskLevel): RiskLevel {
  if (risk === "low") return "medium";
  if (risk === "medium") return "high";
  return "critical";
}

export interface IdeaSignals {
  looksAuth: boolean;
  looksUi: boolean;
  looksDb: boolean;
}

export function ideaSignalsFromText(idea: string): IdeaSignals {
  const lower = idea.toLowerCase();
  return {
    looksAuth:
      /認証|ログイン|oauth|auth|google|セッション/.test(idea) ||
      /auth|oauth|login/.test(lower),
    looksUi:
      /画面|ui|css|デザイン|見た目|レイアウト/.test(idea) || /ui|css/.test(lower),
    looksDb:
      /db|データベース|supabase|スキーマ|テーブル|migration/.test(idea) ||
      /database|schema/.test(lower),
  };
}

export interface PlanDerivation {
  missionRisk: RiskLevel;
  missionComplexity: number;
  domain: Domain;
  intakeRoutingReasons: string[];
  priorityBonus: number;
  adjustStep: <T extends PlanStepTemplate>(step: T) => T;
}

export type PlanStepTemplate = {
  title: string;
  goal: string;
  taskType: TaskType;
  domain: Domain;
  complexity: number;
  risk: RiskLevel;
  estimatedFiles: number;
  scope: string;
  outOfScope: string;
}

/** ヒアリング + 一行アイデアから作戦メタを逆算する（ルールベース・説明可能） */
export function derivePlanFromIntake(
  idea: string,
  intake: PlanIntake,
): PlanDerivation {
  const signals = ideaSignalsFromText(idea);
  let missionRisk: RiskLevel = signals.looksAuth ? "high" : "medium";
  let missionComplexity =
    signals.looksAuth || signals.looksDb ? 7 : signals.looksUi ? 4 : 6;

  let domain: Domain = signals.looksUi
    ? "ui"
    : signals.looksAuth
      ? "auth"
      : signals.looksDb
        ? "db"
        : "logic";

  if (intake.touchSurface === "ui_only") domain = "ui";
  if (intake.productionExposure === "may_affect_users") {
    missionRisk = bumpRisk(missionRisk);
    missionComplexity = Math.min(8, missionComplexity + 1);
  }
  if (intake.deadline === "this_week") {
    missionComplexity = Math.min(8, missionComplexity + 0.5);
  }
  if (intake.deadline === "today") {
    missionComplexity = Math.min(9, missionComplexity + 1);
  }

  const intakeRoutingReasons: string[] = ["plan_intake"];
  if (intake.touchSurface === "unknown") {
    intakeRoutingReasons.push("intake_unknown_surface");
  }
  if (intake.productionExposure === "may_affect_users") {
    intakeRoutingReasons.push("intake_production");
  }
  if (intake.deadline === "today") {
    intakeRoutingReasons.push("intake_urgent");
  }

  const priorityBonus =
    intake.deadline === "today" ? 5 : intake.deadline === "this_week" ? 2 : 0;

  const adjustStep = <T extends PlanStepTemplate>(step: T): T => {
    const next = { ...step };

    if (step.title === "場所を探す") {
      if (intake.touchSurface === "greenfield") {
        next.scope =
          "新規作り。既存コードとの接点・置き場所だけ調べる。大きな実装はしない";
      } else if (intake.touchSurface === "existing_code") {
        next.scope =
          "既存コードの場所と依存関係を把握する。大きな実装はしない";
      } else if (intake.touchSurface === "ui_only") {
        next.domain = "ui";
        next.scope = "画面・コンポーネントの場所と現状。ロジックの全面変更はしない";
      }
    }

    if (step.title === "本体をつくる") {
      if (intake.touchSurface === "ui_only") next.domain = "ui";
      if (intake.productionExposure === "may_affect_users") {
        next.risk = bumpRisk(next.risk);
        next.complexity = Math.min(9, next.complexity + 1);
        next.estimatedFiles += 1;
        next.outOfScope = `${next.outOfScope}。本番デプロイ・無検証の公開`;
      }
    }

    if (step.title === "見直す" && intake.productionExposure === "may_affect_users") {
      next.risk = bumpRisk(next.risk);
      if (signals.looksAuth || domain === "auth") next.domain = "security";
    }

    if (step.title === "自分で確認する" && intake.productionExposure === "may_affect_users") {
      next.scope = "動作確認。本番相当の設定がある場合は影響範囲もメモする";
    }

    return next as T;
  };

  return {
    missionRisk,
    missionComplexity,
    domain,
    intakeRoutingReasons,
    priorityBonus,
    adjustStep,
  };
}

export function formatPlanIntakeSummary(intake: PlanIntake): string {
  return [
    "PLAN CONTEXT（作戦作成時のヒアリング）",
    `- 触る場所: ${TOUCH_LABEL[intake.touchSurface]}`,
    `- 本番・ユーザー: ${PROD_LABEL[intake.productionExposure]}`,
    `- いつまで: ${DEADLINE_LABEL[intake.deadline]}`,
    "※ おすすめAIはこの情報と固定ルールから出した初推定。必ずしも最適ではない。",
  ].join("\n");
}

export function planIntakeFieldLabels() {
  return { TOUCH_LABEL, PROD_LABEL, DEADLINE_LABEL };
}
