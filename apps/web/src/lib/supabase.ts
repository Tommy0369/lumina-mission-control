/**
 * @deprecated TASK-010 で `lib/supabase/` に分割した。
 *
 * - 環境変数: `lib/supabase/config`
 * - ブラウザ: `lib/supabase/browser`（cookie セッション / @supabase/ssr）
 * - サーバー: `lib/supabase/server`
 *
 * 旧 `createBrowserSupabase()` は localStorage セッションだったため、
 * SSR とセッションを共有できなかった。互換のため名前だけ残す。
 */
export { isSupabaseConfigured, getSupabaseEnv } from "./supabase/config";
export { getBrowserSupabase as createBrowserSupabase } from "./supabase/browser";
