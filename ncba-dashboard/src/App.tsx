import { useState } from 'react';
import { Shield, Activity, Cpu, Lock, AlertTriangle, Link, Bell, Settings, Eye, Radio, Database } from 'lucide-react';
import OverviewPage from './pages/OverviewPage';
import NPEPage from './pages/NPEPage';
import CertsPage from './pages/CertsPage';
import ThreatsPage from './pages/ThreatsPage';
import BlockchainPage from './pages/BlockchainPage';

const NAV = [
  { id: "overview", label: "Overview", icon: Activity, badge: null },
  { id: "npe", label: "NPE Monitor", icon: Cpu, badge: null },
  { id: "certs", label: "Certificates", icon: Lock, badge: "18" },
  { id: "threats", label: "Threat Detection", icon: AlertTriangle, badge: "2" },
  { id: "blockchain", label: "Blockchain Audit", icon: Link, badge: null },
];

const VIEW_TITLES: Record<string, string> = {
  overview: "Security Overview", npe: "NPE Monitor", certs: "Certificate Lifecycle",
  threats: "Threat Detection", blockchain: "Blockchain Audit Trail",
};

export default function App() {
  const [view, setView] = useState("overview");

  return (
    <div style={{ display: "flex", height: "100vh", background: "#070c15", color: "#c8d8ec", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", background: "#09101e", borderRight: "1px solid #1a2640" }}>
        <div style={{ padding: "18px 16px", borderBottom: "1px solid #1a2640" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
              <Shield size={17} style={{ color: "#22d3ee" }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", letterSpacing: "0.08em", margin: 0 }}>NCBA</p>
              <p style={{ fontSize: 10, fontFamily: "monospace", color: "#4a607a", margin: 0 }}>v2.1.0 · LIVE</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "8px 8px" }}>
          {NAV.map(({ id, label, icon: Icon, badge }) => {
            const active = view === id;
            return (
              <button key={id} onClick={() => setView(id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 6, marginBottom: 2,
                background: active ? "rgba(34,211,238,0.08)" : "transparent",
                border: active ? "1px solid rgba(34,211,238,0.18)" : "1px solid transparent",
                color: active ? "#22d3ee" : "#64748b", cursor: "pointer", textAlign: "left", fontSize: 13
              }}>
                <Icon size={14} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge && (
                  <span style={{ fontSize: 10, fontFamily: "monospace", color: id === "threats" ? "#f87171" : "#fbbf24", background: id === "threats" ? "rgba(127,29,29,0.5)" : "rgba(92,61,0,0.4)", border: `1px solid ${id === "threats" ? "rgba(248,113,113,0.25)" : "rgba(251,191,36,0.2)"}`, padding: "1px 6px", borderRadius: 4 }}>{badge}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ background: "#09101e", borderBottom: "1px solid #1a2640", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{VIEW_TITLES[view]}</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", fontSize: 11, fontFamily: "monospace", color: "#4a607a", background: "#0d1525", border: "1px solid #1a2640", borderRadius: 5 }}>
              <Radio size={12} style={{ color: "#22d3ee" }} /> Snort SCI Active
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", fontSize: 11, fontFamily: "monospace", color: "#4a607a", background: "#0d1525", border: "1px solid #1a2640", borderRadius: 5 }}>
              <Database size={12} style={{ color: "#34d399" }} /> Fabric: 3/3 Peers
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {view === "overview" && <OverviewPage onNavigate={setView} />}
          {view === "npe" && <NPEPage />}
          {view === "certs" && <CertsPage />}
          {view === "threats" && <ThreatsPage />}
          {view === "blockchain" && <BlockchainPage />}
        </div>
      </main>
    </div>
  );
}