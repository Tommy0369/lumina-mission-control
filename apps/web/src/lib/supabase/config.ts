/**
 * Supabase の環境変数。
 *
 * `process.env.NEXT_PUBLIC_*` はリテラルのまま書く。Next.js がビルド時に
 * 置換するので、動的アクセスにするとブラウザ・Edge で undefined になる。
 */

export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** 未設定なら認証は丸ごと無効。V0.1 のローカル JSON store だけで動く。 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

export function requireSupabaseEnv(): SupabaseEnv {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase env not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return env;
}
