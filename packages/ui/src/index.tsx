import type { CSSProperties, ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "yellow" | "red" | "blue" | "purple";
}) {
  const colors: Record<string, CSSProperties> = {
    neutral: { background: "#e8e6e1", color: "#2a2a28" },
    green: { background: "#d8f0df", color: "#14532d" },
    yellow: { background: "#f8e9c0", color: "#713f12" },
    red: { background: "#f8d7d3", color: "#7f1d1d" },
    blue: { background: "#d7e6f8", color: "#1e3a5f" },
    purple: { background: "#e8dff5", color: "#4c1d95" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.02em",
        ...colors[tone],
      }}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  max = 100,
  label,
}: {
  value: number;
  max?: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ display: "grid", gap: 4 }}>
      {label ? (
        <div style={{ fontSize: 12, color: "#5c5a55" }}>{label}</div>
      ) : null}
      <div
        style={{
          height: 8,
          background: "#e8e6e1",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "#1f4b3a",
          }}
        />
      </div>
    </div>
  );
}

export function Panel({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid #d9d5cc",
        background: "#fbfaf7",
        borderRadius: 8,
        padding: 16,
        display: "grid",
        gap: 12,
      }}
    >
      {(title || actions) && (
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          {title ? (
            <h2
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#5c5a55",
              }}
            >
              {title}
            </h2>
          ) : (
            <span />
          )}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles: Record<string, CSSProperties> = {
    primary: {
      background: "#1f4b3a",
      color: "#f7f4ee",
      border: "1px solid #1f4b3a",
    },
    secondary: {
      background: "#f7f4ee",
      color: "#1f4b3a",
      border: "1px solid #c9c3b6",
    },
    ghost: {
      background: "transparent",
      color: "#3b3a36",
      border: "1px solid transparent",
    },
    danger: {
      background: "#7f1d1d",
      color: "#fff",
      border: "1px solid #7f1d1d",
    },
  };
  return (
    <button
      {...props}
      style={{
        padding: "8px 14px",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 600,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.5 : 1,
        ...styles[variant],
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}
