import type { ResourceStatus } from "./types";

/** Soft-cap remaining ratio → status. */
export function resourceStatusFromUsage(
  usedRp: number,
  softCapRp: number,
): ResourceStatus {
  if (softCapRp <= 0) return "green";
  const remainingRatio = 1 - usedRp / softCapRp;
  if (remainingRatio >= 0.6) return "green";
  if (remainingRatio >= 0.3) return "yellow";
  return "red";
}
