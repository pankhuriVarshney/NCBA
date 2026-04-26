import { useState } from 'react';
import { Activity, AlertTriangle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { listNPEs, getAlerts, listNPEsMock, getAlertsMock } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import { NPE, Alert } from '../types/npe';
import StatCard from '../components/StatCard';
import RiskTrendChart from '../components/RiskTrendChart';
import AlertFeed from '../components/AlertFeed';
import RiskBadge from '../components/RiskBadge';
import RiskBar from '../components/RiskBar';

const riskTrend = [
  { t: "00:00", score: 12, anomalies: 1 }, { t: "02:00", score: 9, anomalies: 0 },
  { t: "04:00", score: 18, anomalies: 2 }, { t: "06:00", score: 14, anomalies: 1 },
  { t: "08:00", score: 22, anomalies: 2 }, { t: "10:00", score: 34, anomalies: 4 },
  { t: "12:00", score: 28, anomalies: 3 }, { t: "14:00", score: 67, anomalies: 8 },
  { t: "16:00", score: 45, anomalies: 5 }, { t: "18:00", score: 23, anomalies: 2 },
  { t: "20:00", score: 19, anomalies: 1 }, { t: "Now",   score: 22, anomalies: 2 },
];

interface Props {
  onNavigate: (page: string) => void;
}

export default function OverviewPage({ onNavigate }: Props) {
  const [useMock, setUseMock] = useState(false);

  const { data: npesData } = usePolling(async () => {
    try {
      const res = await listNPEs();
      return res.data as NPE[];
    } catch {
      const res = await listNPEsMock();
      setUseMock(true);
      return res.data as NPE[];
    }
  }, 5000);

  const { data: alertsData } = usePolling(async () => {
    try {
      const res = await getAlerts();
      return res.data as Alert[];
    } catch {
      const res = await getAlertsMock();
      return res.data as Alert[];
    }
  }, 5000);

  const npes = npesData || [];
  const alerts = alertsData || [];
  const topNPEs = [...npes].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {useMock && (
        <div style={{ padding: "8px 12px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 6, fontSize: 12, color: "#fbbf24", fontFamily: "monospace" }}>
          ⚠ Using mock data — API unreachable
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard label="Total NPEs" value={String(npes.length)} sub="+6 monitored" subColor="#34d399" Icon={Activity} accent="#22d3ee" />
        <StatCard label="Active Threats" value={String(alerts.length)} sub="↑ from 0 (8h ago)" subColor="#f87171" Icon={AlertTriangle} accent="#f87171" />
        <StatCard label="Certs Revoked" value="0" sub="Last: —" subColor="#fbbf24" Icon={XCircle} accent="#fbbf24" />
        <StatCard label="Avg Response" value="0.8s" sub="Target <30s ✓" subColor="#34d399" Icon={Clock} accent="#34d399" />
      </div>

      {/* Charts + Alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
        <div style={{ background: "#0d1525", border: "1px solid #1a2640", borderRadius: 8 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1a2640" }}>
            <p style={{ fontSize: 13, color: "#c8d8ec", fontWeight: 500, margin: 0 }}>Risk Score Trend</p>
          </div>
          <div style={{ padding: "16px 8px 8px" }}>
            <RiskTrendChart data={riskTrend} />
          </div>
        </div>

        <div style={{ background: "#0d1525", border: "1px solid #1a2640", borderRadius: 8, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1a2640", display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, color: "#c8d8ec", fontWeight: 500, margin: 0 }}>Alert Feed</p>
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "#22d3ee", background: "rgba(8,51,68,0.5)", border: "1px solid rgba(34,211,238,0.2)", padding: "2px 8px", borderRadius: 4 }}>● LIVE</span>
          </div>
          <AlertFeed alerts={alerts} />
        </div>
      </div>

      {/* Top NPEs */}
      <div style={{ background: "#0d1525", border: "1px solid #1a2640", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #1a2640", display: "flex", justifyContent: "space-between" }}>
          <p style={{ fontSize: 13, color: "#c8d8ec", fontWeight: 500, margin: 0 }}>Highest Risk NPEs</p>
          <button onClick={() => onNavigate("npe")} style={{ fontSize: 11, fontFamily: "monospace", color: "#22d3ee", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            View all <ChevronRight size={12} />
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1a2640" }}>
              {["NPE Identity", "Score", "Level", "Last Seen"].map(c => (
                <th key={c} style={{ padding: "8px 16px", textAlign: "left", fontSize: 10, fontFamily: "monospace", color: "#4a607a", fontWeight: "normal", textTransform: "uppercase" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topNPEs.map(n => (
              <tr key={n.spiffe_id} style={{ borderBottom: "1px solid #111c2c" }}>
                <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#22d3ee" }}>{n.name}</td>
                <td style={{ padding: "10px 16px" }}><RiskBar value={n.score} /></td>
                <td style={{ padding: "10px 16px" }}><RiskBadge level={n.level} /></td>
                <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#4a607a" }}>
                  {new Date(n.last_seen * 1000).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}