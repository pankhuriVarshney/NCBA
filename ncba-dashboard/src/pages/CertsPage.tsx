// CertsPage.tsx
import { useState } from 'react';
import { Lock, Clock, XCircle } from 'lucide-react';
import { listNPEs } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import { NPE } from '../types/npe';
import Pill from '../components/Pill';

const CERT_CFG = {
  active:   { text: "#34d399", bg: "rgba(6,78,59,0.35)",   border: "rgba(52,211,153,0.25)" },
  expiring: { text: "#fbbf24", bg: "rgba(92,61,0,0.4)",     border: "rgba(251,191,36,0.25)" },
  revoked:  { text: "#f87171", bg: "rgba(127,29,29,0.4)",   border: "rgba(248,113,113,0.25)" },
};

interface CertRow {
  serial: string;
  npe: string;
  issued: string;
  expires: string;
  pct: number;
  status: "active" | "expiring" | "revoked";
}

function generateMockCerts(npes: NPE[]): CertRow[] {
  return npes.map((npe, i) => {
    const pct = [78, 44, 62, 31, 88, 0][i % 6];
    const status: "active" | "expiring" | "revoked" = 
      npe.level === "REVOKE" ? "revoked" : pct >= 80 ? "expiring" : "active";
    return {
      serial: `${(0x4F7A2B3C + i * 0x11111111).toString(16).toUpperCase().slice(0, 8)}`,
      npe: npe.name,
      issued: new Date(Date.now() - pct * 3600e3).toLocaleTimeString(),
      expires: status === "revoked" ? "—" : new Date(Date.now() + (100 - pct) * 3600e3).toLocaleTimeString(),
      pct,
      status,
    };
  });
}

export default function CertsPage() {
  const { data: npesData } = usePolling(async () => {
    try { return (await listNPEs()).data as NPE[]; }
    catch { return []; }
  }, 5000);

  const npes = npesData || [];
  const certs = generateMockCerts(npes.length > 0 ? npes : [
    { name: "payment-api", level: "RATE_LIMIT" } as NPE,
    { name: "postgres-primary", level: "GREEN" } as NPE,
    { name: "auth-svc", level: "GREEN" } as NPE,
    { name: "legacy-erp", level: "CHALLENGE" } as NPE,
    { name: "notification-svc", level: "GREEN" } as NPE,
    { name: "sensor-044", level: "REVOKE" } as NPE,
  ]);

  const stats = {
    active: certs.filter(c => c.status === "active").length,
    expiring: certs.filter(c => c.status === "expiring").length,
    revoked: certs.filter(c => c.status === "revoked").length,
    pending: 47, // mock
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Total Active", value: String(stats.active), color: "#34d399", icon: Lock },
          { label: "Expiring <30min", value: String(stats.expiring), color: "#fbbf24", icon: Clock },
          { label: "Pending Renewal", value: String(stats.pending), color: "#22d3ee", icon: Clock },
          { label: "Revoked Today", value: String(stats.revoked), color: "#f87171", icon: XCircle },
        ].map(s => (
          <div key={s.label} style={{ background: "#0d1525", border: "1px solid #1a2640", borderRadius: 8, padding: 16 }}>
            <p style={{ fontSize: 10, color: "#4a607a", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>{s.label}</p>
            <p style={{ fontSize: 24, fontFamily: "monospace", fontWeight: 600, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#0d1525", border: "1px solid #1a2640", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #1a2640", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 13, color: "#c8d8ec", fontWeight: 500, margin: 0 }}>Certificate Registry</p>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#4a607a" }}>SPIRE/SPIFFE · 1–24h TTL · auto-renew @ 80%</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1a2640" }}>
              {["Serial", "NPE", "Issued At", "Expires At", "Lifetime Used", "Status"].map(c => (
                <th key={c} style={{ padding: "8px 16px", textAlign: "left", fontSize: 10, fontFamily: "monospace", color: "#4a607a", fontWeight: "normal", textTransform: "uppercase" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {certs.map(c => (
              <tr key={c.serial} style={{ borderBottom: "1px solid #111c2c" }}>
                <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#22d3ee" }}>{c.serial}</td>
                <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#c8d8ec" }}>{c.npe}</td>
                <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#64748b" }}>{c.issued}</td>
                <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: c.status === "revoked" ? "#f87171" : c.status === "expiring" ? "#fbbf24" : "#94a3b8" }}>{c.expires}</td>
                <td style={{ padding: "10px 16px", minWidth: 200 }}>
                  {c.status !== "revoked" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: "#1a2640", borderRadius: 9999, overflow: "hidden" }}>
                        <div style={{ width: `${c.pct}%`, height: "100%", borderRadius: 9999, background: c.pct >= 80 ? "#fbbf24" : c.pct >= 50 ? "#22d3ee" : "#34d399" }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b", width: 32, textAlign: "right" }}>{c.pct}%</span>
                      {c.pct >= 80 && (
                        <span style={{ fontSize: 10, fontFamily: "monospace", color: "#fbbf24", background: "rgba(92,61,0,0.4)", border: "1px solid rgba(251,191,36,0.2)", padding: "1px 6px", borderRadius: 3 }}>⚠ renew</span>
                      )}
                    </div>
                  ) : <span style={{ color: "#f87171", fontSize: 11, fontFamily: "monospace" }}>REVOKED</span>}
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <Pill label={c.status} cfg={CERT_CFG[c.status]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}