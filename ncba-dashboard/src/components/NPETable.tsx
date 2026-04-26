import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { listNPEs, listNPEsMock } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import { NPE } from '../types/npe';
import RiskBadge from '../components/RiskBadge';
import RiskBar from '../components/RiskBar';

export default function NPEPage() {
  const [q, setQ] = useState("");

  const { data: npesData } = usePolling(async () => {
    try { return (await listNPEs()).data as NPE[]; }
    catch { return (await listNPEsMock()).data as NPE[]; }
  }, 5000);

  const npes = npesData || [];
  const filtered = npes.filter(n =>
    n.name.toLowerCase().includes(q.toLowerCase()) ||
    n.level.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#0d1525", border: "1px solid #1a2640", borderRadius: 6, padding: "7px 12px" }}>
          <Search size={14} style={{ color: "#4a607a" }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search NPE..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 12, fontFamily: "monospace", color: "#c8d8ec" }} />
        </div>
        {["ALL", "GREEN", "CHALLENGE", "RATE_LIMIT", "REVOKE"].map(f => (
          <button key={f} onClick={() => setQ(f === "ALL" ? "" : f)} style={{ padding: "7px 12px", fontSize: 11, fontFamily: "monospace", background: "#0d1525", border: "1px solid #1a2640", borderRadius: 5, color: "#64748b", cursor: "pointer" }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ background: "#0d1525", border: "1px solid #1a2640", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1a2640" }}>
              {["#", "SPIFFE ID", "Score", "Level", "Last Seen"].map(c => (
                <th key={c} style={{ padding: "8px 16px", textAlign: "left", fontSize: 10, fontFamily: "monospace", color: "#4a607a", fontWeight: "normal", textTransform: "uppercase" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((n, i) => (
              <tr key={n.spiffe_id} style={{ borderBottom: "1px solid #111c2c" }}>
                <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#2a3d55" }}>{String(i + 1).padStart(2, "0")}</td>
                <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#22d3ee" }}>{n.spiffe_id}</td>
                <td style={{ padding: "10px 16px" }}><RiskBar value={n.score} /></td>
                <td style={{ padding: "10px 16px" }}><RiskBadge level={n.level} score={n.score} /></td>
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