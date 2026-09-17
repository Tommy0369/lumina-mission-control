import { Badge, Panel } from "@lumina/ui";
import { getRoutingRules } from "@/lib/services";

export default async function RoutingPage() {
  const rules = await getRoutingRules();

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>振り分けルール（詳しく）</h1>
          <p>普段は見なくていい。おすすめAIの決め方。</p>
        </div>
      </header>
      <Panel title="いま有効なルール">
        <p className="mc-muted" style={{ margin: "0 0 12px" }}>
          画面の説明用。実際のおすすめは裏の固定ルールで決まる。
        </p>
        <div className="mc-list">
          {rules.map((rule) => (
            <div key={rule.id} className="mc-row">
              <div>
                <div style={{ fontWeight: 600 }}>{rule.name}</div>
                <div className="mc-muted mc-mono">
                  {JSON.stringify(rule.condition)} → {JSON.stringify(rule.result)}
                </div>
              </div>
              <Badge tone={rule.active ? "green" : "neutral"}>
                優先 {rule.priority}
              </Badge>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
