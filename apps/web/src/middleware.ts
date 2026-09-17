import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  LOGIN_PATH,
  isAuthRoutePath,
  isEmailAllowed,
  parseAllowedEmails,
} from "@/lib/auth/policy";
import { getSupabaseEnv } from "@/lib/supabase/config";

const ALLOWED_EMAILS = parseAllowedEmails(process.env.LUMINA_ALLOWED_EMAILS);

/**
 * リダイレクト応答にも、直前のトークン更新で発行された cookie を載せる。
 * 載せ忘れると更新済みセッションが捨てられ、毎回 refresh が走る。
 */
function redirectWithCookies(
  request: NextRequest,
  carrier: NextResponse,
  pathname: string,
  params: Record<string, string> = {},
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  const redirect = NextResponse.redirect(url);
  for (const cookie of carrier.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export async function middleware(request: NextRequest) {
  const env = getSupabaseEnv();

  // Supabase 未設定 = 認証オフ。V0.1 のローカル dogfood を壊さない。
  if (!env) return NextResponse.next();

  // /auth/* は自前で cookie を書くので素通しする。
  if (isAuthRoutePath(request.nextUrl.pathname)) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // 認証 cookie を載せた応答を CDN にキャッシュさせない
        for (const [key, value] of Object.entries(headers ?? {})) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // getUser() は Auth サーバーに問い合わせて検証する。
  // cookie の中身をそのまま信じる getSession() は middleware では使わない。
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ログイン画面自体は素通し。ただしトークン更新の結果は返す。
  if (request.nextUrl.pathname === LOGIN_PATH) return response;

  if (!user) {
    return redirectWithCookies(request, response, LOGIN_PATH, {
      next: `${request.nextUrl.pathname}${request.nextUrl.search}`,
    });
  }

  if (!isEmailAllowed(user.email, ALLOWED_EMAILS)) {
    return redirectWithCookies(request, response, LOGIN_PATH, {
      error: "not_allowed",
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 静的アセット以外すべて。
     * 画像・favicon まで認証チェックすると無駄な Auth 問い合わせが増える。
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
