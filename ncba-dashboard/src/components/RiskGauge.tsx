export default function RiskGauge({ score, level }: { score: number; level: string }) {
  const getColor = () => {
    if (score < 30) return '#22c55e';
    if (score < 60) return '#eab308';
    if (score < 85) return '#f97316';
    return '#dc2626';
  };

  const pct = Math.min(score, 100);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-48 h-28">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#374151" strokeWidth="20" />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={getColor()}
          strokeWidth="20"
          strokeDasharray={`${pct * 2.51} 251`}
          strokeLinecap="round"
        />
        <text x="100" y="95" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
          {score.toFixed(0)}
        </text>
      </svg>
      <span className="text-sm font-bold mt-1" style={{ color: getColor() }}>{level}</span>
    </div>
  );
}