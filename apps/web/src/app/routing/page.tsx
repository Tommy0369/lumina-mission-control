import { Badge, Panel } from "@lumina/ui";
import { getRoutingRules } from "@/lib/services";

export default async function RoutingPage() {
  const rules = await getRoutingRules();

  return (
    <>
      <header className="mc-header">
        <div>
          <h1>Routing</h1>
          <p>V0.1 is rule-based. No ML yet.</p>
        </div>
      </header>
      <Panel title="Active Rules">
        <div className="mc-list">
          {rules.map((rule) => (
            <div key={rule.id} className="mc-row">
              <div>
                <div style={{ fontWeight: 600 }}>{rule.name}</div>
                <div className="mc-muted mc-mono">
                  if {JSON.stringify(rule.condition)} → {JSON.stringify(rule.result)}
                </div>
              </div>
              <Badge tone={rule.active ? "green" : "neutral"}>
                P{rule.priority}
              </Badge>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
