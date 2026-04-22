import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Mic, ArrowRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ScoreBar } from "@/components/ScoreVisuals";

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [latest, setLatest] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [programme, setProgramme] = useState<any>(null);
  const [up, setUp] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: s }, { data: scores }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("streaks").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("session_scores").select("*, sessions(started_at)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setProfile(p); setStreak(s);
      setLatest(scores?.[0] || null);
      setRecent(scores || []);
      if (p?.current_programme_id) {
        const { data: prog } = await supabase.from("programmes").select("*").eq("id", p.current_programme_id).maybeSingle();
        setProgramme(prog);
        const { data: u } = await supabase.from("user_programmes").select("*").eq("user_id", user.id).eq("programme_id", p.current_programme_id).eq("active", true).maybeSingle();
        setUp(u);
      }
    })();
  }, [user]);

  const totalSessions = (programme?.weeks || 4) * 7;
  const completed = up?.completed_sessions || 0;
  const pct = Math.min(100, Math.round((completed / totalSessions) * 100));
  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <AppLayout>
      <div className="container-page py-12 md:py-20 space-y-16 md:space-y-20">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="space-y-3">
            <div className="eyebrow">{format(new Date(), "EEEE · d MMMM")}</div>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-tight max-w-2xl">
              {firstName ? `${firstName}.` : "Today's session."}<br />
              <span className="text-muted-foreground">Five minutes. One take.</span>
            </h1>
          </div>
          <Link
            to="/app/session"
            className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-4 hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium self-start whitespace-nowrap"
          >
            <Mic className="h-4 w-4" /> Start session <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        {/* Three-figure metric strip */}
        <section className="grid grid-cols-3 border-y border-[hsl(var(--hairline))]">
          <Metric label="Streak" value={`${streak?.current_streak || 0}`} unit="days" />
          <Metric label="Last score" value={latest ? `${latest.overall}` : "—"} unit={latest ? "/100" : ""} divider />
          <Metric label="Sessions" value={`${recent.length >= 5 ? "5+" : recent.length}`} unit="" divider />
        </section>

        {/* Latest session — restrained, single block */}
        {latest ? (
          <section className="space-y-6">
            <div className="flex items-baseline justify-between">
              <div className="eyebrow">Latest take</div>
              <Link to={`/app/results/${latest.session_id}`} className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors">
                Full results →
              </Link>
            </div>
            <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-start">
              <div className="md:col-span-4">
                <div className="font-display text-[7rem] md:text-[8rem] tabular-nums leading-[0.85] tracking-tight">{latest.overall}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-3">Overall · /100</div>
              </div>
              <div className="md:col-span-8 space-y-5 md:pt-4">
                <ScoreBar label="Clarity" value={latest.clarity} />
                <ScoreBar label="Pace" value={latest.pace} />
                <ScoreBar label="Filler" value={latest.filler} />
                <ScoreBar label="Structure" value={latest.structure} />
              </div>
            </div>
          </section>
        ) : (
          <section className="border-l-2 border-accent pl-6 py-2">
            <div className="eyebrow">No data yet</div>
            <p className="mt-2 text-base">Run your first session to begin baselining.</p>
          </section>
        )}

        {/* Programme + Recent sessions, two columns of plain lists */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          {/* Programme */}
          <section>
            <div className="eyebrow mb-5">Programme</div>
            {programme ? (
              <div className="space-y-5">
                <div>
                  <div className="font-display text-2xl md:text-3xl leading-tight">{programme.title}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-2">
                    {completed} / {totalSessions} sessions · week {Math.min(Math.ceil(completed / 7) || 1, programme.weeks)} of {programme.weeks}
                  </div>
                </div>
                <div className="flex items-baseline gap-3">
                  <div className="font-display text-4xl tabular-nums">{pct}%</div>
                  <div className="flex-1 h-px bg-[hsl(var(--hairline))] relative">
                    <div className="absolute inset-y-0 left-0 h-px bg-foreground" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <Link to="/app/programmes" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors inline-block">
                  All programmes →
                </Link>
              </div>
            ) : (
              <Link to="/app/programmes" className="text-sm hover:text-accent">Choose a programme →</Link>
            )}
          </section>

          {/* Recent */}
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <div className="eyebrow">Recent</div>
              <Link to="/app/progress" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors">
                Progress →
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="text-sm text-muted-foreground">No sessions yet.</div>
            ) : (
              <ul className="divide-y divide-[hsl(var(--hairline))] border-t border-b border-[hsl(var(--hairline))]">
                {recent.map(r => (
                  <li key={r.id}>
                    <Link
                      to={`/app/results/${r.session_id}`}
                      className="flex items-center justify-between py-4 group hover:text-foreground transition-colors"
                    >
                      <div className="flex items-baseline gap-5 min-w-0">
                        <div className="font-display text-2xl tabular-nums w-10 text-right">{r.overall}</div>
                        <div className="min-w-0">
                          <div className="text-sm truncate">{r.sessions?.started_at ? formatDistanceToNow(new Date(r.sessions.started_at), { addSuffix: true }) : "Recent"}</div>
                          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.18em] mt-0.5">
                            P{r.pace} · F{r.filler} · C{r.clarity}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function Metric({ label, value, unit, divider }: { label: string; value: string; unit?: string; divider?: boolean }) {
  return (
    <div className={`py-6 md:py-8 ${divider ? "border-l border-[hsl(var(--hairline))] pl-6 md:pl-8" : ""}`}>
      <div className="eyebrow">{label}</div>
      <div className="mt-2 md:mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-3xl md:text-5xl tabular-nums leading-none">{value}</span>
        {unit && <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
