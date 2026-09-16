import type { TaskSize } from "./types";

export function classifyTaskSize(
  estimatedFiles: number,
  complexity: number,
  risk: string,
): TaskSize {
  if (estimatedFiles >= 15 || complexity >= 9) return "XL";
  if (estimatedFiles >= 8 || complexity >= 7 || risk === "critical") return "L";
  if (estimatedFiles >= 3 || complexity >= 4) return "M";
  return "S";
}

export function isExecutionBlocked(size: TaskSize, complexity: number): boolean {
  return size === "XL" || complexity >= 9;
}
