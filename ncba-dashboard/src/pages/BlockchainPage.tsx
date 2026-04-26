//BlockchainPage.tsx
import { Link, Radio } from 'lucide-react';
import Pill from '../components/Pill';

const CHAIN_CFG = {
  REVOCATION: { text: "#f87171", bg: "rgba(127,29,29,0.4)", border: "rgba(248,113,113,0.25)" },
  BEHAVIORAL: { text: "#fbbf24", bg: "rgba(92,61,0,0.4)", border: "rgba(251,191,36,0.25)" },
  ISSUED:     { text: "#22d3ee", bg: "rgba(8,51,68,0.4)", border: "rgba(34,211,238,0.25)" },
  RENEWAL:    { text: "#34d399", bg: "rgba(6,78,59,0.35)", border: "rgba(52,211,153,0.25)" },
};

const mockChainLog = [
  { block: 18842, hash: "0x4f7a…b83c", type: "REVOCATION" as const, npe: "iot/sensor-044", ts: "14:32:01", sigs: 2 },
  { block: 18841, hash: "0x2c1e…a47f", type: "BEHAVIORAL" as const, npe: "service/payment-api", ts: "14:31:48", sigs: 1 },
  { block: 18840, hash: "0x8b3d…f291", type: "ISSUED" as const, npe: "service/auth-svc", ts: "14:10:22", sigs: 1 },
  { block: 18839, hash: "0x9e5a…c662", type: "RENEWAL" as const, npe: "iot/sensor-012", ts: "14:18:05", sigs: 1 },
  { block: 18838, hash: "0x1a9c…d445", type: "BEHAVIORAL" as const, npe: "proxy/legacy-erp", ts: "14:29:33", sigs: 1 },
  { block: 18837, hash: "0x7f2b…e118", type: "ISSUED" as const, npe: "service/billing-svc", ts: "13:44:02", sigs: 1 },
];

export default function BlockchainPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Current Block", value: "18,842", color: "#22d3ee" },
          { label: "Total Events", value: "94,271", color: "#c8d8ec" },
          { label: "Revocations", value: "6", color: "#f87171" },
          { label: "Consensus", value: "3/3 Orgs", color: "#34d399" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0d1525", border: "1px solid #1a2640", borderRadius: 8, padding: 16 }}>
            <p style={{ fontSize: 10, color: "#4a607a", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>{s.label}</p>
            <p style={{ fontSize: 24, fontFamily: "monospace", fontWeight: 600, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Peers */}
      <div style={{ background: "#0d1525", border: "1px solid #1a2640", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 24 }}>
        <p style={{ fontSize: 10, fontFamily: "monospace", color: "#4a607a", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, whiteSpace: "nowrap" }}>
          Hyperledger Fabric — Raft
        </p>
        {["peer0.org1", "peer0.org2", "peer0.org3"].map(p => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>{p}.ncba.local</span>
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "#34d399" }}>SYNCED</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 16, fontSize: 10, fontFamily: "monospace" }}>
          <span style={{ color: "#22d3ee" }}>ncba_chaincode v1.0</span>
          <span style={{ color: "#4a607a" }}>·</span>
          <span style={{ color: "#fbbf24" }}>Multi-sig: 2-of-3</span>
        </div>
      </div>

      {/* Chain log */}
      <div style={{ background: "#0d1525", border: "1px solid #1a2640", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #1a2640", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 13, color: "#c8d8ec", fontWeight: 500, margin: 0 }}>Immutable Audit Log</p>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#4a607a" }}>Hyperledger Fabric · append-only · Merkle-verified</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1a2640" }}>
              {["Block #", "Tx Hash", "Event Type", "NPE Identity", "Timestamp", "Signatures"].map(c => (
                <th key={c} style={{ padding: "8px 16px", textAlign: "left", fontSize: 10, fontFamily: "monospace", color: "#4a607a", fontWeight: "normal", textTransform: "uppercase" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockChainLog.map(ev => (
              <tr key={ev.hash} style={{ borderBottom: "1px solid #111c2c" }}>
                <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#4a607a" }}>#{ev.block}</td>
                <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#22d3ee" }}>{ev.hash}</td>
                <td style={{ padding: "10px 16px" }}>
                  <Pill label={ev.type} cfg={CHAIN_CFG[ev.type]} />
                </td>
                <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#94a3b8" }}>ncba/{ev.npe}</td>
                <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "monospace", color: "#4a607a" }}>{ev.ts}</td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: ev.sigs >= 2 ? "#34d399" : "#fbbf24" }}>{ev.sigs}/3</span>
                  {ev.sigs >= 2 && (
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "#34d399", marginLeft: 10 }}>✓ finalized</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}