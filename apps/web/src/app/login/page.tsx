import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Button, Panel } from "@lumina/ui";
import { GoogleSignInButton } from "@/components/google-sign-in";
import {
  SIGNOUT_PATH,
  isEmailAllowed,
  loginErrorMessage,
  parseAllowedEmails,
  safeRedirectTarget,
} from "@/lib/auth/policy";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ログイン — LUMINA",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeRedirectTarget(params.next);
  const message = loginErrorMessage(params.error);

  if (!isSupabaseConfigured()) {
    return (
      <>
        <header className="mc-header">
          <div>
            <h1>ログイン</h1>
            <p>まだ Supabase につないでいない。いまはログインなしで使える。</p>
          </div>
        </header>
        <Panel title="Google ログインを使うには">
          <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
            <li>Supabase の Authentication → Providers → Google を有効にする</li>
            <li>Google Cloud Console で OAuth クライアントを作る</li>
            <li>
              <code className="mc-mono">apps/web/.env.local</code> に URL と anon key を書く
            </li>
            <li>dev サーバーを再起動する</li>
          </ol>
          <p className="mc-muted" style={{ margin: 0, fontSize: 13 }}>
            手順は README の「Google ログイン（任意）」。secret はこのリポジトリに置かない。
          </p>
        </Panel>
      </>
    );
  }

  const user = await getCurrentUser();
  const allowed = isEmailAllowed(
    user?.email,
    parseAllowedEmails(process.env.LUMINA_ALLOWED_EMAILS),
  );

  if (user && allowed) {
    redirect(next);
  }

  const allowlist = parseAllowedEmails(process.env.LUMINA_ALLOWED_EMAILS);
  const allowlistMissing = allowlist.length === 0;

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>ログイン</h1>
          <p>とみー専用。Google アカウントで入る。</p>
        </div>
      </header>

      {allowlistMissing ? (
        <Panel title="許可リストが空">
          <p style={{ margin: 0, fontSize: 14, color: "var(--amber, #b45309)" }}>
            <code className="mc-mono">LUMINA_ALLOWED_EMAILS</code>{" "}
            が未設定だと、Google でログインできた人は誰でも入れる。
            個人利用では自分のメールだけを書く。
          </p>
        </Panel>
      ) : null}

      {message ? (
        <Panel>
          <p style={{ margin: 0, color: "var(--red)", fontSize: 14 }}>{message}</p>
        </Panel>
      ) : null}

      {user && !allowed ? (
        <Panel title="このアカウントでは入れない">
          <p style={{ margin: 0, fontSize: 14 }}>
            いまのログイン: <span className="mc-mono">{user.email}</span>
          </p>
          <p className="mc-muted" style={{ margin: 0, fontSize: 13 }}>
            許可アカウントは <code className="mc-mono">LUMINA_ALLOWED_EMAILS</code> で決まる。
          </p>
          <form action={SIGNOUT_PATH} method="post">
            <Button type="submit" variant="secondary">
              ログアウトして入り直す
            </Button>
          </form>
        </Panel>
      ) : (
        <Panel title="Google で入る">
          <GoogleSignInButton next={next} />
          <p className="mc-muted" style={{ margin: 0, fontSize: 13 }}>
            入ったあとは <span className="mc-mono">{next}</span> に戻る。
          </p>
        </Panel>
      )}
    </>
  );
}
