import type { ContextSize, ModelTier } from "./types";

export const TIER_MULTIPLIER: Record<ModelTier, number> = {
  fast: 1,
  balanced: 2,
  strong: 4,
  max: 8,
};

export const CONTEXT_MULTIPLIER: Record<ContextSize, number> = {
  small: 1.0,
  medium: 1.5,
  large: 2.5,
};

/** Estimated Resource Points for a task/run. */
export function estimateResourcePoints(
  complexity: number,
  tier: ModelTier,
  contextSize: ContextSize,
): number {
  const score =
    Math.max(0, complexity) * TIER_MULTIPLIER[tier] * CONTEXT_MULTIPLIER[contextSize];
  return Math.round(score * 10) / 10;
}

export function contextSizeFromFiles(estimatedFiles: number): ContextSize {
  if (estimatedFiles <= 3) return "small";
  if (estimatedFiles <= 8) return "medium";
  return "large";
}
