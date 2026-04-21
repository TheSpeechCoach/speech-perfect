import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
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
    date: s.sessions?.started_at ? format(new Date(s.sessions.started_at), "MMM d") : "",
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
      <div className="container-page py-10 md:py-14 space-y-12">
        <div>
          <div className="eyebrow">Progress</div>
          <h1 className="font-display text-4xl md:text-5xl mt-2">The numbers don't lie.</h1>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[hsl(var(--hairline))] border border-[hsl(var(--hairline))]">
          <Kpi label="Sessions" value={`${scores.length}`} />
          <Kpi label="Best score" value={`${best || "—"}`} />
          <Kpi label="Current streak" value={`${streak?.current_streak || 0}d`} />
          <Kpi label="Avg pace" value={avgPace ? `${avgPace} WPM` : "—"} />
          <Kpi label="Avg fillers" value={`${avgFillers}`} />
        </div>

        {/* Trend chart */}
        <section className="card-flat p-6 md:p-8">
          <div className="flex items-baseline justify-between mb-6">
            <div className="eyebrow">Overall score trend</div>
            <div className={`font-mono text-xs ${delta >= 0 ? "text-foreground" : "text-accent"}`}>
              {scores.length > 1 ? `${delta >= 0 ? "+" : ""}${delta} since start` : "Need 2+ sessions"}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid stroke="hsl(var(--hairline))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--hairline))", fontFamily: "Work Sans" }} />
                <Line type="monotone" dataKey="overall" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Sub-scores */}
        <section className="grid md:grid-cols-2 gap-6">
          {(["clarity", "pace", "filler", "structure"] as const).map(k => (
            <div key={k} className="card-flat p-6">
              <div className="eyebrow mb-2">{k}</div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                    <CartesianGrid stroke="hsl(var(--hairline))" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--hairline))" }} />
                    <Line type="monotone" dataKey={k} stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </section>

        {/* Programme */}
        {programme && (
          <section className="card-flat p-8">
            <div className="eyebrow">Programme progress</div>
            <div className="mt-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="font-display text-3xl">{programme.title}</div>
                <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mt-1">{completed} / {totalSessions} sessions · {programme.weeks} weeks</div>
              </div>
              <div className="font-display text-5xl tabular-nums">{pct}%</div>
            </div>
            <div className="mt-4 h-1 bg-[hsl(var(--hairline))]"><div className="h-full bg-foreground" style={{ width: `${pct}%` }} /></div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-6">
      <div className="eyebrow">{label}</div>
      <div className="font-display text-4xl tabular-nums mt-2">{value}</div>
    </div>
  );
}
