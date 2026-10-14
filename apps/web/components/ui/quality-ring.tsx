interface Props {
  score: number;
  size?: number;
  className?: string;
}

export function QualityRing({ score, size = 48, className = '' }: Props) {
  const color = score >= 80 ? 'var(--color-accent)' : score >= 50 ? 'var(--color-sev-media)' : 'var(--color-sev-alta)';
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${color} ${pct * 3.6}deg, var(--color-s3) 0)`,
        }}
      />
      <div
        className="absolute rounded-full bg-s1"
        style={{
          inset: size > 40 ? 4 : 3,
        }}
      />
      <span
        className="relative font-display font-bold"
        style={{
          fontSize: size > 40 ? 14 : 11,
          color,
        }}
      >
        {score}
      </span>
    </div>
  );
}
