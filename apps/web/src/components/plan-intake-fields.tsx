import { planIntakeFieldLabels } from "@/lib/plan-intake";

const { TOUCH_LABEL, PROD_LABEL, DEADLINE_LABEL } = planIntakeFieldLabels();

export function PlanIntakeFields() {
  return (
    <div className="mc-form" style={{ gap: 12 }}>
      <p className="mc-muted" style={{ margin: 0, fontSize: 13 }}>
        3 問に答えると、おすすめAIの<strong>初推定</strong>が少し正確になる（固定ルール +
        ヒアリング。最適保証ではない）。
      </p>
      <label>
        1. どこを触る？
        <select name="touchSurface" defaultValue="unknown" required>
          {Object.entries(TOUCH_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        2. 本番・ユーザーへの影響は？
        <select name="productionExposure" defaultValue="local_only" required>
          {Object.entries(PROD_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        3. いつまでに？
        <select name="deadline" defaultValue="flexible" required>
          {Object.entries(DEADLINE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
