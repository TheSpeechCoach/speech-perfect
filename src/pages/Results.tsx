import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ScoreBar, ScoreRing } from "@/components/ScoreVisuals";
import { ArrowRight, AlertCircle, CheckCircle2, AlertTriangle, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Results() {
  const { id } = useParams();
  const { user } = useAuth();
  const [score, setScore] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data: s } = await supabase.from("session_scores").select("*").eq("session_id", id).maybeSingle();
      const { data: ex } = await supabase.from("session_exercises").select("*").eq("session_id", id).order("created_at");
      setScore(s); setExercises(ex || []);
      const urls: Record<string, string> = {};
      for (const e of ex || []) {
        if (e.audio_path) {
          const { data } = await supabase.storage.from("recordings").createSignedUrl(e.audio_path, 60 * 60);
          if (data?.signedUrl) urls[e.id] = data.signedUrl;
        }
      }
      setAudioUrls(urls);
    })();
  }, [id, user]);

  if (!score) return <AppLayout><div className="container-page py-12 text-muted-foreground">Loading results…</div></AppLayout>;

  return (
    <AppLayout>
      <div className="container-page py-10 md:py-14 space-y-12">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="eyebrow">Session results</div>
            <h1 className="font-display text-4xl md:text-5xl mt-2">Here's the scoreboard.</h1>
          </div>
          <Link to="/app/session" className="hidden md:inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background hover:bg-accent transition-colors">
            <Mic className="h-4 w-4" /> Run another
          </Link>
        </div>

        {/* Overall + breakdown */}
        <div className="grid md:grid-cols-3 gap-px bg-[hsl(var(--hairline))] border border-[hsl(var(--hairline))]">
          <div className="bg-background p-8 flex flex-col justify-between md:col-span-1">
            <div>
              <div className="eyebrow">Overall score</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-8xl tabular-nums leading-none">{score.overall}</span>
                <span className="font-mono text-sm text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Mini label="WPM" value={score.wpm} />
              <Mini label="Fillers" value={score.filler_count} />
              <Mini label="Avg sent." value={score.avg_sentence_length} />
            </div>
          </div>
          <div className="bg-background p-8 md:col-span-2 grid grid-cols-2 gap-x-12 gap-y-6">
            <ScoreBar label="Clarity" value={score.clarity} />
            <ScoreBar label="Pace" value={score.pace} />
            <ScoreBar label="Filler" value={score.filler} />
            <ScoreBar label="Structure" value={score.structure} />
          </div>
        </div>

        {/* Feedback cards */}
        <section>
          <div className="eyebrow mb-4">Feedback</div>
          <div className="grid md:grid-cols-2 gap-4">
            {(score.feedback || []).map((f: any, i: number) => {
              const Icon = f.severity === "good" ? CheckCircle2 : f.severity === "bad" ? AlertCircle : AlertTriangle;
              return (
                <div key={i} className={cn("p-5 border-l-2 bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))]",
                  f.severity === "good" && "border-l-foreground",
                  f.severity === "warn" && "border-l-accent",
                  f.severity === "bad" && "border-l-accent")}>
                  <div className="flex items-start gap-3">
                    <Icon className={cn("h-4 w-4 mt-1", f.severity === "good" ? "text-foreground" : "text-accent")} />
                    <div>
                      <div className="font-display text-xl">{f.title}</div>
                      <p className="mt-1.5 text-sm text-muted-foreground">{f.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Transcripts */}
        <section>
          <div className="eyebrow mb-4">Transcripts & playback</div>
          <div className="space-y-4">
            {exercises.map((e, i) => (
              <div key={e.id} className="card-flat p-6">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[11px] uppercase tracking-widest text-accent">
                    0{i + 1} · {e.exercise_type === "read" ? "Read aloud" : e.exercise_type === "prompt" ? "Speak to prompt" : "Rephrase + deliver"}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{e.duration_seconds}s</div>
                </div>
                <p className="mt-3 text-sm italic text-muted-foreground">{e.prompt}</p>
                {audioUrls[e.id] && <audio controls src={audioUrls[e.id]} className="mt-4 w-full" />}
                <div className="mt-4 p-4 bg-[hsl(var(--surface-2))] border border-[hsl(var(--hairline))] text-sm whitespace-pre-wrap">
                  {e.transcript || <span className="text-muted-foreground">No transcript captured.</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tomorrow */}
        <section className="bg-foreground text-background p-8 md:p-12">
          <div className="eyebrow text-background/60">Tomorrow</div>
          <h2 className="font-display text-3xl md:text-5xl mt-2">{score.overall >= 80 ? "Hold the line." : score.overall >= 60 ? "Tighten one thing." : "Rebuild the basics."} <span className="italic text-accent">5 minutes.</span></h2>
          <p className="mt-4 text-background/70 max-w-2xl">
            {score.pace < 60 ? "Tomorrow, focus on pace. Aim for 130–155 WPM." :
             score.filler < 60 ? "Tomorrow, replace every filler with a one-second pause." :
             score.structure < 60 ? "Tomorrow, write a single thesis line before you record. Land it at the end." :
             "Tomorrow, run the same drill. Try to beat today's score by 3 points."}
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/app/session" className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-background hover:bg-accent/90"><Mic className="h-4 w-4" /> Run tomorrow's session now</Link>
            <Link to="/app/progress" className="inline-flex items-center gap-2 px-5 py-3 border border-background/30 hover:bg-background hover:text-foreground transition-colors">View progress <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Mini({ label, value }: { label: string; value: any }) {
  return (
    <div className="border border-[hsl(var(--hairline))] p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-2xl tabular-nums leading-tight mt-1">{value}</div>
    </div>
  );
}
