"use client";

import { useCallback, useState } from "react";

/** 削除確認用：長い名前をタップでクリップボードにコピー */
export function CopyConfirmName({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }, [name]);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <span className="mc-muted" style={{ fontSize: 12 }}>
        確認用の名前（タップでコピー → 下の欄に貼り付け）
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        title="クリップボードにコピー"
        style={{
          margin: 0,
          padding: "10px 12px",
          textAlign: "left",
          font: "inherit",
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.4,
          wordBreak: "break-word",
          cursor: "pointer",
          border: "1px dashed #b8b3a8",
          borderRadius: 8,
          background: copied ? "#d8f0df" : "#f3f1ec",
          color: "var(--text, #2a2a28)",
        }}
      >
        {name}
      </button>
      <span
        className="mc-muted"
        style={{ fontSize: 12, minHeight: "1.2em" }}
        aria-live="polite"
      >
        {copied ? "コピーした。確認欄に ⌘V で貼り付け" : "長い名前はコピペが楽"}
      </span>
    </div>
  );
}
