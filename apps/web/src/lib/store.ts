import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StoreSnapshot } from "@lumina/core";
import { createSeedStore } from "./seed";

/** Resolve monorepo root regardless of process.cwd() (apps/web vs repo root). */
function resolveStorePath(): string {
  // apps/web/src/lib/store.ts → ../../../../data/store.json
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../../../data/store.json");
}

const STORE_PATH = resolveStorePath();

async function ensureStoreFile(): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(createSeedStore(), null, 2));
  }
}

export async function readStore(): Promise<StoreSnapshot> {
  await ensureStoreFile();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  return JSON.parse(raw) as StoreSnapshot;
}

export async function writeStore(store: StoreSnapshot): Promise<void> {
  await ensureStoreFile();
  const tmp = `${STORE_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2));
  await fs.rename(tmp, STORE_PATH);
}

export async function updateStore(
  mutator: (store: StoreSnapshot) => void | StoreSnapshot,
): Promise<StoreSnapshot> {
  const store = await readStore();
  const result = mutator(store);
  const next = result ?? store;
  await writeStore(next);
  return next;
}

export function storePathForDocs(): string {
  return STORE_PATH;
}
