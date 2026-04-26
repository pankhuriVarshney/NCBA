interface Props {
  value: number;
}

export default function RiskBar({ value }: Props) {
  const color = value >= 85 ? "#f87171" : value >= 60 ? "#fb923c" : value >= 30 ? "#fbbf24" : "#34d399";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 64, height: 4, background: "#1e2d45", borderRadius: 9999, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: color, borderRadius: 9999 }} />
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 12, color }}>{value.toFixed(0)}</span>
    </div>
  );
}