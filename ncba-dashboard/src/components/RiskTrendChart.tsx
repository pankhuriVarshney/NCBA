import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  t: string;
  score: number;
  anomalies: number;
}

interface Props {
  data: DataPoint[];
}

const TooltipStyle = {
  contentStyle: { background: "#0d1525", border: "1px solid #1a2640", borderRadius: 6, fontSize: 11, fontFamily: "monospace" },
  labelStyle: { color: "#64748b" },
  itemStyle: { color: "#e2e8f0" },
};

export default function RiskTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <AreaChart data={data} margin={{ top: 0, right: 8, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gAnom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f87171" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2640" />
        <XAxis dataKey="t" tick={{ fill: "#4a607a", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#4a607a", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
        <Tooltip {...TooltipStyle} />
        <Area type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={1.5} fill="url(#gRisk)" name="Risk" />
        <Area type="monotone" dataKey="anomalies" stroke="#f87171" strokeWidth={1.5} fill="url(#gAnom)" name="Anomalies" />
      </AreaChart>
    </ResponsiveContainer>
  );
}