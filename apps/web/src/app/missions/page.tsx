import { redirect } from "next/navigation";

/** ミッション一覧は日常ナビから外した。作戦はプロジェクト画面へ。 */
export default function MissionsRedirectPage() {
  redirect("/projects");
}
