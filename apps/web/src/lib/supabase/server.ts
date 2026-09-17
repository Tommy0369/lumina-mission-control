import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, requireSupabaseEnv } from "./config";

/**
 * Server Component / Route Handler / Server Action 用のクライアント。
 * リクエストごとに新しく作る（使い回すと別ユーザーのセッションが漏れる）。
 */
export async function createServerSupabaseClient() {
  const { url, anonKey } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component からは cookie を書けない。
          // トークン更新は middleware 側が担当するので握りつぶしてよい。
        }
      },
    },
  });
}

/** 未設定・未ログインなら null。画面側の分岐はこれ一本で足りる。 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
