// NPEPage.tsx
import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { listNPEs, listNPEsMock } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import { NPE } from '../types/npe';
import RiskBadge from '../components/RiskBadge';
import RiskBar from '../components/RiskBar';

export default function NPEPage() {
  const [q, setQ] = useState("");
  const [useMock, setUseMock] = useState(false);

  // Poll NPEs from API
  const { data: npesData, loading } = usePolling(async () => {
    try {
      const res = await listNPEs();
      return res.data as NPE[];
    } catch (err) {
      console.warn('[NPEPage] API failed, falling back to mock:', err);
      const res = await listNPEsMock();
      setUseMock(true);
      return res.data as NPE[];
    }
  }, 5000);

  const npes = npesData || [];
  
  // Filter by search query
  const filtered = npes.filter(n =>
    n.name.toLowerCase().includes(q.toLowerCase()) ||
    n.spiffe_id.toLowerCase().includes(q.toLowerCase()) ||
    n.level.toLowerCase().includes(q.toLowerCase())
  );

  // Filter buttons
  const filters = ["ALL", "GREEN", "CHALLENGE", "RATE_LIMIT", "REVOKE"];
  const activeFilter = filters.includes(q.toUpperCase()) ? q.toUpperCase() : "ALL";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      
      {/* Mock warning */}
      {useMock && (
        <div style={{ 
          padding: "8px 12px", 
          background: "rgba(251,191,36,0.1)", 
          border: "1px solid rgba(251,191,36,0.3)", 
          borderRadius: 6, 
          fontSize: 12, 
          color: "#fbbf24", 
          fontFamily: "monospace" 
        }}>
          ⚠ Using mock data — API unreachable
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ 
          flex: 1, 
          display: "flex", 
          alignItems: "center", 
          gap: 8,
          background: "#0d1525", 
          border: "1px solid #1a2640", 
          borderRadius: 6, 
          padding: "7px 12px" 
        }}>
          <Search size={14} style={{ color: "#4a607a", flexShrink: 0 }} />
          <input 
            value={q} 
            onChange={e => setQ(e.target.value)}
            placeholder="Search SPIFFE ID, name, or level..."
            style={{ 
              flex: 1, 
              background: "transparent", 
              border: "none", 
              outline: "none",
              fontSize: 12, 
              fontFamily: "monospace", 
              color: "#c8d8ec" 
            }} 
          />
        </div>
        
        {filters.map(f => (
          <button 
            key={f} 
            onClick={() => setQ(f === "ALL" ? "" : f)}
            style={{ 
              padding: "7px 12px", 
              fontSize: 11, 
              fontFamily: "monospace",
              background: activeFilter === f ? "rgba(34,211,238,0.08)" : "#0d1525", 
              border: activeFilter === f ? "1px solid rgba(34,211,238,0.18)" : "1px solid #1a2640", 
              borderRadius: 5,
              color: activeFilter === f ? "#22d3ee" : "#64748b", 
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            {f}
          </button>
        ))}
        
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 6, 
            padding: "7px 12px",
            fontSize: 11, 
            fontFamily: "monospace", 
            background: "rgba(8,51,68,0.4)",
            border: "1px solid rgba(34,211,238,0.2)", 
            borderRadius: 5, 
            color: "#22d3ee", 
            cursor: "pointer" 
          }}
        >
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* Loading state */}
      {loading && npes.length === 0 && (
        <div style={{ 
          padding: "40px", 
          textAlign: "center", 
          fontSize: 12, 
          fontFamily: "monospace", 
          color: "#4a607a" 
        }}>
          Loading NPE data...
        </div>
      )}

      {/* NPE Table */}
      <div style={{ 
        background: "#0d1525", 
        border: "1px solid #1a2640", 
        borderRadius: 8, 
        overflow: "hidden" 
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1a2640" }}>
              {["#", "SPIFFE ID", "Name", "Score", "Level", "Last Seen"].map(c => (
                <th key={c} style={{ 
                  padding: "8px 16px", 
                  textAlign: "left", 
                  fontSize: 10, 
                  fontFamily: "monospace", 
                  color: "#4a607a", 
                  fontWeight: "normal", 
                  textTransform: "uppercase",
                  letterSpacing: "0.08em"
                }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ 
                  padding: "20px 16px", 
                  textAlign: "center", 
                  fontSize: 12, 
                  fontFamily: "monospace", 
                  color: "#4a607a" 
                }}>
                  {npes.length === 0 ? "No NPE data available" : "No matching NPEs"}
                </td>
              </tr>
            )}
            {filtered.map((n, i) => (
              <tr 
                key={n.spiffe_id} 
                style={{ borderBottom: "1px solid #111c2c" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ 
                  padding: "10px 16px", 
                  fontSize: 12, 
                  fontFamily: "monospace", 
                  color: "#2a3d55" 
                }}>
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td style={{ 
                  padding: "10px 16px", 
                  fontSize: 11, 
                  fontFamily: "monospace", 
                  color: "#22d3ee",
                  maxWidth: 280,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {n.spiffe_id}
                </td>
                <td style={{ 
                  padding: "10px 16px", 
                  fontSize: 12, 
                  fontFamily: "monospace", 
                  color: "#c8d8ec" 
                }}>
                  {n.name}
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <RiskBar value={n.score} />
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <RiskBadge level={n.level} score={n.score} />
                </td>
                <td style={{ 
                  padding: "10px 16px", 
                  fontSize: 12, 
                  fontFamily: "monospace", 
                  color: "#4a607a" 
                }}>
                  {n.last_seen ? new Date(n.last_seen * 1000).toLocaleTimeString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination footer */}
        <div style={{ 
          padding: "10px 16px", 
          borderTop: "1px solid #1a2640",
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center" 
        }}>
          <p style={{ 
            fontSize: 11, 
            fontFamily: "monospace", 
            color: "#4a607a", 
            margin: 0 
          }}>
            Showing {filtered.length} of {npes.length} NPEs
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            {["1"].map(p => (
              <button 
                key={p} 
                style={{ 
                  width: 28, 
                  height: 28, 
                  fontSize: 11, 
                  fontFamily: "monospace",
                  borderRadius: 4, 
                  cursor: "pointer",
                  background: "rgba(8,51,68,0.5)",
                  border: "1px solid rgba(34,211,238,0.3)",
                  color: "#22d3ee" 
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}