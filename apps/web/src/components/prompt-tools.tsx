"use client";

import { useState } from "react";
import { Button } from "@lumina/ui";

export function CopyPromptButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : "Copy Prompt"}
    </Button>
  );
}

export function PromptViewer({
  prompt,
  reviewPrompt,
}: {
  prompt: string;
  reviewPrompt?: string | null;
}) {
  const [show, setShow] = useState(false);
  const [showReview, setShowReview] = useState(false);
  return (
    <div className="mc-stack">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button type="button" variant="secondary" onClick={() => setShow((v) => !v)}>
          {show ? "Hide Prompt" : "View Prompt"}
        </Button>
        <CopyPromptButton text={prompt} />
        {reviewPrompt ? (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowReview((v) => !v)}
            >
              {showReview ? "Hide Review Prompt" : "View Review Prompt"}
            </Button>
            <CopyPromptButton text={reviewPrompt} />
          </>
        ) : null}
      </div>
      {show ? <pre className="mc-pre">{prompt}</pre> : null}
      {showReview && reviewPrompt ? <pre className="mc-pre">{reviewPrompt}</pre> : null}
    </div>
  );
}
