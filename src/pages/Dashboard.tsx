import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Flame, ArrowRight, ChevronRight } from "lucide-react";
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
        supabase.from("profiles").select("*, programmes:current_programme_id(id,title,weeks,daily_sessions)").eq("id", user.id).maybeSingle(),
        supabase.from("streaks").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("session_scores").select("*, sessions(started_at)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(6),
      ]);
      setProfile(p); setStreak(s);
      setLatest(scores?.[0] || null);
      setRecent(scores || []);
      if (p?.programmes) {
        setProgramme(p.programmes);
        const { data: u } = await supabase.from("user_programmes").select("*").eq("user_id", user.id).eq("programme_id", p.programmes.id).eq("active", true).maybeSingle();
        setUp(u);
      }
    })();
  }, [user]);

  const totalSessions = (programme?.weeks || 4) * 7;
  const completed = up?.completed_sessions || 0;
  const pct = Math.min(100, Math.round((completed / totalSessions) * 100));

  return (
    <AppLayout>
      <div className="container-page py-10 md:py-14 space-y-12">
        {/* Welcome */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="eyebrow">{format(new Date(), "EEEE · d MMM")}</div>
            <h1 className="font-display text-4xl md:text-5xl mt-2">
              {profile?.full_name ? `Ready, ${profile.full_name.split(" ")[0]}.` : "Ready to train."}
              <span className="italic text-accent"> Five minutes.</span>
            </h1>
          </div>
          <Link to="/app/session" className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-4 hover:bg-accent transition-colors self-start">
            <Mic className="h-4 w-4" /> Start daily session <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[hsl(var(--hairline))] border border-[hsl(var(--hairline))]">
          <Stat label="Current streak" value={`${streak?.current_streak || 0}`} unit="days" icon={<Flame className="h-4 w-4 text-accent" />} />
          <Stat label="Longest streak" value={`${streak?.longest_streak || 0}`} unit="days" />
          <Stat label="Last score" value={latest ? `${latest.overall}` : "—"} unit={latest ? "/100" : ""} />
          <Stat label="Sessions logged" value={`${recent.length >= 6 ? "6+" : recent.length}`} unit="" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Latest summary */}
          <section className="md:col-span-2 card-flat p-8">
            <div className="flex items-center justify-between">
              <div className="eyebrow">Latest session</div>
              {latest && <Link to={`/app/results/${latest.session_id}`} className="text-xs hover:text-accent inline-flex items-center gap-1">View results <ChevronRight className="h-3 w-3" /></Link>}
            </div>
            {latest ? (
              <div className="mt-6 grid sm:grid-cols-5 gap-8 items-center">
                <div className="sm:col-span-2">
                  <div className="font-display text-7xl tabular-nums">{latest.overall}</div>
                  <div className="eyebrow mt-1">Overall</div>
                </div>
                <div className="sm:col-span-3 space-y-4">
                  <ScoreBar label="Clarity" value={latest.clarity} />
                  <ScoreBar label="Pace" value={latest.pace} />
                  <ScoreBar label="Filler" value={latest.filler} />
                  <ScoreBar label="Structure" value={latest.structure} />
                </div>
              </div>
            ) : (
              <div className="mt-8 text-muted-foreground">No sessions yet. Run your first one to start the scoreboard.</div>
            )}
          </section>

          {/* Programme progress */}
          <section className="card-flat p-8">
            <div className="eyebrow">Current programme</div>
            {programme ? (
              <>
                <div className="font-display text-2xl mt-2 leading-tight">{programme.title}</div>
                <div className="mt-6">
                  <div className="flex items-baseline justify-between">
                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{completed} / {totalSessions} sessions</div>
                    <div className="font-display text-2xl tabular-nums">{pct}%</div>
                  </div>
                  <div className="mt-2 h-1 bg-[hsl(var(--hairline))]"><div className="h-full bg-foreground" style={{ width: `${pct}%` }} /></div>
                </div>
                <Link to="/app/programmes" className="mt-6 inline-flex items-center gap-1 text-sm hover:text-accent">All programmes <ChevronRight className="h-3 w-3" /></Link>
              </>
            ) : (
              <Link to="/app/programmes" className="mt-4 inline-block text-sm hover:text-accent">Choose a programme →</Link>
            )}
          </section>
        </div>

        {/* Recent sessions */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <div className="eyebrow">Recent sessions</div>
            <Link to="/app/progress" className="text-xs hover:text-accent">View progress →</Link>
          </div>
          <div className="border border-[hsl(var(--hairline))]">
            {recent.length === 0 && <div className="p-6 text-muted-foreground text-sm">Nothing yet.</div>}
            {recent.map((r, i) => (
              <Link key={r.id} to={`/app/results/${r.session_id}`}
                className={`flex items-center justify-between gap-4 p-5 hover:bg-[hsl(var(--surface-2))] ${i > 0 ? "border-t border-[hsl(var(--hairline))]" : ""}`}>
                <div className="flex items-center gap-5 min-w-0">
                  <div className="font-display text-3xl tabular-nums w-14">{r.overall}</div>
                  <div className="min-w-0">
                    <div className="text-sm">{r.sessions?.started_at ? formatDistanceToNow(new Date(r.sessions.started_at), { addSuffix: true }) : "Recent"}</div>
                    <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                      Pace {r.pace} · Filler {r.filler} · Clarity {r.clarity}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, unit, icon }: { label: string; value: string; unit?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-background p-6">
      <div className="flex items-center gap-2 eyebrow">{icon} {label}</div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-5xl tabular-nums leading-none">{value}</span>
        {unit && <span className="font-mono text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
