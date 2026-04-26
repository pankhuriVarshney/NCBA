import { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  sub: string;
  subColor: string;
  Icon: LucideIcon;
  accent: string;
}

export default function StatCard({ label, value, sub, subColor, Icon, accent }: Props) {
  return (
    <div style={{
      background: "#0d1525", border: "1px solid #1a2640", borderRadius: 8, padding: 16
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{
          fontSize: 10, color: "#4a607a", fontFamily: "monospace",
          textTransform: "uppercase", letterSpacing: "0.1em", margin: 0
        }}>
          {label}
        </p>
        <Icon size={13} style={{ color: accent }} />
      </div>
      <p style={{ fontSize: 24, fontFamily: "monospace", fontWeight: 600, color: accent, margin: 0 }}>
        {value}
      </p>
      <p style={{ fontSize: 11, fontFamily: "monospace", color: subColor, marginTop: 4, marginBottom: 0 }}>
        {sub}
      </p>
    </div>
  );
}