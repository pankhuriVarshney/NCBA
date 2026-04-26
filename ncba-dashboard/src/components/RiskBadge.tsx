import { RiskLevel } from '../types/npe';

const LEVEL_CFG: Record<RiskLevel, { dot: string; text: string; badge: string; border: string }> = {
  GREEN:      { dot: "#34d399", text: "#34d399", badge: "rgba(6,78,59,0.35)",    border: "rgba(52,211,153,0.25)" },
  CHALLENGE:  { dot: "#fbbf24", text: "#fbbf24", badge: "rgba(92,61,0,0.4)",     border: "rgba(251,191,36,0.25)" },
  RATE_LIMIT: { dot: "#fb923c", text: "#fb923c", badge: "rgba(124,45,18,0.4)",   border: "rgba(251,146,60,0.25)" },
  REVOKE:     { dot: "#f87171", text: "#f87171", badge: "rgba(127,29,29,0.4)",   border: "rgba(248,113,113,0.25)" },
};

interface Props {
  level: RiskLevel;
  score?: number;
}

export default function RiskBadge({ level, score }: Props) {
  const c = LEVEL_CFG[level] || LEVEL_CFG.GREEN;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "2px 8px", borderRadius: 4,
      background: c.badge, border: `1px solid ${c.border}`,
      color: c.text, fontSize: 11, fontFamily: "monospace"
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {score !== undefined && <span>{score.toFixed(1)}</span>}
      <span>{level}</span>
    </span>
  );
}