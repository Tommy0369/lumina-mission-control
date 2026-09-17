import { NextResponse, type NextRequest } from "next/server";
import {
  LOGIN_PATH,
  isEmailAllowed,
  parseAllowedEmails,
  safeRedirectTarget,
  type LoginErrorCode,
} from "@/lib/auth/policy";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Google OAuth（PKCE）のコールバック。
 * `code` をセッションに引き換え、cookie に保存してから元の画面へ戻す。
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeRedirectTarget(url.searchParams.get("next"));

  const fail = (reason: LoginErrorCode) => {
    const target = new URL(LOGIN_PATH, url.origin);
    target.searchParams.set("error", reason);
    return NextResponse.redirect(target);
  };

  if (!isSupabaseConfigured()) return fail("not_configured");

  // Google / Supabase 側で中断された場合
  if (url.searchParams.get("error") || url.searchParams.get("error_description")) {
    return fail("oauth");
  }

  const code = url.searchParams.get("code");
  if (!code) return fail("missing_code");

  const supabase = await createServerSupabaseClient();

  // 同時に複数の PKCE フローが走ったときのための flow id（あれば使う）
  const flowId = url.searchParams.get("sb_flow_id");
  const { error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  );
  if (error) return fail("exchange");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("exchange");

  if (!isEmailAllowed(user.email, parseAllowedEmails(process.env.LUMINA_ALLOWED_EMAILS))) {
    await supabase.auth.signOut();
    return fail("not_allowed");
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
