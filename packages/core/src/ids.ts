export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(prefix = "id"): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function createCode(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(3, "0")}`;
}
