"use client";

import { useState } from "react";
import { Button } from "@lumina/ui";
import { CALLBACK_PATH } from "@/lib/auth/policy";
import { getBrowserSupabase } from "@/lib/supabase/browser";

/**
 * Google でログイン。
 * PKCE の verifier は `@supabase/ssr` が cookie に置くので、
 * 引き換えはサーバー側の /auth/callback で行える。
 */
export function GoogleSignInButton({ next }: { next: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const callback = new URL(CALLBACK_PATH, window.location.origin);
      callback.searchParams.set("next", next);
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback.toString() },
      });
      if (oauthError) throw oauthError;
      // 成功時はここで Google へ遷移するので pending のままでよい
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ログインを開始できなかった");
      setPending(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      <Button type="button" onClick={signIn} disabled={pending}>
        {pending ? "Google へ移動中…" : "Google でログイン"}
      </Button>
      {error ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--red)" }}>{error}</p>
      ) : null}
    </div>
  );
}
