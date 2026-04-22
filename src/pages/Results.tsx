import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ScoreBar } from "@/components/ScoreVisuals";
import { ArrowRight, Mic } from "lucide-react";
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

  if (!score) {
    return (
      <AppLayout>
        <div className="container-page py-16">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Loading results…</div>
        </div>
      </AppLayout>
    );
  }

  const verdict =
    score.overall >= 85 ? "Strong take." :
    score.overall >= 70 ? "Solid. Tighten one dimension." :
    score.overall >= 55 ? "Workable. Two issues to address." :
    "Below baseline. Rebuild fundamentals.";

  return (
    <AppLayout>
      <div className="container-page py-12 md:py-20 space-y-16 md:space-y-20">
        {/* Header */}
        <header className="space-y-4">
          <div className="eyebrow">Session results</div>
          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-tight max-w-3xl">
            {verdict}
          </h1>
        </header>

        {/* Overall score — single dominant figure */}
        <section className="grid md:grid-cols-12 gap-8 md:gap-12 border-y border-[hsl(var(--hairline))] py-10 md:py-14">
          <div className="md:col-span-5">
            <div className="eyebrow mb-3">Overall</div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[7rem] md:text-[10rem] tabular-nums leading-[0.8] tracking-tighter">{score.overall}</span>
              <span className="font-mono text-xs text-muted-foreground">/100</span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-px bg-[hsl(var(--hairline))] border border-[hsl(var(--hairline))]">
              <Mini label="WPM" value={score.wpm} />
              <Mini label="Fillers" value={score.filler_count} />
              <Mini label="Avg sent." value={score.avg_sentence_length} />
            </div>
          </div>
          <div className="md:col-span-7 space-y-5 md:pt-2">
            <ScoreBar label="Clarity" value={score.clarity} />
            <ScoreBar label="Pace" value={score.pace} />
            <ScoreBar label="Filler" value={score.filler} />
            <ScoreBar label="Structure" value={score.structure} />
          </div>
        </section>

        {/* Feedback — clinical, no icons, no celebration */}
        {(score.feedback || []).length > 0 && (
          <section>
            <div className="eyebrow mb-6">Diagnostics</div>
            <ul className="divide-y divide-[hsl(var(--hairline))] border-t border-b border-[hsl(var(--hairline))]">
              {(score.feedback || []).map((f: any, i: number) => (
                <li key={i} className="py-6 md:py-7 grid md:grid-cols-12 gap-4 md:gap-8">
                  <div className="md:col-span-3 flex items-baseline gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={cn(
                      "font-mono text-[10px] uppercase tracking-[0.22em]",
                      f.severity === "good" ? "text-foreground" : "text-accent"
                    )}>
                      {f.severity === "good" ? "Pass" : f.severity === "warn" ? "Adjust" : "Fault"}
                    </span>
                  </div>
                  <div className="md:col-span-9">
                    <div className="font-display text-xl md:text-2xl leading-tight">{f.title}</div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Transcripts */}
        <section>
          <div className="eyebrow mb-6">Takes</div>
          <div className="space-y-10">
            {exercises.map((e, i) => (
              <article key={e.id} className="space-y-4">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                    0{i + 1} · {e.exercise_type === "read" ? "Read aloud" : e.exercise_type === "prompt" ? "Speak to prompt" : "Rephrase"}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground tabular-nums">{e.duration_seconds}s</div>
                </div>
                <p className="text-sm text-muted-foreground italic">{e.prompt}</p>
                {audioUrls[e.id] && <audio controls src={audioUrls[e.id]} className="w-full h-9" />}
                <div className="border-l-2 border-[hsl(var(--hairline))] pl-4 text-base leading-relaxed">
                  {e.transcript || <span className="text-muted-foreground">No transcript captured.</span>}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Next take — minimal, instructive */}
        <section className="border-t border-[hsl(var(--hairline))] pt-10 md:pt-14">
          <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-end">
            <div className="md:col-span-8 space-y-4">
              <div className="eyebrow">Next session</div>
              <h2 className="font-display text-3xl md:text-5xl leading-[1.1] tracking-tight max-w-2xl">
                {score.pace < 60 ? "Target pace. 130–155 WPM." :
                 score.filler < 60 ? "Replace every filler with a one-second pause." :
                 score.structure < 60 ? "Write a single thesis line before recording. Land it at the end." :
                 "Run the same drill. Beat this score by three points."}
              </h2>
            </div>
            <div className="md:col-span-4 flex flex-col gap-2 md:items-end">
              <Link to="/app/session" className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm font-medium">
                <Mic className="h-4 w-4" /> Run next session
              </Link>
              <Link to="/app/progress" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors">
                View progress <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Mini({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-background p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="font-display text-2xl tabular-nums leading-tight mt-1.5">{value}</div>
    </div>
  );
}
