/**
 * Auth UI guard checks against a running dev server.
 * Auth-off: no env needed. Auth-on: set NEXT_PUBLIC_* in apps/web/.env.local and restart dev.
 *
 * Usage: pnpm verify:auth
 *        BASE_URL=http://127.0.0.1:3000 pnpm verify:auth
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

type Check = { name: string; run: () => Promise<void> };

async function fetchStatus(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; location: string | null }> {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual", ...init });
  return { status: res.status, location: res.headers.get("location") };
}

const checks: Check[] = [
  {
    name: "GET / returns 200 (auth off or logged in)",
    async run() {
      const { status } = await fetchStatus("/");
      if (status !== 200) {
        throw new Error(`expected 200, got ${status} (auth on + not logged in → 307 is OK if testing auth-on)`);
      }
    },
  },
  {
    name: "GET /login returns 200",
    async run() {
      const { status } = await fetchStatus("/login");
      if (status !== 200) throw new Error(`expected 200, got ${status}`);
    },
  },
  {
    name: "GET /auth/callback without code → redirect login error",
    async run() {
      const { status, location } = await fetchStatus("/auth/callback");
      if (status !== 307 && status !== 302) {
        throw new Error(`expected redirect, got ${status}`);
      }
      const okError =
        location?.includes("error=missing_code") ||
        location?.includes("error=not_configured");
      if (!location?.includes("/login") || !okError) {
        throw new Error(`unexpected location: ${location}`);
      }
    },
  },
  {
    name: "GET /auth/signout → 405",
    async run() {
      const { status } = await fetchStatus("/auth/signout");
      if (status !== 405) throw new Error(`expected 405, got ${status}`);
    },
  },
  {
    name: "POST /auth/signout → redirect login",
    async run() {
      const { status, location } = await fetchStatus("/auth/signout", {
        method: "POST",
      });
      if (status !== 303 && status !== 302 && status !== 307) {
        throw new Error(`expected redirect, got ${status}`);
      }
      if (!location?.includes("/login")) {
        throw new Error(`expected /login redirect, got ${location}`);
      }
    },
  },
];

async function main() {
  console.log("verify-auth-ui", BASE);
  let failed = 0;
  for (const check of checks) {
    try {
      await check.run();
      console.log("  ✔", check.name);
    } catch (err) {
      failed += 1;
      console.error("  ✘", check.name, err instanceof Error ? err.message : err);
    }
  }
  if (failed > 0) {
    console.error(`${failed} failed`);
    process.exit(1);
  }
  console.log("OK — for Google OAuth end-to-end, set apps/web/.env.local and sign in once in the browser.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
