interface Props {
  label: string;
  cfg: { text: string; bg: string; border: string };
}

export default function Pill({ label, cfg }: Props) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 4,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.text, fontSize: 11, fontFamily: "monospace"
    }}>
      {label}
    </span>
  );
}