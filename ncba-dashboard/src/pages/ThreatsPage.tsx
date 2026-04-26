// ThreatsPage.tsx
import { AlertTriangle, Shield, Ban, Zap } from 'lucide-react';
import { getAlerts, getAlertsMock } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import { Alert } from '../types/npe';
import RiskBadge from '../components/RiskBadge';
import Pill from '../components/Pill';

const ALERT_CFG = {
  CRITICAL: { text: "#f87171", bg: "rgba(127,29,29,0.4)", border: "rgba(248,113,113,0.25)" },
  HIGH:     { text: "#fb923c", bg: "rgba(124,45,18,0.4)", border: "rgba(251,146,60,0.25)" },
  MEDIUM:   { text: "#fbbf24", bg: "rgba(92,61,0,0.4)", border: "rgba(251,191,36,0.25)" },
  LOW:      { text: "#38bdf8", bg: "rgba(7,89,133,0.3)", border: "rgba(56,189,248,0.25)" },
};

const mockIncidents = [
  {
    id: "INC-2024-001",
    npe: "spiffe://ncba.local/iot/sensor-044",
    risk: 91,
    level: "REVOKE" as const,
    time: "14:32:01",
    summary: "Certificate presented from unregistered IP 10.99.88.77 — consistent with key theft. Serial 9E5A revoked within 0.6s. Event logged on Fabric block #18842 with 2-of-3 multi-sig.",
    factors: { behavioral: 85, temporal: 95, peer: 90, threat_intel: 70 },
    action: "REVOKED + IP BLOCKED",
  },
  {
    id: "INC-2024-002",
    npe: "spiffe://ncba.local/service/payment-api",
    risk: 78,
    level: "RATE_LIMIT" as const,
    time: "14:31:48",
    summary: "TLS cipher suite changed from established baseline (TLS_AES_256_GCM_SHA384) to a weak RC4 variant. Behavioral deviation score 80/100 across 3 feature dimensions.",
    factors: { behavioral: 80, temporal: 60, peer: 75, threat_intel: 40 },
    action: "RATE LIMITED",
  },
];

export default function ThreatsPage() {
  const { data: alertsData } = usePolling(async () => {
    try { return (await getAlerts()).data as Alert[]; }
    catch { return (await getAlertsMock()).data as Alert[]; }
  }, 5000);

  const alerts = alertsData || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p style={{ fontSize: 10, fontFamily: "monospace", color: "#4a607a", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Active Incidents</p>

      {mockIncidents.map(inc => {
        const lc = {
          GREEN: { dot: "#34d399" }, CHALLENGE: { dot: "#fbbf24" },
          RATE_LIMIT: { dot: "#fb923c" }, REVOKE: { dot: "#f87171" }
        }[inc.level];
        return (
          <div key={inc.id} style={{
            background: "rgba(30,8,8,0.6)", border: "1px solid rgba(248,113,113,0.15)",
            borderLeft: `3px solid ${lc.dot}`, borderRadius: 8, padding: 18
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#f87171", background: "rgba(127,29,29,0.5)", border: "1px solid rgba(248,113,113,0.25)", padding: "2px 10px", borderRadius: 4 }}>{inc.id}</span>
                <RiskBadge level={inc.level} score={inc.risk} />
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "#4a607a" }}>{inc.time}</span>
              </div>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "#fbbf24", background: "rgba(92,61,0,0.4)", border: "1px solid rgba(251,191,36,0.2)", padding: "3px 10px", borderRadius: 4 }}>{inc.action}</span>
            </div>
            <p style={{ fontSize: 11, fontFamily: "monospace", color: "#22d3ee", margin: "0 0 8px" }}>{inc.npe}</p>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: "0 0 18px" }}>{inc.summary}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              {Object.entries(inc.factors).map(([k, v]) => {
                const weights: Record<string, string> = { behavioral: "40%", temporal: "30%", peer: "20%", threat_intel: "10%" };
                return (
                  <div key={k}>
                    <p style={{ fontSize: 10, fontFamily: "monospace", color: "#4a607a", textTransform: "uppercase", margin: "0 0 6px" }}>
                      {k.replace("_", " ")} · {weights[k]}
                    </p>
                    <div style={{ height: 4, background: "#1a2640", borderRadius: 9999, overflow: "hidden", marginBottom: 5 }}>
                      <div style={{ width: `${v}%`, height: "100%", background: "#f87171", borderRadius: 9999 }} />
                    </div>
                    <p style={{ fontSize: 11, fontFamily: "monospace", color: "#f87171", margin: 0 }}>{v} / 100</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div>
        <p style={{ fontSize: 10, fontFamily: "monospace", color: "#4a607a", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Recent Alerts (24h)</p>
        <div style={{ background: "#0d1525", border: "1px solid #1a2640", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1a2640" }}>
                {["Time", "Level", "Event", "Action Taken"].map(c => (
                  <th key={c} style={{ padding: "8px 16px", textAlign: "left", fontSize: 10, fontFamily: "monospace", color: "#4a607a", fontWeight: "normal", textTransform: "uppercase" }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #111c2c" }}>
                  <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#4a607a" }}>
                    {new Date(a.timestamp * 1000).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <Pill label={a.level} cfg={ALERT_CFG[a.level as keyof typeof ALERT_CFG] || ALERT_CFG.LOW} />
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#94a3b8" }}>
                    {a.spiffe_id?.split('/').pop()}: {a.msg || `Risk score ${a.score.toFixed(1)}`}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#22d3ee" }}>
                    → {a.action || "Auto-response triggered"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}