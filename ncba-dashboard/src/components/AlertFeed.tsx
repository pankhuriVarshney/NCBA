import { AlertTriangle, Shield, Ban, Zap } from 'lucide-react';
import { Alert } from '../types/npe';
import Pill from './Pill';

const ALERT_CFG: Record<string, { text: string; bg: string; border: string }> = {
  CRITICAL: { text: "#f87171", bg: "rgba(127,29,29,0.4)",   border: "rgba(248,113,113,0.25)" },
  HIGH:     { text: "#fb923c", bg: "rgba(124,45,18,0.4)",   border: "rgba(251,146,60,0.25)" },
  MEDIUM:   { text: "#fbbf24", bg: "rgba(92,61,0,0.4)",     border: "rgba(251,191,36,0.25)" },
  LOW:      { text: "#38bdf8", bg: "rgba(7,89,133,0.3)",    border: "rgba(56,189,248,0.25)" },
};

const icons: Record<string, any> = {
  CHALLENGE: Zap,
  RATE_LIMIT: AlertTriangle,
  REVOKE: Ban,
};

interface Props {
  alerts: Alert[];
}

export default function AlertFeed({ alerts }: Props) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
      {alerts.length === 0 && <p style={{ color: "#4a607a", fontSize: 12, padding: "0 16px" }}>No active alerts</p>}
      {alerts.map((alert, i) => {
        const Icon = icons[alert.level] || Shield;
        const c = ALERT_CFG[alert.level] || ALERT_CFG.LOW;
        return (
          <div key={i} style={{
            padding: "10px 16px", borderBottom: "1px solid #111c2c"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <Pill label={alert.level} cfg={c} />
              <span style={{ fontSize: 10, fontFamily: "monospace", color: "#4a607a", marginLeft: "auto" }}>
                {new Date(alert.timestamp * 1000).toLocaleTimeString()}
              </span>
            </div>
            <p style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8", margin: "0 0 3px", lineHeight: 1.4 }}>
              {alert.spiffe_id?.split('/').pop()}: {alert.msg || `Risk score ${alert.score.toFixed(1)}`}
            </p>
            <p style={{ fontSize: 11, fontFamily: "monospace", color: "#22d3ee", margin: 0 }}>
              → {alert.action || "Auto-response triggered"}
            </p>
          </div>
        );
      })}
    </div>
  );
}