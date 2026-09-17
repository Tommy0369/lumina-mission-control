import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./config";

/**
 * ブラウザ側の Supabase クライアント。
 *
 * `@supabase/ssr` はセッションを localStorage ではなく cookie に置くので、
 * middleware と server component が同じセッションを読める。
 * `createBrowserClient` 自体がシングルトン（`isSingleton` 既定 true）。
 */
export function getBrowserSupabase() {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
