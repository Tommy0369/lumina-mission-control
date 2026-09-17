/**
 * 認証ポリシーの純粋関数。
 *
 * Next.js / Supabase を import しないので middleware・route handler・
 * server component のどこからでも使えて、そのまま単体テストできる。
 */

export const LOGIN_PATH = "/login";
export const CALLBACK_PATH = "/auth/callback";
export const SIGNOUT_PATH = "/auth/signout";

/** `/auth/*` は cookie を自前で扱うので middleware のガード対象外にする。 */
export function isAuthRoutePath(pathname: string): boolean {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

/** ログインしていなくても開けるパス。 */
export function isPublicPath(pathname: string): boolean {
  return pathname === LOGIN_PATH || isAuthRoutePath(pathname);
}

/**
 * ログイン後の戻り先を検証する。
 *
 * オープンリダイレクトを避けるため、同一オリジンの相対パスだけ通す。
 * 認証画面そのものへ戻すとループするので `/` に落とす。
 */
export function safeRedirectTarget(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  // "//evil.com" と "/\evil.com" はプロトコル相対 URL として解釈されうる
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  const pathname = raw.split("?")[0].split("#")[0];
  if (isPublicPath(pathname)) return "/";
  return raw;
}

/**
 * 許可メールの一覧。空なら「認証済みなら誰でも通す」。
 *
 * LUMINA はとみー専用なので、Google プロバイダを有効にしたあと
 * 任意の Google アカウントで入れてしまわないように絞れるようにする。
 */
export function parseAllowedEmails(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(
  email: string | null | undefined,
  allowed: string[],
): boolean {
  if (allowed.length === 0) return true;
  if (!email) return false;
  return allowed.includes(email.toLowerCase());
}

export type LoginErrorCode =
  | "not_configured"
  | "oauth"
  | "missing_code"
  | "exchange"
  | "not_allowed";

const LOGIN_ERROR_LABEL: Record<LoginErrorCode, string> = {
  not_configured: "Supabase がまだ設定されていない。",
  oauth: "Google 側でログインが中断された。もう一度試す。",
  missing_code: "ログインの応答が不完全だった。もう一度試す。",
  exchange: "セッションの引き換えに失敗した。もう一度試す。",
  not_allowed: "このアカウントは許可されていない。",
};

export function loginErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return LOGIN_ERROR_LABEL[code as LoginErrorCode] ?? "ログインに失敗した。";
}
