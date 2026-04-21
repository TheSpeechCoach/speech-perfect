import { cn } from "@/lib/utils";

export function ScoreRing({ value, label, size = 120 }: { value: number; label?: string; size?: number }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const dash = (v / 100) * c;
  return (
    <div className="inline-flex flex-col items-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} stroke="hsl(var(--hairline))" strokeWidth="6" fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke={v >= 80 ? "hsl(var(--foreground))" : v >= 60 ? "hsl(var(--foreground))" : "hsl(var(--accent))"}
          strokeWidth="6" fill="none" strokeLinecap="butt"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="-mt-[calc(50%+18px)] font-display text-4xl tabular-nums">{Math.round(v)}</div>
      {label && <div className="mt-[calc(50%-12px)] eyebrow">{label}</div>}
    </div>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <div className="eyebrow">{label}</div>
        <div className="font-mono text-sm tabular-nums">{Math.round(v)}</div>
      </div>
      <div className="h-1 bg-[hsl(var(--hairline))] relative overflow-hidden">
        <div className={cn("absolute inset-y-0 left-0", v < 60 ? "bg-accent" : "bg-foreground")} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
