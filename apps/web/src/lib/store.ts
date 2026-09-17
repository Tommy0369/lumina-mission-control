import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import type { StoreSnapshot } from "@lumina/core";
import {
  DEFAULT_AGENTS,
  DEFAULT_MODEL_PROFILES,
  DEFAULT_ROUTING_RULES,
  createSeedStore,
} from "./seed";

/** Resolve monorepo root regardless of process.cwd() (apps/web vs repo root). */
function resolveStorePath(): string {
  if (process.env.LUMINA_STORE_PATH) {
    return path.resolve(process.env.LUMINA_STORE_PATH);
  }
  // apps/web/src/lib/store.ts → ../../../../data/store.json
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../../../data/store.json");
}

const LOCK_TIMEOUT_MS = 5_000;
const LOCK_RETRY_MS = 20;
const LOCK_STALE_MS = 30_000;

function isFsError(error: unknown, code: string): boolean {
  return error instanceof Error && "code" in error && error.code === code;
}

async function ensureStoreFile(storePath: string): Promise<void> {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  try {
    await fs.writeFile(storePath, JSON.stringify(createSeedStore(), null, 2), {
      flag: "wx",
    });
  } catch (error) {
    if (!isFsError(error, "EEXIST")) throw error;
  }
}

function withJapaneseCatalog(store: StoreSnapshot): StoreSnapshot {
  return {
    ...store,
    workspace: {
      ...store.workspace,
      ownerName: store.workspace.ownerName === "Tommy" ? "とみー" : store.workspace.ownerName,
    },
    aiAgents: DEFAULT_AGENTS,
    modelProfiles: DEFAULT_MODEL_PROFILES,
    routingRules: DEFAULT_ROUTING_RULES,
  };
}

export async function readStore(): Promise<StoreSnapshot> {
  const storePath = resolveStorePath();
  await ensureStoreFile(storePath);
  const raw = await fs.readFile(storePath, "utf8");
  return withJapaneseCatalog(JSON.parse(raw) as StoreSnapshot);
}

async function writeStoreUnlocked(
  storePath: string,
  store: StoreSnapshot,
): Promise<void> {
  await ensureStoreFile(storePath);
  const tmp = `${storePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(tmp, JSON.stringify(withJapaneseCatalog(store), null, 2));
    await fs.rename(tmp, storePath);
  } finally {
    await fs.unlink(tmp).catch((error: unknown) => {
      if (!isFsError(error, "ENOENT")) throw error;
    });
  }
}

async function withStoreLock<T>(
  storePath: string,
  action: () => Promise<T>,
): Promise<T> {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  const lockPath = `${storePath}.lock`;
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  let handle: Awaited<ReturnType<typeof fs.open>> | undefined;

  while (!handle) {
    try {
      handle = await fs.open(lockPath, "wx");
    } catch (error) {
      if (!isFsError(error, "EEXIST")) throw error;
      try {
        const stat = await fs.stat(lockPath);
        if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
          await fs.unlink(lockPath);
          continue;
        }
      } catch (statError) {
        if (isFsError(statError, "ENOENT")) continue;
        throw statError;
      }
      if (Date.now() >= deadline) {
        throw new Error(`Timed out waiting for store lock: ${lockPath}`);
      }
      await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_MS));
    }
  }

  try {
    return await action();
  } finally {
    await handle.close();
    await fs.unlink(lockPath).catch((error: unknown) => {
      if (!isFsError(error, "ENOENT")) throw error;
    });
  }
}

export async function writeStore(store: StoreSnapshot): Promise<void> {
  const storePath = resolveStorePath();
  await withStoreLock(storePath, () => writeStoreUnlocked(storePath, store));
}

export async function updateStore(
  mutator: (store: StoreSnapshot) => void | StoreSnapshot,
): Promise<StoreSnapshot> {
  const storePath = resolveStorePath();
  return withStoreLock(storePath, async () => {
    await ensureStoreFile(storePath);
    const raw = await fs.readFile(storePath, "utf8");
    const store = withJapaneseCatalog(JSON.parse(raw) as StoreSnapshot);
    const result = mutator(store);
    const next = result ?? store;
    await writeStoreUnlocked(storePath, next);
    return next;
  });
}

export function storePathForDocs(): string {
  return resolveStorePath();
}
