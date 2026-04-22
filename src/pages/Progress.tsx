import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format } from "date-fns";

export default function Progress() {
  const { user } = useAuth();
  const [scores, setScores] = useState<any[]>([]);
  const [streak, setStreak] = useState<any>(null);
  const [up, setUp] = useState<any>(null);
  const [programme, setProgramme] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: s }, { data: st }, { data: profile }] = await Promise.all([
        supabase.from("session_scores").select("*, sessions(started_at)").eq("user_id", user.id).order("created_at"),
        supabase.from("streaks").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("current_programme_id").eq("id", user.id).maybeSingle(),
      ]);
      setScores(s || []); setStreak(st);
      if (profile?.current_programme_id) {
        const [{ data: prog }, { data: u }] = await Promise.all([
          supabase.from("programmes").select("*").eq("id", profile.current_programme_id).maybeSingle(),
          supabase.from("user_programmes").select("*").eq("user_id", user.id).eq("programme_id", profile.current_programme_id).eq("active", true).maybeSingle(),
        ]);
        setProgramme(prog); setUp(u);
      }
    })();
  }, [user]);

  const data = scores.map(s => ({
    date: s.sessions?.started_at ? format(new Date(s.sessions.started_at), "d MMM") : "",
    overall: s.overall, clarity: s.clarity, pace: s.pace, filler: s.filler, structure: s.structure,
    wpm: s.wpm, fillers: s.filler_count,
  }));
  const best = scores.reduce((m, s) => Math.max(m, s.overall), 0);
  const avgPace = scores.length ? Math.round(scores.reduce((a, s) => a + s.wpm, 0) / scores.length) : 0;
  const avgFillers = scores.length ? +(scores.reduce((a, s) => a + s.filler_count, 0) / scores.length).toFixed(1) : 0;
  const first = scores[0]?.overall || 0;
  const last = scores[scores.length - 1]?.overall || 0;
  const delta = last - first;

  const totalSessions = (programme?.weeks || 4) * 7;
  const completed = up?.completed_sessions || 0;
  const pct = Math.min(100, Math.round((completed / totalSessions) * 100));

  return (
    <AppLayout>
      <div className="container-page py-12 md:py-20 space-y-16 md:space-y-20">
        {/* Header */}
        <header className="space-y-3">
          <div className="eyebrow">Progress</div>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-tight max-w-2xl">
            Performance over time.
          </h1>
        </header>

        {/* KPIs — flat row, no boxes-within-boxes */}
        <section className="grid grid-cols-2 md:grid-cols-5 border-y border-[hsl(var(--hairline))]">
          <Kpi label="Sessions" value={`${scores.length}`} />
          <Kpi label="Best" value={`${best || "—"}`} divider />
          <Kpi label="Streak" value={`${streak?.current_streak || 0}d`} divider />
          <Kpi label="Avg WPM" value={avgPace ? `${avgPace}` : "—"} divider />
          <Kpi label="Avg fillers" value={`${avgFillers}`} divider />
        </section>

        {/* Overall trend */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between">
            <div className="eyebrow">Overall trend</div>
            <div className={`font-mono text-[10px] uppercase tracking-[0.22em] ${delta >= 0 ? "text-foreground" : "text-accent"}`}>
              {scores.length > 1 ? `${delta >= 0 ? "+" : ""}${delta} since start` : "Need 2+ sessions"}
            </div>
          </div>
          <div className="h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--hairline))" }}
                  fontFamily="JetBrains Mono"
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  ticks={[0, 50, 100]}
                  fontFamily="JetBrains Mono"
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--hairline))",
                    borderRadius: 0,
                    fontFamily: "JetBrains Mono",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                  cursor={{ stroke: "hsl(var(--hairline))", strokeDasharray: "2 2" }}
                />
                <Line
                  type="monotone"
                  dataKey="overall"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={1.5}
                  dot={{ r: 2, fill: "hsl(var(--foreground))", strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: "hsl(var(--accent))", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Sub-scores — simple sparklines, no axes, no grid */}
        <section className="space-y-6">
          <div className="eyebrow">Dimensions</div>
          <div className="grid grid-cols-2 md:grid-cols-4 border-y border-[hsl(var(--hairline))]">
            {(["clarity", "pace", "filler", "structure"] as const).map((k, idx) => {
              const latest = data[data.length - 1]?.[k] ?? 0;
              return (
                <div key={k} className={`p-5 md:p-6 ${idx > 0 ? "md:border-l border-[hsl(var(--hairline))]" : ""} ${idx === 1 ? "border-l border-[hsl(var(--hairline))] md:border-l" : ""} ${idx >= 2 ? "border-t md:border-t-0 border-[hsl(var(--hairline))]" : ""} ${idx === 3 ? "border-l border-[hsl(var(--hairline))]" : ""}`}>
                  <div className="eyebrow capitalize">{k}</div>
                  <div className="mt-2 font-display text-3xl tabular-nums">{latest || "—"}</div>
                  <div className="mt-3 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
                        <Line
                          type="monotone"
                          dataKey={k}
                          stroke="hsl(var(--accent))"
                          strokeWidth={1.25}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Programme */}
        {programme && (
          <section className="space-y-5">
            <div className="eyebrow">Programme</div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="font-display text-2xl md:text-3xl">{programme.title}</div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.22em] mt-2">
                  {completed} / {totalSessions} sessions · {programme.weeks} weeks
                </div>
              </div>
              <div className="font-display text-5xl tabular-nums">{pct}%</div>
            </div>
            <div className="h-px bg-[hsl(var(--hairline))] relative">
              <div className="absolute inset-y-0 left-0 h-px bg-foreground" style={{ width: `${pct}%` }} />
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}

function Kpi({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <div className={`py-6 md:py-7 px-5 md:px-6 ${divider ? "md:border-l border-[hsl(var(--hairline))]" : ""}`}>
      <div className="eyebrow">{label}</div>
      <div className="font-display text-3xl md:text-4xl tabular-nums mt-2">{value}</div>
    </div>
  );
}
