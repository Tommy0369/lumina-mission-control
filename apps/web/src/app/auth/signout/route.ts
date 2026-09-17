import { NextResponse, type NextRequest } from "next/server";
import { LOGIN_PATH } from "@/lib/auth/policy";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** POST だけ受ける。GET にするとリンクのプリフェッチで勝手にログアウトする。 */
export async function POST(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }
  // 303 で POST → GET に落としてからログイン画面へ
  return NextResponse.redirect(new URL(LOGIN_PATH, request.nextUrl.origin), {
    status: 303,
  });
}
