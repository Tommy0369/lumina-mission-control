import Link from "next/link";

export function BackToProjectsLink({
  hash,
}: {
  /** 例: "completed" → /projects#completed */
  hash?: "completed";
}) {
  const href = hash ? `/projects#${hash}` : "/projects";
  const label =
    hash === "completed" ? "完成したもの一覧に戻る" : "つくっているものに戻る";

  return (
    <Link
      href={href}
      className="mc-muted"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 14,
        fontWeight: 500,
        marginBottom: 8,
      }}
    >
      <span aria-hidden>←</span>
      {label}
    </Link>
  );
}
