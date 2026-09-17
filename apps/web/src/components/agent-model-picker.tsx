"use client";

import { useMemo, useState } from "react";
import type { AgentId, ModelTier } from "@lumina/core";
import {
  AGENT_LABEL,
  modelPickHint,
  tierOptionsForAgent,
} from "@/lib/labels";

const AGENTS: AgentId[] = [
  "cursor",
  "claude_code",
  "codex",
  "chatgpt_lumina",
];

export function AgentModelPicker({
  defaultAgent,
  defaultTier,
}: {
  defaultAgent: AgentId;
  defaultTier: ModelTier;
}) {
  const [agent, setAgent] = useState<AgentId>(defaultAgent);
  const [tier, setTier] = useState<ModelTier>(defaultTier);
  const options = useMemo(() => tierOptionsForAgent(agent), [agent]);
  const selectedTier = options.some((o) => o.value === tier)
    ? tier
    : (options.find((o) => o.value === "balanced")?.value ??
      options[0]?.value ??
      "balanced");

  return (
    <>
      <label>
        AI
        <select
          name="agent"
          value={agent}
          onChange={(e) => {
            const next = e.target.value as AgentId;
            setAgent(next);
            const nextOptions = tierOptionsForAgent(next);
            if (!nextOptions.some((o) => o.value === tier)) {
              setTier(
                nextOptions.find((o) => o.value === "balanced")?.value ??
                  nextOptions[0]?.value ??
                  "balanced",
              );
            }
          }}
        >
          {AGENTS.map((id) => (
            <option key={id} value={id}>
              {AGENT_LABEL[id]}
            </option>
          ))}
        </select>
      </label>
      <label>
        モデルと仕事量
        <select
          name="modelTier"
          value={selectedTier}
          onChange={(e) => setTier(e.target.value as ModelTier)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <p className="mc-muted" style={{ margin: 0 }}>
        {modelPickHint(agent, selectedTier)}
      </p>
    </>
  );
}
