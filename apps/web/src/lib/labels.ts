import type {
  AgentId,
  MissionStatus,
  ModelTier,
  ProjectStatus,
  ResourceStatus,
  RunStatus,
  TaskStatus,
} from "@lumina/core";
import { DEFAULT_MODEL_PROFILES } from "./seed";

export const AGENT_LABEL: Record<AgentId, string> = {
  chatgpt_lumina: "ChatGPT / LUMINA",
  cursor: "Cursor",
  claude_code: "Claude Code",
  codex: "Codex",
};

export const TIER_LABEL: Record<string, string> = {
  fast: "軽い作業",
  balanced: "いつもの作業",
  strong: "難しい作業",
  max: "いちばん難しい作業",
};

export function agentLabel(id?: string | null): string {
  if (!id) return "—";
  return AGENT_LABEL[id as AgentId] ?? id;
}

/** 能力帯 → 実際に選ぶモデル名 */
export function resolveModelProfile(
  agentId?: string | null,
  tier?: string | null,
) {
  if (!agentId || !tier) return null;
  return (
    DEFAULT_MODEL_PROFILES.find(
      (p) => p.agentId === agentId && p.tier === tier && p.active,
    ) ?? null
  );
}

/** 画面用: 「Claude Code · Opus 5 · 超高」 */
export function recommendationLabel(
  agentId?: string | null,
  tier?: string | null,
): string {
  const agent = agentLabel(agentId);
  const profile = resolveModelProfile(agentId, tier);
  if (!profile) {
    if (!tier) return agent;
    return `${agent} · ${TIER_LABEL[tier] ?? tier}`;
  }
  const effort = profile.pickerEffort ? ` · ${profile.pickerEffort}` : "";
  return `${agent} · ${profile.pickerModel}${effort}`;
}

/** 選び方の一言（画面のスライダーと同じ言葉） */
export function modelPickHint(
  agentId?: string | null,
  tier?: string | null,
): string {
  const profile = resolveModelProfile(agentId, tier);
  if (!profile) return "";
  if (!profile.pickerEffort) {
    return `モデルで「${profile.pickerModel}」を選ぶ。仕事量の選択はない。`;
  }
  return `モデルで「${profile.pickerModel}」を選び、仕事量は「${profile.pickerEffort}」（${profile.effortMenu}）`;
}

export function tierOptionsForAgent(agentId: AgentId): Array<{
  value: ModelTier;
  label: string;
}> {
  return DEFAULT_MODEL_PROFILES.filter((p) => p.agentId === agentId && p.active).map(
    (p) => ({
      value: p.tier,
      label: p.pickerEffort
        ? `${p.pickerModel} · ${p.pickerEffort}`
        : p.pickerModel,
    }),
  );
}

export const MODE_LABEL: Record<string, string> = {
  ask: "Ask（質問）",
  plan: "Plan（計画）",
  explore: "Explore（探索）",
  implementation: "Implementation（実装）",
  review: "Review（レビュー）",
  debug: "Debug（デバッグ）",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "これから",
  ready: "これから",
  running: "いまやってる",
  blocked: "つまった",
  review: "見直し待ち",
  done: "できた",
  cancelled: "やめた",
};

export const MISSION_STATUS_LABEL: Record<MissionStatus, string> = {
  planned: "計画中",
  in_progress: "進行中",
  blocked: "ブロック",
  done: "完了",
  cancelled: "取消",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "稼働中",
  paused: "一時停止",
  archived: "アーカイブ",
  done: "完了",
};

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  queued: "待機",
  running: "実行中",
  paused: "一時停止",
  success: "成功",
  failure: "失敗",
  cancelled: "取消",
};

export const RESOURCE_STATUS_LABEL: Record<ResourceStatus, string> = {
  green: "余裕あり",
  yellow: "注意",
  red: "逼迫",
};

export const DOMAIN_LABEL: Record<string, string> = {
  ui: "UI",
  db: "DB",
  auth: "認証",
  security: "セキュリティ",
  infrastructure: "インフラ",
  api: "API",
  logic: "ロジック",
  documentation: "ドキュメント",
};

export const TASK_TYPE_LABEL: Record<string, string> = {
  planning: "計画",
  exploration: "探索",
  implementation: "実装",
  debugging: "デバッグ",
  testing: "テスト",
  review: "レビュー",
  security: "セキュリティ",
  ui: "UI",
  data_analysis: "データ分析",
};

export const RISK_LABEL: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "致命的",
};
